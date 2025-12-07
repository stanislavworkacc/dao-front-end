import {ChangeDetectionStrategy, Component, inject, input, output} from '@angular/core';
import {NgForOf} from "@angular/common";
import {ButtonDirective} from "primeng/button";
import {FormatAddressPipe} from "../../../../core/pipes/format-address.pipe";
import {DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
    selector: 'app-wallet-accounts-modal',
    imports: [
        NgForOf,
        ButtonDirective,
        FormatAddressPipe
    ],
    templateUrl: './wallet-accounts-modal.component.html',
    styleUrl: './wallet-accounts-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class WalletAccountsModalComponent {
    readonly ref: DynamicDialogRef = inject(DynamicDialogRef);
    accounts = input<string[]>([]);
}
