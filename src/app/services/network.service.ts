// hoodi-network.service.ts
import {Injectable} from '@angular/core';
import {AppNetwork, HOODI_NETWORK} from "../blockchain/networks.config";

@Injectable({providedIn: 'root'})
export class NetworkService {

    async switchToNetwork(network: AppNetwork): Promise<void> {
        if (!window.ethereum) {
            throw new Error('Wallet not found');
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{chainId: network.chainIdHex}],
            });
        } catch (error: any) {
            if (error.code === 4902) {
                await this.donHaveHoodiInWallet(network)
            } else {
                throw error;
            }
        }
    }

    async donHaveHoodiInWallet(network) {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: network.chainIdHex,
                chainName: network.name,
                nativeCurrency: {
                    name: network.symbol,
                    symbol: network.symbol,
                    decimals: network.decimals,
                },
                rpcUrls: ['https://ethereum-hoodi-rpc.publicnode.com'], // твій RPC
                blockExplorerUrls: ['https://hoodi.etherscan.io/'],      // твій explorer
            }],
        });
    }

    async switchToHoodi(): Promise<void> {
        return this.switchToNetwork(HOODI_NETWORK);
    }
}