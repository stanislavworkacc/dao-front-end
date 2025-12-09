import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {ethers, Network} from 'ethers';
import {networkConstantsNames} from "../../common/constants/network.constants";
import {ToastService} from "./toast.service";
import {Web3AuthService} from "./web3-auth.service";
import {take} from "rxjs";
import {environment} from "../../../environments/environment";

export interface WalletInfo {
    address: string;
    balance: string;
    chainId: number;
    networkName: string;
}

@Injectable({
    providedIn: 'root',
})
export class EthereumService {
    private readonly _web3AuthService: Web3AuthService = inject(Web3AuthService);
    private readonly _toastService: ToastService = inject(ToastService);

    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.JsonRpcSigner | null = null;

    public walletInfo: WritableSignal<WalletInfo | null> = signal(null)

    constructor() {
        // this.checkWalletConnection();
        this.initListeners();
    }

    get isConnected(): boolean {
        return this.signer !== null;
    }

    get getProvider(): ethers.BrowserProvider | null {
        return this.provider;
    }

    get getSigner(): ethers.JsonRpcSigner | null {
        return this.signer;
    }

    get getCurrentWalletInfo(): WalletInfo | null {
        return this.walletInfo();
    }

    async connectWallet(account: string): Promise<boolean> {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner(account);
            await this.updateWalletInfo();
            this.authenticate();
            return true;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            return false;
        }
    }

    async disconnectWallet(): Promise<void> {
        this.provider = null;
        this.signer = null;
        this.walletInfo.set(null);
        this._web3AuthService.forceLogout('logout');
    }

    async checkWalletConnection(): Promise<void> {
        if (window.ethereum) {
            try {
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
                await this.updateWalletInfo();
            } catch (error) {
                console.log('No wallet connected');
            }
        }
    }

    private initListeners(): void {
        if (!window.ethereum) return;

        window.ethereum.on('chainChanged', async (_chainId: string) => {
            const isWallet: boolean = !!this.walletInfo();

            if (isWallet) {
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
                await this.updateWalletInfo();

                this._toastService.info('Chain changed');
            }
        });

        window.ethereum.on('accountsChanged', async (accounts: string[]) => {
            const isWallet: boolean = !!this.walletInfo();

            if (isWallet) {
                if (!accounts.length) {
                    await this.disconnectWallet();
                    this._web3AuthService.resetAuth();
                } else {
                    this.provider = new ethers.BrowserProvider(window.ethereum);
                    this.signer = await this.provider.getSigner();
                    await this.updateWalletInfo();
                    this.authenticate();

                    this._toastService.info('Account changed');
                }
            }

        });

        window.ethereum.on('disconnect', async ({code, message}) => {
            this._toastService.info(message);
            // await this.disconnectWallet();

            // switch (code) {
            //     case 1013:
            //         break;
            //     default:
            //         await this.disconnectWallet();
            //
            // }
        });
    }

    authenticate() {
        if (environment.useJWT) {
            this._web3AuthService.authenticate$(this.getCurrentWalletInfo, this)
                .pipe(
                    take(1),
                ).subscribe();
        }
    }

    async updateWalletInfo(): Promise<void> {
        if (!this.signer || !this.provider) return;

        try {
            const address: string = await this.signer.getAddress();
            const balance: bigint = await this.provider.getBalance(address);
            const network: Network = await this.provider.getNetwork();

            const walletInfo: WalletInfo = {
                address: address,
                balance: ethers.formatEther(balance),
                chainId: Number(network.chainId),
                networkName: networkConstantsNames[(Number(network.chainId))] || `Chain ID ${network.chainId}`,
            };

            this.walletInfo.set(walletInfo);
        } catch (error) {
            console.error('Error updating wallet info:', error);
        }
    }

    async sendEthTransaction(to: string, amount: string): Promise<string> {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }

        try {
            const tx = await this.signer.sendTransaction({
                to: to,
                value: ethers.parseEther(amount),
            });

            const receipt = await tx.wait();
            await this.updateWalletInfo();
            return receipt?.hash || '';
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }


    async getContract(
        contractAddress: string,
        abi: any
    ): Promise<ethers.Contract> {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }

        return new ethers.Contract(contractAddress, abi, this.signer);
    }

    async signMessage(message: string): Promise<string> {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }

        return await this.signer.signMessage(message);
    }

    async getGasPrice(): Promise<string> {
        if (!this.provider) {
            throw new Error('Provider not connected');
        }

        const gasPrice = await this.provider.getFeeData();
        return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
    }
}

// Extend Window interface to include ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}
