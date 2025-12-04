import {Injectable} from '@angular/core';
import {WalletInfo} from "./ethereum";
import {ethereumMethods} from "../../common/constants/ethereum.constants";
import {AppNetwork, HOODI_NETWORK} from "../../common/blockchain/networks.config";
import {networkConstantsId} from "../../common/constants/network.constants";

@Injectable({providedIn: 'root'})
export class NetworkService {

    async switchToNetwork(network: AppNetwork): Promise<void> {
        if (!window.ethereum) {
            throw new Error('Wallet not found');
        }

        try {
            await window.ethereum.request({
                method: ethereumMethods.switchEthereumChain,
                params: [{chainId: network.chainIdHex}],
            });
        } catch (error: any) {
            if (error.code === 4902) {
                await this.addChain(network)
            } else {
                throw error;
            }
        }
    }

    async addChain(network: AppNetwork) {
        await window.ethereum.request({
            method: ethereumMethods.addEthereumChain,
            params: [{
                chainId: network.chainIdHex,
                chainName: network.name,
                nativeCurrency: {
                    name: network.symbol,
                    symbol: network.symbol,
                    decimals: network.decimals,
                },
                rpcUrls: network.rpcUrls,
                blockExplorerUrls: network.explorerUrls,
            }],
        });
    }

    isHoodiNetwork(info: WalletInfo | null): boolean {
        return !!info && info.chainId === networkConstantsId.hoodi;
    }

    async switchToHoodi(): Promise<void> {
        return this.switchToNetwork(HOODI_NETWORK);
    }
}