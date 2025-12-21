import {ChangeDetectionStrategy, Component, DestroyRef, inject} from '@angular/core';
import {EthereumService} from "../../core/services/ethereum";
import {Web3AuthApiService} from "../../core/services/web3-auth-api.service";
import {Web3AuthService} from "../../core/services/web3-auth.service";
import {ToastService} from "../../core/services/toast.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {take} from "rxjs";
import {CommonModule} from "@angular/common";
import {Wallet} from "../wallet/wallet";
import {Transaction} from "../transaction/transaction";
import {Contract} from "../contract/contract";
import {AddressBalanceComponent} from "../address-balance/address-balance.component";
import {Toast} from "primeng/toast";
import {SiweOverlayComponent} from "../siwe-overlay/siwe-overlay.component";
import {Button} from "primeng/button";
import {ProposalCreateComponent} from "../proposal-create/proposal-create.component";
import {ProposalsListComponent} from "../proposals-list/proposals-list.component";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-home',
    imports: [CommonModule, Wallet, Transaction, Contract, AddressBalanceComponent, Toast, SiweOverlayComponent, Button, ProposalCreateComponent, ProposalsListComponent, RouterLink],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
    readonly ethereumService: EthereumService = inject(EthereumService);
    readonly web3AuthApiService: Web3AuthApiService = inject(Web3AuthApiService);
    readonly auth: Web3AuthService = inject(Web3AuthService);
    private readonly _destroyRef: DestroyRef = inject(DestroyRef);
    private readonly _toasterService: ToastService = inject(ToastService);
    title: string = 'angularweb3';

    checkSessionHealth() {
        this.web3AuthApiService.checkHealth().pipe(
            takeUntilDestroyed(this._destroyRef),
            take(1)
        ).subscribe({
            next: (res) => {
                this._toasterService.info('Session health check passed');
                console.log(res);
            },
            error: (err) => {
                this._toasterService.error('Session health check failed');
                console.error(err);
            }
        });
    }

}
