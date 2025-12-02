import {Injectable, signal, WritableSignal} from '@angular/core';
import {WalletInfo} from "./ethereum";

@Injectable({
    providedIn: 'root'
})
export class WalletService {
    walletInfo: WritableSignal<WalletInfo | null> = signal(null);

    constructor() {
    }
}
