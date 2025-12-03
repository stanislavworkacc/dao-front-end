import {effect, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {environment} from "../../../environments/environment";
import {tokensConstants} from "../../core/constants/tokens.constants";
import {EthereumService, WalletInfo} from "../../services/ethereum";
import {ethers, JsonRpcProvider} from "ethers";
import {ERC20_ABI} from "../../core/blockchain/abi/erc20.abi";
import {RpcProviderService} from "../../services/rpc-provider.service";

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    private readonly eth: EthereumService = inject(EthereumService);
    private readonly rpc: RpcProviderService = inject(RpcProviderService);


    assets: WritableSignal<AssetOption[]> = signal([
        {
            label: 'ETH token ',
            symbol: tokensConstants.ETH,
            decimals: 18,
            type: 'NATIVE',
            balance: null,
        },
        {
            label: 'SBEL token ',
            symbol: tokensConstants.SBEL,
            type: 'ERC20',
            tokenAddress: environment.TOKEN_CONTRACT,
            decimals: 6,
            balance: null,
        },
    ]);

    selectedAsset: WritableSignal<AssetOption> = signal(this.assets()[0]);

    constructor() {
        effect(() => {
            const wallet = this.eth.walletInfo();
            if (wallet) {
                this.loadAllBalances();
            } else {
                // якщо відключився — обнуляємо
                this.assets.update((list) =>
                    list.map((a) => ({ ...a, balance: null })),
                );
            }
        });
    }

    async loadAllBalances(): Promise<void> {
        const wallet: WalletInfo = this.eth.getCurrentWalletInfo;
        const provider: JsonRpcProvider = this.rpc.getRpcProvider;

        if (!wallet) return;

        const updated = await Promise.all(
            this.assets().map(async (asset) => {
                try {
                    switch (asset.symbol) {
                        case tokensConstants.ETH: {
                            const raw = await provider.getBalance(wallet.address);
                            return {
                                ...asset,
                                balance: ethers.formatEther(raw),
                            };
                        }

                        case tokensConstants.SBEL: {
                            if (!asset.tokenAddress) return { ...asset, balance: null };

                            const erc20 = new ethers.Contract(
                                asset.tokenAddress,
                                ERC20_ABI,
                                provider, // 👈 тепер RPC
                            );

                            const raw = await erc20['balanceOf'](wallet.address);
                            return {
                                ...asset,
                                balance: ethers.formatUnits(raw, asset.decimals),
                            };
                        }

                        default:
                            return { ...asset, balance: null };
                    }
                } catch (e) {
                    console.error('Failed to load', asset.symbol, e);
                    return { ...asset, balance: null };
                }
            }),
        );

        this.assets.set(updated);
    }

}
