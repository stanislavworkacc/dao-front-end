import {Injectable} from '@angular/core';
import {HOODI_NETWORK} from "../blockchain/hoodi-network.config";
import {ethers} from "ethers";

@Injectable({
    providedIn: 'root'
})
export class RpcProviderService {

    private readonly rpcProvider: ethers.JsonRpcProvider =
        new ethers.JsonRpcProvider(
            HOODI_NETWORK.rpcUrls.default.http[0],
            HOODI_NETWORK.id,
        );

    get getRpcProvider(): ethers.JsonRpcProvider {
        return this.rpcProvider;
    }

    constructor() {
    }
}
