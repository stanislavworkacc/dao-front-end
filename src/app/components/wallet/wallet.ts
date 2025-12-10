import {
    Component,
    inject,
    ChangeDetectionStrategy,
    WritableSignal,
    signal, DestroyRef
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {MessageModule} from 'primeng/message';
import {ChipModule} from 'primeng/chip';
import {DividerModule} from 'primeng/divider';
import {FormatAddressPipe} from "../../core/pipes/format-address.pipe";
import {EthereumService, WalletInfo} from "../../core/services/ethereum";
import {NetworkService} from "../../core/services/network.service";
import {msgStateConstants} from "../../common/constants/msg-state.constants";
import {AssetsComponent} from "./assets/assets.component";
import {WalletService} from "../../core/services/wallet.service";
import {AssetOption} from "../transaction/transaction.interface";
import blockies from 'ethereum-blockies';
import {DialogService, DynamicDialogModule, DynamicDialogRef} from "primeng/dynamicdialog";
import {WalletAccountsModalComponent} from "./modals/wallet-accounts-modal/wallet-accounts-modal.component";
import {ethereumMethods} from "../../common/constants/ethereum.constants";
import {catchError, from, of, switchMap, take, takeUntil, tap} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ToastService} from "../../core/services/toast.service";
import {EnsProfileService} from "../../core/services/ens-profile.service";
import {environment} from "../../../environments/environment";


@Component({
    selector: 'app-wallet',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        MessageModule,
        ChipModule,
        DividerModule,
        FormatAddressPipe,
        AssetsComponent,
    ],
    templateUrl: './wallet.html',
    styleUrls: ['./wallet.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Wallet {
    private readonly _ensProfileService: EnsProfileService = inject(EnsProfileService);
    private readonly _toastService: ToastService = inject(ToastService);
    private readonly _destroyRef: DestroyRef = inject(DestroyRef);
    private readonly dialogService: DialogService = inject(DialogService);
    private readonly _ethereumService: EthereumService = inject(EthereumService);
    private readonly _networkService: NetworkService = inject(NetworkService);
    readonly walletService: WalletService = inject(WalletService);

    walletInfo: WritableSignal<WalletInfo | null> = this._ethereumService.walletInfo;
    message: WritableSignal<string> = signal('');
    messageType: WritableSignal<typeof msgStateConstants.success | typeof msgStateConstants.error> = signal(msgStateConstants.success);

    get isWrongNetwork(): boolean {
        return !this._networkService.isHoodiNetwork(this.walletInfo());
    }

    async connectWallet() {
        try {
            const accounts = await window.ethereum.request({
                method: ethereumMethods.requestAccounts,
            });

            // TODO: PROBLEM WIth _ensProfileService
            // console.log('_ensProfileService', this._ensProfileService.getProfileForAddress(accounts[0]));

            if (!accounts?.length) {
                this._toastService.info('No accounts found. Please install MetaMask.');
                this._ethereumService.walletInfo.set(null);
                return;
            }

            const ref: DynamicDialogRef = this.configureModal(accounts);

            ref.onClose.pipe(
                take(1),
                takeUntilDestroyed(this._destroyRef),
                switchMap((account: string | undefined) => {
                    if (!account) {
                        this._toastService.info('No account selected. Please select an account.');
                        return of(false);
                    }
                    localStorage.setItem(environment.web3DaoAccount, account);
                    return from(this._ethereumService.connectWallet(account));
                }),
                tap((success: boolean) => {
                    if (success) {
                        this.showMessage('Wallet connected successfully!', 'success');
                    } else {
                        this.showMessage('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.', 'error',);
                    }
                }),
                catchError((err) => {
                    this.showMessage('Failed to connect wallet: ' + (err as Error).message, 'error',);
                    return of(false);
                }),
            ).subscribe();

        } catch (error) {
            this.showMessage('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.', 'error',);
        }
    }

    configureModal(accounts: string[]): DynamicDialogRef {
        const ref: DynamicDialogRef = this.dialogService.open(WalletAccountsModalComponent, {
            data: {accounts},
            inputValues: {
                accounts
            },
            focusOnShow: false,
            closable: true,
            header: 'Choose an account',
            width: '50vw',
            modal: true,
            breakpoints: {
                '960px': '75vw',
                '640px': '90vw'
            },
        });

        return ref;
    }

    async disconnectWallet() {
        try {
            await this._ethereumService.disconnectWallet();
            this.showMessage('Wallet disconnected successfully!', 'success');
        } catch (error) {
            this.showMessage('Failed to disconnect wallet: ' + (error as Error).message, 'error');
        }
    }

    private showMessage(text: string, type: 'success' | 'error') {
        this.message.set(text);
        this.messageType.set(type);

        setTimeout(() => {
            this.message.set('');
        }, 5000);
    }

    async switchToHoodi() {
        await this._networkService.switchToHoodi();
    }

    selectAsset(value: AssetOption) {
        this.walletService.selectedAsset.set(value);
    }


    generate(address: string): string {
        const icon = blockies.create({
            seed: address.toLowerCase(),
            size: 8,
            scale: 5,
        });

        return icon.toDataURL();
    }
}
