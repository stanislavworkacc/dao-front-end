import {Injectable} from '@angular/core';
import {ethereumConstants} from "../core/constants/ethereum.constants";
import {WalletInfo} from "./ethereum";
import {networkConstantsId} from "../core/constants/network.constants";
import {AppNetwork, HOODI_NETWORK} from "../core/blockchain/networks.config";

@Injectable({providedIn: 'root'})
export class NetworkService {

    async switchToNetwork(network: AppNetwork): Promise<void> {
        if (!window.ethereum) {
            throw new Error('Wallet not found');
        }

        try {
            await window.ethereum.request({
                method: ethereumConstants.switchEthereumChain,
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
            method: ethereumConstants.addEthereumChain,
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