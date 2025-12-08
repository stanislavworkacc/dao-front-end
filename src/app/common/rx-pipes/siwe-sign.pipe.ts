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

        const now = new Date();
        const expires = new Date(now.getTime() + 10 * 60 * 1000);

        const siwe = new SiweMessage({
            domain,
            address: params.address,
            statement: 'Sign in to Angular Web3 DApp',
            uri,
            version: '1',
            chainId: params.chainId,
            nonce,
            issuedAt: now.toISOString(),
            expirationTime: expires.toISOString(),
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