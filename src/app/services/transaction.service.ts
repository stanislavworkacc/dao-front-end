import {effect, inject, Injectable, signal, untracked, WritableSignal} from '@angular/core';
import {ethers, JsonRpcProvider} from "ethers";
import {EthereumService, WalletInfo} from "./ethereum";
import {RpcProviderService} from "./rpc-provider.service";
import {tokensConstants} from "../core/constants/tokens.constants";
import {environment} from "../../environments/environment";
import {ERC20_ABI} from "../core/blockchain/abi/erc20.abi";

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
            const wallet: WalletInfo = this.eth.walletInfo();

            if (wallet) {
                const assetsSnapshot: AssetOption[] = untracked(() => this.assets());
                this.loadAllBalances(wallet, assetsSnapshot);
                return;
            } else {
                this.assets.update((list) =>
                    list.map((a) => ({ ...a, balance: null })),
                );
            }
        });
    }

    async loadAllBalances(wallet: WalletInfo, assetsSnapshot: AssetOption[]): Promise<void> {
        const provider: JsonRpcProvider = this.rpc.getRpcProvider;

        if (!wallet) return;

        const updated = await Promise.all(
            assetsSnapshot.map(async (asset) => {
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
