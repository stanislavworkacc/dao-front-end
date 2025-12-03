import {Injectable} from '@angular/core';
import {ethers, JsonRpcProvider} from "ethers";
import {HOODI_NETWORK} from "../core/blockchain/networks.config";

@Injectable({
    providedIn: 'root'
})
export class RpcProviderService {

    private readonly rpcProvider: JsonRpcProvider = new ethers.JsonRpcProvider(
        HOODI_NETWORK.rpcUrls[0],
        HOODI_NETWORK.id,
    );

    get getRpcProvider(): JsonRpcProvider {
        return this.rpcProvider;
    }

    constructor() {
    }
}
