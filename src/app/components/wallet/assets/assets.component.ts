import {ChangeDetectionStrategy, Component, inject, output, OutputEmitterRef} from '@angular/core';
import {DropdownModule} from "primeng/dropdown";
import {PrimeTemplate} from "primeng/api";
import {WalletService} from "../../../core/services/wallet.service";

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
    readonly transactionService: WalletService = inject(WalletService);


    selectAsset: OutputEmitterRef<AssetOption> = output()

    select(value: AssetOption) {
        this.selectAsset.emit(value);
    }
}
