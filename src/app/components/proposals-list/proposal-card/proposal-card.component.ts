import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {Tag} from "primeng/tag";
import {Card} from "primeng/card";
import {Button} from "primeng/button";
import {ProposalVM} from "../../../common/interfaces/proposals.types";

@Component({
    selector: 'app-proposal-card',
    imports: [
        Tag,
        Card,
        Button
    ],
    templateUrl: './proposal-card.component.html',
    styleUrl: './proposal-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class ProposalCardComponent {
    proposal = input.required<ProposalVM>();

    voteFor = output<void>();
    voteAgainst = output<void>();

    disableVote = computed(() => {
        const p = this.proposal();
        return p.status === 'pending' || p.status === 'signing' || p.isVotedByMe === true;
    });

    tagSeverity = computed(() => {
        switch (this.proposal().status) {
            case 'pending': return 'warning';
            case 'success': return 'success';
            case 'error': return 'danger';
            default: return 'info';
        }
    });

}
