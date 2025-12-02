import {Injectable, signal, WritableSignal} from '@angular/core';
import {environment} from "../../../environments/environment";

@Injectable()
export class TransactionService {
    assets: WritableSignal<AssetOption[]> = signal([
        {
            label: 'Native (ETH / HOODI)',
            symbol: 'ETH',
            type: 'NATIVE',
        },
        {
            label: 'SBEL Token',
            symbol: 'SBEL',
            type: 'ERC20',
            tokenAddress: environment.TOKEN_CONTRACT,
            decimals: 6,
        },
    ]);

    selectedAsset: WritableSignal<AssetOption> = signal(this.assets()[0]);
}
