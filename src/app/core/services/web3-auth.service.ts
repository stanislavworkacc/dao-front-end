import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {Web3AuthApiService} from './web3-auth-api.service';
import {
    catchError,
    map,
    of,
    switchMap,
    tap,
} from 'rxjs';
import {EthereumService, WalletInfo} from "./ethereum";
import {signSiweMessagePipe} from "../../common/rx-pipes/siwe-sign.pipe";
import {ToastService} from "./toast.service";
import {AuthVerifyResponse} from "../../common/interfaces/web3-auth.interfaces";

@Injectable({providedIn: 'root'})
export class Web3AuthService {
    private readonly _api: Web3AuthApiService = inject(Web3AuthApiService);
    private readonly _toasterService: ToastService = inject(ToastService);

    MESSAGES = {
        LOADING: 'Authenticating...',
        SUCCESS: 'Authenticated',
        WAITING: 'Waiting for signature...',
        REJECTED: 'Signature rejected or failed',
        FAILED: 'Failed to authenticate',
    };

    isAuthenticated: WritableSignal<boolean> = signal(false);
    loading: WritableSignal<boolean> = signal(false);
    statusMessage: WritableSignal<string | null> = signal(null);

    resetAuth(): void {
        this.isAuthenticated.set(false);
        this.statusMessage.set(null);
        this.loading.set(false);
    }

    authenticate$(wallet: WalletInfo, ethService: EthereumService) {
        this.loading.set(true);
        this.statusMessage.set(this.MESSAGES.LOADING);

        return this._api.getNonce(wallet.address).pipe(
            tap(() => this.statusMessage.set(this.MESSAGES.WAITING)),
            signSiweMessagePipe(ethService, wallet),
            switchMap(({message, signature}) =>
                this._api.verify(message, signature),
            ),
            tap({
                next: (res: AuthVerifyResponse) => {
                    const toastMessage: string = res.success ? this.MESSAGES.SUCCESS : this.MESSAGES.FAILED;
                    this.isAuthenticated.set(!!res.success);
                    this.statusMessage.set(toastMessage);
                    this.loading.set(false);
                },
                error: (err) => {
                    this.isAuthenticated.set(false);
                    this.statusMessage.set(err?.error?.message || this.MESSAGES.FAILED,);
                    this.loading.set(false);
                },
            }),
            map((res) => !!res.success),
            catchError(() => of(false)),
        );
    }
}