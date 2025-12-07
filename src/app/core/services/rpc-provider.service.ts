import {Injectable} from '@angular/core';
import {ethers, JsonRpcProvider} from "ethers";
import {ETHEREUM_MAINNET, HOODI_NETWORK} from "../../common/blockchain/networks.config";

@Injectable({
    providedIn: 'root'
})
export class RpcProviderService {

    private readonly rpcProvider: JsonRpcProvider = new ethers.JsonRpcProvider(
        HOODI_NETWORK.rpcUrls[0],
        HOODI_NETWORK.id,
    );

    private readonly mainnetProvider: JsonRpcProvider = new ethers.JsonRpcProvider(
        ETHEREUM_MAINNET.rpcUrls[0],
        ETHEREUM_MAINNET.id,
    );

    get getRpcProvider(): JsonRpcProvider {
        return this.rpcProvider;
    }

    get getRpcProviderMain(): JsonRpcProvider {
        return this.mainnetProvider;
    }

    constructor() {
    }
}
