import {
    Component,
    inject,
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
import {FormatAddressPipe} from "../../core/pipes/format-address.pipe";
import {EthereumService, WalletInfo} from "../../core/services/ethereum";
import {NetworkService} from "../../core/services/network.service";
import {msgStateConstants} from "../../common/constants/msg-state.constants";
import {AssetsComponent} from "./assets/assets.component";
import {WalletService} from "../../core/services/wallet.service";
import {AssetOption} from "../transaction/transaction.interface";
import blockies from 'ethereum-blockies';


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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Wallet {
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

        return icon.toDataURL(); // повертаємо PNG Base64
    }
}
