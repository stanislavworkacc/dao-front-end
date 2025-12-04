import {effect, inject, Injectable, signal, untracked, WritableSignal} from '@angular/core';
import {ethers, JsonRpcProvider} from "ethers";
import {EthereumService, WalletInfo} from "./ethereum";
import {RpcProviderService} from "./rpc-provider.service";
import {tokensConstants, tokenTypes} from "../../common/constants/tokens.constants";
import {environment} from "../../../environments/environment";
import {ERC20_ABI} from "../../common/blockchain/abi/erc20.abi";
import {AssetOption} from "../../components/transaction/transaction.interface";

@Injectable({
    providedIn: 'root',
})
export class WalletService {
    private readonly eth: EthereumService = inject(EthereumService);
    private readonly rpc: RpcProviderService = inject(RpcProviderService);

    assets: WritableSignal<AssetOption[]> = signal([
        {
            label: 'ETH token ',
            symbol: tokensConstants.ETH,
            decimals: 18,
            type: tokenTypes.NATIVE,
            balance: null,
        },
        {
            label: 'SBEL token ',
            symbol: tokensConstants.SBEL,
            type: tokenTypes.ERC20,
            decimals: 6,
            balance: null,
        },
    ]);

    selectedAsset: WritableSignal<AssetOption> = signal(this.assets()[0]);

    constructor() {
        effect(async () => {
            const wallet: WalletInfo = this.eth.walletInfo();

            if (wallet) {
                const assetsSnapshot: AssetOption[] = untracked(() => this.assets());
                const updated = await this.loadAllBalances(wallet, assetsSnapshot);

                this.assets.set(updated);
                this.selectedAsset.set(updated[0]);
                return;
            } else {
                this.assets.update((list: AssetOption[]) => list.map((a) => ({ ...a, balance: null })));
            }
        });
    }

    async loadAllBalances(wallet: WalletInfo, assetsSnapshot: AssetOption[]): Promise<any> {
        const provider: JsonRpcProvider = this.rpc.getRpcProvider;

        if (!wallet) return;

        return await Promise.all(
            assetsSnapshot.map(async (asset: AssetOption) => {
                try {
                    switch (asset.symbol) {
                        case tokensConstants.ETH: {
                            const raw: bigint = await provider.getBalance(wallet.address);
                            return {
                                ...asset,
                                balance: ethers.formatEther(raw),
                            };
                        }

                        case tokensConstants.SBEL: {
                            const erc20 = new ethers.Contract(
                                environment.TOKEN_CONTRACT,
                                ERC20_ABI,
                                provider,
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
    }

}
