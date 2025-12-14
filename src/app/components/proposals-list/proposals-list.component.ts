import {Component, inject} from '@angular/core';
import {DaoContractService} from "../../core/services/dao-contract.service";
import {Card} from "primeng/card";
import {ProposalCardComponent} from "./proposal-card/proposal-card.component";

@Component({
  selector: 'app-proposals-list',
    imports: [
        Card,
        ProposalCardComponent,
    ],
  templateUrl: './proposals-list.component.html',
  styleUrl: './proposals-list.component.scss'
})
export class ProposalsListComponent {
    readonly dao = inject(DaoContractService);

    vote(id: number, support: boolean) {
        this.dao.vote$(id, support).subscribe();
    }

}
