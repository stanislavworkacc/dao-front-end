import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {Tag} from "primeng/tag";
import {Card} from "primeng/card";
import {Button} from "primeng/button";
import {ProposalVM} from "../../../common/interfaces/proposals.types";

type ExecuteState = {
    canExecute: boolean;
    reason: string | null;
};

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
    execute = output<void>();

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

    canExecute(): boolean {
        const p = this.proposal();

        if (p.executed) return false;

        const now = Math.floor(Date.now() / 1000);
        if (now < p.deadline) return false;

        const total = p.voteCountForRaw + p.voteCountAgainstRaw;
        if (total === 0n) return false;

        const quorum = (total * 50n) / 100n; // QUORUM_PERCENTAGE = 50
        const hasQuorum = p.voteCountForRaw > quorum;

        return hasQuorum;
    }

    getExecuteState(): ExecuteState {
        const p = this.proposal();

        if (p.executed) {
            return { canExecute: false, reason: 'Already executed' };
        }

        const now = Math.floor(Date.now() / 1000);

        if (now < p.deadline) {
            const secondsLeft = p.deadline - now;
            const minutes = Math.ceil(secondsLeft / 60);
            return { canExecute: false, reason: `Voting is active (${minutes} min left)` };
        }

        const total = p.voteCountForRaw + p.voteCountAgainstRaw;
        if (total === 0n) {
            return { canExecute: false, reason: 'No votes yet' };
        }

        const quorum = (total * 50n) / 100n;
        if (!(p.voteCountForRaw > quorum)) {
            return { canExecute: false, reason: 'Quorum not reached' };
        }

        return { canExecute: true, reason: null };
    }

}
