import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Wallet} from './components/wallet/wallet';
import {Transaction} from './components/transaction/transaction';
import {Contract} from './components/contract/contract';
import {EthereumService} from "./core/services/ethereum";
import {AddressBalanceComponent} from "./components/address-balance/address-balance.component";
import {Toast} from "primeng/toast";
import {SiweOverlayComponent} from "./components/siwe-overlay/siwe-overlay.component";
import {Web3AuthService} from "./core/services/web3-auth.service";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, Wallet, Transaction, Contract, AddressBalanceComponent, Toast, SiweOverlayComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    readonly ethereumService: EthereumService = inject(EthereumService);
    readonly auth: Web3AuthService = inject(Web3AuthService);
    title = 'angularweb3';
}
