import {ChangeDetectionStrategy, Component, inject, signal, WritableSignal} from '@angular/core';
import {ethers} from "ethers";
import {Card} from "primeng/card";
import {FormsModule} from "@angular/forms";
import {InputText} from "primeng/inputtext";
import {ButtonDirective} from "primeng/button";
import {WalletService} from "../../core/services/wallet.service";
import {networkConstantsId, networkConstantsNames} from "../../common/constants/network.constants";

@Component({
    selector: 'app-address-balance',
    imports: [
        Card,
        FormsModule,
        InputText,
        ButtonDirective,
    ],
    templateUrl: './address-balance.component.html',
    styleUrl: './address-balance.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressBalanceComponent {
    private readonly _walletService: WalletService = inject(WalletService);
    address: WritableSignal<string> = signal('');
    nativeBalance: WritableSignal<any> = signal(null);
    sbelBalance: WritableSignal<any> = signal(null);

    loading: WritableSignal<boolean> = signal(false);
    error: WritableSignal<string | null> = signal(null);

    get isAddressValid(): boolean {
        const addr = this.address().trim();
        return ethers.isAddress(addr);
    }

    onAddressChange(value: string): void {
        this.address.set(value);
        this.error.set(null);
    }

    async checkBalances(): Promise<void> {
        this.error.set(null);
        this.nativeBalance.set(null);
        this.sbelBalance.set(null);

        const addr: string = this.address().trim();

        if (!this.isAddressValid) {
            this.error.set('Invalid address format');
        } else {
            await this.loadBalances(addr);
        }
    }

    async loadBalances(addr: string) {
        this.loading.set(true);

        try {
            const walletInfo = {
                address: addr,
                balance: null,
                chainId: networkConstantsId.hoodi,
                networkName: networkConstantsNames[networkConstantsId.hoodi]
            }


            const [ETH, SBEL] = await this._walletService.loadAllBalances(walletInfo, this._walletService.assets());

            this.sbelBalance.set(SBEL);
            this.nativeBalance.set(ETH);

        } catch (e: any) {
            console.error('Failed to load address balances', e);
            this.error.set(e?.message ?? 'Failed to load balances');
        } finally {
            this.loading.set(false);
        }
    }
}
