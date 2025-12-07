import {inject, Injectable} from '@angular/core';
import {RpcProviderService} from "./rpc-provider.service";

@Injectable({providedIn: 'root'})
export class EnsProfileService {
    private readonly _rpcProviderService: RpcProviderService = inject(RpcProviderService);

    async getProfileForAddress(address: string) {
        const provider = this._rpcProviderService.getRpcProviderMain;

        const name = await provider.lookupAddress(address);

        const avatar = await provider.getAvatar(name ?? address);

        let email: string | null = null;
        let twitter: string | null = null;
        let url: string | null = null;
        let description: string | null = null;

        if (name) {
            const resolver = await provider.getResolver(name);
            if (resolver) {
                email = await resolver.getText('email').catch(() => null);
                twitter = await resolver.getText('com.twitter').catch(() => null);
                url = await resolver.getText('url').catch(() => null);
                description = await resolver.getText('description').catch(() => null);
            }
        }

        return {
            address,
            ensName: name,
            avatar,
            email,
            twitter,
            url,
            description,
        };
    }
}