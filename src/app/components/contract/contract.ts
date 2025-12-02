import {Component, OnInit, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {InputNumberModule} from 'primeng/inputnumber';
import {MessageModule} from 'primeng/message';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {DataViewModule} from 'primeng/dataview';
import {DividerModule} from 'primeng/divider';
import {TagModule} from 'primeng/tag';
import {EthereumService} from '../../services/ethereum';
import {Subscription} from 'rxjs';
import {ethers} from 'ethers';

// ERC-20 Token ABI (minimal)
const ERC20_ABI = [
    "function GOVERNANCE_TOKEN() view returns (address)",
];

@Component({
    selector: 'app-contract',
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
        DataViewModule,
        DividerModule,
        TagModule,
    ],
    templateUrl: './contract.html',
    styleUrl: './contract.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Contract implements OnInit, OnDestroy {
    contractAddress = '0x6645CAe3a4D955d83bDC0dCC746a2fbb4d7E71c1';
    contractAddressError = '';
    contractInfo: any = null;
    isLoading = false;
    isConnected = false;

    // Transfer form
    transferRecipient = '';
    transferAmount: number | null = null;
    transferRecipientError = '';
    transferAmountError = '';
    isTransferring = false;
    transferError = '';
    transferSuccess = false;
    transferHash = '';

    private subscription: Subscription = new Subscription();

    constructor(private ethereumService: EthereumService) {
    }

    ngOnInit(): void {
        this.subscription.add(
            this.ethereumService.walletInfo$.subscribe((info) => {
                this.isConnected = info !== null;
            })
        );
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    validateContractAddress(): boolean {
        this.contractAddressError = '';

        if (!this.contractAddress) {
            this.contractAddressError = 'Contract address is required';
            return false;
        }

        if (
            !this.contractAddress.startsWith('0x') ||
            this.contractAddress.length !== 42
        ) {
            this.contractAddressError = 'Invalid Ethereum address format';
            return false;
        }

        return true;
    }

    async loadContractInfo(): Promise<void> {
        if (!this.validateContractAddress()) {
            return;
        }

        this.isLoading = true;
        this.contractInfo = null;

        try {
            const contract = await this.ethereumService.getContract(
                this.contractAddress,
                ERC20_ABI
            );

            const [GOVERNANCE_TOKEN] = await Promise.all([
                contract['GOVERNANCE_TOKEN'],
                (
                    await this.ethereumService.getSigner()!.getAddress()
                ),
            ]);

            this.contractInfo = {
                GOVERNANCE_TOKEN: await GOVERNANCE_TOKEN(),
                // symbol,
                // decimals,
                // totalSupply: ethers.formatUnits(totalSupply, decimals),
                // balance: ethers.formatUnits(balance, decimals),
            };
        } catch (error: any) {
            this.contractAddressError =
                error.message || 'Failed to load contract information';
        } finally {
            this.isLoading = false;
        }
    }

    validateTransferForm(): boolean {
        this.transferRecipientError = '';
        this.transferAmountError = '';

        // Validate recipient address
        if (!this.transferRecipient) {
            this.transferRecipientError = 'Recipient address is required';
            return false;
        }

        if (
            !this.transferRecipient.startsWith('0x') ||
            this.transferRecipient.length !== 42
        ) {
            this.transferRecipientError = 'Invalid Ethereum address format';
            return false;
        }

        // Validate amount
        if (this.transferAmount === null || this.transferAmount <= 0) {
            this.transferAmountError = 'Amount must be a positive number';
            return false;
        }

        return true;
    }

    isTransferFormValid(): boolean {
        return Boolean(
            this.transferRecipient &&
            this.transferAmount &&
            this.transferAmount > 0 &&
            !this.transferRecipientError &&
            !this.transferAmountError
        );
    }

    async transferTokens(): Promise<void> {
        if (!this.validateTransferForm()) {
            return;
        }

        this.isTransferring = true;
        this.transferError = '';
        this.transferSuccess = false;

        try {
            const contract = await this.ethereumService.getContract(
                this.contractAddress,
                ERC20_ABI
            );

            const decimals = await contract['decimals']();
            const amount = ethers.parseUnits(
                this.transferAmount!.toString(),
                decimals
            );

            const tx = await contract['transfer'](this.transferRecipient, amount);
            const receipt = await tx.wait();

            this.transferHash = receipt?.hash || '';
            this.transferSuccess = true;

            // Reset form
            this.transferRecipient = '';
            this.transferAmount = null;

            // Reload contract info to update balance
            await this.loadContractInfo();
        } catch (error: any) {
            this.transferError = error.message || 'Transfer failed';
        } finally {
            this.isTransferring = false;
        }
    }

    openEtherscan(): void {
        const url = this.getEtherscanUrl(this.transferHash);
        window.open(url, '_blank');
    }

    getEtherscanUrl(hash: string): string {
        return `https://etherscan.io/tx/${hash}`;
    }

    formatHash(hash: string): string {
        if (!hash) return '';
        return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
    }
}
