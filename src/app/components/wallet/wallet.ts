import {
    Component,
    OnInit,
    inject,
    DestroyRef,
    ChangeDetectionStrategy,
    WritableSignal,
    signal
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {MessageModule} from 'primeng/message';
import {ChipModule} from 'primeng/chip';
import {DividerModule} from 'primeng/divider';
import {EthereumService, WalletInfo} from '../../services/ethereum';
import {tap} from 'rxjs';
import {HoodiNetworkService} from "../../services/hoodi-network.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {FormatAddressPipe} from "./format-address.pipe";

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
    ],
    templateUrl: './wallet.html',
    styleUrls: ['./wallet.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Wallet implements OnInit {
    private readonly _destroyRef: DestroyRef = inject(DestroyRef);
    private readonly _ethereumService: EthereumService = inject(EthereumService);
    private readonly _hoodiNetworkService: HoodiNetworkService = inject(HoodiNetworkService);

    walletInfo: WritableSignal<WalletInfo | null> = signal(null);
    message = '';
    messageType: 'success' | 'error' = 'success';

    get isWrongNetwork(): boolean {
        return this._hoodiNetworkService.isWrongNetwork(this.walletInfo());
    }

    ngOnInit() {
        this._ethereumService.walletInfo$.pipe(
            takeUntilDestroyed(this._destroyRef),
            tap((info) => {
                this.walletInfo.set(info);
            })
        ).subscribe()
    }

    async connectWallet() {
        try {
            const success: boolean = await this._ethereumService.connectWallet();
            if (success) {
                this.showMessage('Wallet connected successfully!', 'success');
            } else {
                this.showMessage('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.', 'error');
            }
        } catch (error) {
            this.showMessage('Failed to connect wallet: ' + (error as Error).message, 'error');
        }
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
        this.message = text;
        this.messageType = type;
        setTimeout(() => {
            this.message = '';
        }, 5000);
    }

    async switchToHoodi() {
        await this._hoodiNetworkService.switchToHoodiNetwork();
    }
}
