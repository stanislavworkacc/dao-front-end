import {effect, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {environment} from "../../../environments/environment";
import {tokensConstants} from "../../core/constants/tokens.constants";
import {EthereumService} from "../../services/ethereum";
import {ethers} from "ethers";
import {ERC20_ABI} from "../../core/blockchain/abi/erc20.abi";

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    private readonly eth: EthereumService = inject(EthereumService);

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
        const wallet = this.eth.getCurrentWalletInfo;
        const provider = this.eth.getProvider;

        if (!wallet || !provider) {
            return;
        }

        const updated = await Promise.all(
            this.assets().map(async (asset: AssetOption): Promise<AssetOption> => {
                try {
                    switch (asset.symbol) {
                        case tokensConstants.ETH: {
                            const raw: bigint = await provider.getBalance(wallet.address);
                            const formatted: string = ethers.formatEther(raw);
                            return { ...asset, balance: formatted };
                        }

                        case tokensConstants.SBEL: {
                            if (!asset.tokenAddress) {
                                return { ...asset, balance: null };
                            }
                            const erc20 = new ethers.Contract(
                                asset.tokenAddress,
                                ERC20_ABI,
                                provider,
                            );
                            const raw: bigint = await erc20['balanceOf'](wallet.address);
                            return { ...asset, balance: ethers.formatUnits(raw, asset.decimals) };
                        }

                        default:
                            return { ...asset, balance: null };
                    }
                } catch (e) {
                    console.error('Failed to load balance for', asset.symbol, e);
                    return { ...asset, balance: null };
                }
            }),
        );

        this.assets.set(updated);
    }

}
