import {EthereumService} from "../../core/services/ethereum";
import {from, map, switchMap} from "rxjs";
import {SiweMessage} from "siwe";

export interface CreateSiweParams {
    address: string;
    chainId: number;
}

export interface CreateSiweResult {
    message: string;
    signature: string;
}

export function signSiweMessagePipe(
    eth: EthereumService,
    params: CreateSiweParams
) {
    return switchMap(({nonce}: {nonce: string}) => {
        const domain: string = window.location.host;
        const uri: string = window.location.origin;

        const siwe = new SiweMessage({
            domain,
            address: params.address,
            statement: 'Sign in to Angular Web3 DApp',
            uri,
            version: '1',
            chainId: params.chainId,
            nonce,
        });

        const prepared: string = siwe.prepareMessage();

        return from(eth.signMessage(prepared)).pipe(
            map((signature) => ({
                message: prepared,
                signature,
            }))
        );
    });
}