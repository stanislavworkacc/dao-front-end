import {computed, DestroyRef, inject, Injectable, OnDestroy, Signal, signal, WritableSignal} from '@angular/core';
import {Web3AuthApiService} from './web3-auth-api.service';
import {
    catchError, interval,
    map, Observable,
    of, Subscription,
    switchMap, take,
    tap, timer,
} from 'rxjs';
import {EthereumService, WalletInfo} from "./ethereum";
import {signSiweMessagePipe} from "../../common/rx-pipes/siwe-sign.pipe";
import {ToastService} from "./toast.service";
import {AuthVerifyResponse} from "../../common/interfaces/web3-auth.interfaces";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Injectable({providedIn: 'root'})
export class Web3AuthService implements OnDestroy {
    private readonly _destroyRef: DestroyRef = inject(DestroyRef);
    private readonly _api: Web3AuthApiService = inject(Web3AuthApiService);
    private readonly _toasterService: ToastService = inject(ToastService);

    MESSAGES = {
        LOADING: 'Authenticating...',
        SUCCESS: 'Authenticated',
        WAITING: 'Waiting for signature...',
        REJECTED: 'Signature rejected or failed',
        FAILED: 'Failed to authenticate',
        SESSION_EXPIRED: 'Session expired. Please sign in again.',
        LOGOUT: 'You logged out successfully',
    };

    isAuthenticated: WritableSignal<boolean> = signal(false);
    loading: WritableSignal<boolean> = signal(false);
    statusMessage: WritableSignal<string | null> = signal(null);

    sessionExpiresAt: WritableSignal<Date | null> = signal<Date | null>(null);
    sessionRemainingMs: WritableSignal<number | null> = signal(null);
    sessionRemainingSeconds: Signal<number | null> = computed(() => {
        const ms: number = this.sessionRemainingMs();
        if (ms == null) return null;
        return Math.max(0, Math.floor(ms / 1000));
    });

    private logoutTimerSub: Subscription | null = null;
    private countdownSub: Subscription | null = null;

    resetAuth(): void {
        this.isAuthenticated.set(false);
        this.statusMessage.set(null);
        this.loading.set(false);
    }

    authenticate$(wallet: WalletInfo, ethService: EthereumService): Observable<AuthVerifyResponse> {
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
                    this.runSession(res?.expiresAt);

                    const toastMessage: string = res.success ? this.MESSAGES.SUCCESS : this.MESSAGES.FAILED;
                    this.isAuthenticated.set(!!res.success);
                    this.statusMessage.set(toastMessage);
                    this.loading.set(false);

                    this._toasterService.success(toastMessage);
                },
                error: (err) => {
                    this.isAuthenticated.set(false);
                    this.statusMessage.set(err?.error?.message || this.MESSAGES.FAILED,);
                    this.loading.set(false);
                    this._toasterService.error(this.MESSAGES.FAILED);
                    ethService.disconnectWallet();
                },
            }),
            map((res: AuthVerifyResponse) => res),
            catchError((error) => of(error)),
        );
    }

    runSession(expiresAt: string) {
        if (expiresAt) {
            const expDate = new Date(expiresAt);
            this.startRxSessionTimer(expDate);
            this.sessionExpiresAt.set(expDate);
        }
    }

    private startRxSessionTimer(expiresAt: Date): void {
        this.clearSessionTimers();

        const now: number = Date.now();
        const msToExpire: number = expiresAt.getTime() - now;

        if (msToExpire <= 0) {
            this.forceLogout();
            return;
        }

        this.logoutTimerSub = timer(msToExpire).pipe(
            takeUntilDestroyed(this._destroyRef),
            tap(() => {
                this.forceLogout();
            })
        ).subscribe();

        this.countdownSub = interval(1000).pipe(
            takeUntilDestroyed(this._destroyRef),
            tap(() => {
                const diff: number = expiresAt.getTime() - Date.now();
                this.sessionRemainingMs.set(diff > 0 ? diff : 0);
            })
        ).subscribe();
    }

    private clearSessionTimers(): void {
        this.sessionExpiresAt.set(null);
        this.sessionRemainingMs.set(null);

        if (this.logoutTimerSub) {
            this.logoutTimerSub.unsubscribe();
            this.logoutTimerSub = null;
        }

        if (this.countdownSub) {
            this.countdownSub.unsubscribe();
            this.countdownSub = null;
        }
    }

    forceLogout(reason?: string): void {
        const isLogoutReason: boolean = reason === 'logout';
        const message: string = isLogoutReason ? this.MESSAGES.LOGOUT : this.MESSAGES.SESSION_EXPIRED;

        this.isAuthenticated.set(false);
        this.statusMessage.set(message);
        this._toasterService.info(message);
        this.clearSessionTimers();

        this._api.logout().pipe(
            takeUntilDestroyed(this._destroyRef),
            take(1)
        ).subscribe();
    }

    ngOnDestroy(): void {
        // this.forceLogout();
    }
}