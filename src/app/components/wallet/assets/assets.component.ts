import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {DropdownModule} from "primeng/dropdown";
import {PrimeTemplate} from "primeng/api";
import {TransactionService} from "../../../core/services/transaction.service";

@Component({
    selector: 'app-assets',
    imports: [
        DropdownModule,
        PrimeTemplate
    ],
    templateUrl: './assets.component.html',
    styleUrl: './assets.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetsComponent {
    readonly transactionService: TransactionService = inject(TransactionService);

}
