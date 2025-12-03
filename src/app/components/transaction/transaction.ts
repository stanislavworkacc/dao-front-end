import {
    Component,
    inject,
    ChangeDetectionStrategy,
    WritableSignal,
    signal
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {InputNumberModule} from 'primeng/inputnumber';
import {MessageModule} from 'primeng/message';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {ChipModule} from 'primeng/chip';
import {EthereumService} from '../../services/ethereum';
import {DividerModule} from 'primeng/divider';
import {Erh20Service} from "../../services/erh-20.service";
import {TransactionService} from "./transaction.service";
import {FormatHashPipe} from "../../core/pipes/format-hash.pipe";
import {DropdownChangeEvent, DropdownModule} from "primeng/dropdown";

@Component({
    selector: 'app-transaction',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        InputNumberModule,
        MessageModule,
        ProgressSpinnerModule,
        ChipModule,
        DividerModule,
        FormatHashPipe,
        DropdownModule,
    ],
    templateUrl: './transaction.html',
    styleUrls: ['./transaction.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Transaction {
    private readonly _ethereumService: EthereumService = inject(EthereumService);
    private readonly _erh20Service: Erh20Service = inject(Erh20Service);
    readonly transactionService: TransactionService = inject(TransactionService);

    toAddress = '';
    amount: number | null = null;
    isSending: WritableSignal<boolean> = signal(false);
    lastTransaction: WritableSignal<string> = signal('');
    message: WritableSignal<string> = signal('');
    messageType:  WritableSignal<'success' | 'error'> = signal('success');
    addressError = '';
    amountError = '';

    get canSendTransaction(): boolean {
        return (
            this.toAddress.trim() !== '' &&
            this.amount !== null &&
            this.amount > 0 &&
            !this.addressError &&
            !this.amountError
        );
    }

    async loadGasPrice(): Promise<void> {
        try {
            // Implement gas price loading logic
        } catch (error) {
            console.error('Failed to load gas price:', error);
        }
    }

    validateAddress(): void {
        this.addressError = '';
        const address = this.toAddress.trim();

        if (!address) {
            this.addressError = 'Address is required';
            return;
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            this.addressError = 'Invalid Ethereum address format';
            return;
        }
    }

    validateAmount(): void {
        this.amountError = '';

        if (this.amount === null || this.amount <= 0) {
            this.amountError = 'Amount must be greater than 0';
            return;
        }

        if (this.amount > 1000) {
            this.amountError = 'Amount cannot exceed 1000 ETH';
            return;
        }
    }

    async submit(): Promise<void> {
        switch (this.transactionService.selectedAsset().type) {
            case "ERC20":
                await this.sendErc20Transaction();
                break;
            case "NATIVE":
                await this.sendTransaction();
                break;
        }
    }

    async sendTransaction(): Promise<void> {
        this.validateAddress();
        this.validateAmount();

        if (this.addressError || this.amountError) {
            return;
        }

        this.isSending.set(true);
        this.message.set('');

        try {
            const hash: string = await this._ethereumService.sendEthTransaction(this.toAddress.trim(), this.amount!.toString());

            this.lastTransaction.set(hash);
            this.showMessage('Transaction sent successfully!', 'success');

            // Reset form
            this.toAddress = '';
            this.amount = null;
        } catch (error) {
            this.showMessage('Transaction failed: ' + (error as Error).message, 'error');
        } finally {
            this.isSending.set(false);
        }
    }

    async sendErc20Transaction(): Promise<void> {
        this.validateAddress();
        this.validateAmount();

        if (this.addressError || this.amountError) {
            return;
        }

        this.isSending.set(true);
        this.message.set('');

        try {
            const hash: string = await this._erh20Service.sendErc20Token(
                this.toAddress.trim(),
                this.amount!.toString(),
                6
            );

            this.lastTransaction.set(hash);
            this.showMessage('SBEL tokens sent successfully!', 'success');

            this.toAddress = '';
            this.amount = null;
        } catch (error) {
            this.showMessage('Transaction failed: ' + (error as Error).message, 'error');
        } finally {
            this.isSending.set(false);
        }
    }

    openExplorer(hash: string) {
        const network: string = this.getCurrentNetwork();
        const explorerUrl = this.getExplorerUrl(network, hash);
        window.open(explorerUrl, '_blank');
    }

    private getCurrentNetwork(): string {
        // This would need to be implemented based on the current network
        // For now, default to Ethereum mainnet
        return 'hoodi';
    }

    private getExplorerUrl(network: string, hash: string): string {
        switch (network) {
            case 'mainnet':
                return `https://etherscan.io/tx/${hash}`;
            case 'hoodi':
                return `https://hoodi.etherscan.io/tx/${hash}`;
            case 'goerli':
                return `https://goerli.etherscan.io/tx/${hash}`;
            case 'sepolia':
                return `https://sepolia.etherscan.io/tx/${hash}`;
            default:
                return `https://etherscan.io/tx/${hash}`;
        }
    }

    private showMessage(text: string, type: 'success' | 'error') {
        this.message.set(text);
        this.messageType.set(type);
        setTimeout(() => {
            this.message.set('');
        }, 5000);
    }

    onAssetChange(event: DropdownChangeEvent) {
        this.transactionService.selectedAsset.set(event.value)
    }
}
