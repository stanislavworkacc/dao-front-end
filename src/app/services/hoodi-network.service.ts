import {inject, Injectable} from '@angular/core';
import {EthereumService, WalletInfo} from "./ethereum";

@Injectable({
  providedIn: 'root'
})
export class HoodiNetworkService {
    private readonly _ethereumService: EthereumService = inject(EthereumService)

    isWrongNetwork(info: WalletInfo | null): boolean {
        return !!info && info.chainId !== 560048;
    }

    async switchToHoodiNetwork(): Promise<void> {
        if (!window.ethereum) {
            throw new Error('MetaMask is not installed');
        }

        const HOODI_CHAIN_ID_HEX = '0x88bb0';

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: HOODI_CHAIN_ID_HEX }],
            });
        } catch (e: any) {
            if (e.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: HOODI_CHAIN_ID_HEX,
                            chainName: 'Hoodi',
                            nativeCurrency: {
                                name: 'Hoodi',
                                symbol: 'HOODI',
                                decimals: 18
                            },
                            rpcUrls: ['https://your-hooodi-rpc'],
                            blockExplorerUrls: ['https://your-hooodi-explorer']
                        }
                    ],
                });
            } else {
                throw e;
            }
        }
    }
}
