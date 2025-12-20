import {ChangeDetectionStrategy, Component, DestroyRef, inject} from '@angular/core';
import {Card} from "primeng/card";
import {DaoContractService} from "../../core/services/dao-contract.service";
import {take, tap} from "rxjs";
import {FormsModule} from "@angular/forms";
import {Button} from "primeng/button";
import {Textarea} from "primeng/textarea";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-proposal-create',
    imports: [
        Card,
        FormsModule,
        Button,
        Textarea
    ],
    templateUrl: './proposal-create.component.html',
    styleUrl: './proposal-create.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProposalCreateComponent {
    private readonly _destroyRef: DestroyRef = inject(DestroyRef);
    private readonly dao: DaoContractService = inject(DaoContractService);

    description = '';

    create() {
        this.dao.createProposal$(this.description).pipe(
            takeUntilDestroyed(this._destroyRef),
            take(1),
            tap((hash: string) => {
                if (hash) this.description = '';
            })
        ).subscribe();
    }
}
