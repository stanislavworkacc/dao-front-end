import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {catchError, distinctUntilChanged, filter, map, of, shareReplay, startWith, switchMap, take} from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import {DaoApiService} from "../../core/services/dao-api.service";
import {DaoContractService} from "../../core/services/dao-contract.service";

type ApiResponse<T> = { success: boolean; data: T };

type VoteDto = {
    voter: string;
    support: boolean;
    amount: string;
    blockNumber: number;
    transactionHash: string;
    timestamp: string;
};

type ProposalDto = {
    id: string;
    creator: string;
    description: string;
    startBlock: number;
    createdAt: string;
    endBlock: number | null;
    executedAt: string | null;
    executed: boolean;
    voteCountFor: string;
    voteCountAgainst: string;
    transactionHash: string;
    votes?: VoteDto[];
};

@Component({
    selector: 'app-proposal-details-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ButtonModule,
        TagModule,
        MessageModule,
        SkeletonModule,
        TableModule,
        DividerModule,
        TooltipModule,
        ChartModule,
    ],
    templateUrl: './proposal-details-page.component.html',
    styleUrl: './proposal-details-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalDetailsPageComponent {
    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    private readonly api: DaoApiService = inject(DaoApiService);
    private readonly _daoService = inject(DaoContractService);

    disableVote = computed(() => {
        const p = this.proposalState();
        return p.status === 'pending' || p.status === 'signing' || p.isVotedByMe === true;
    });

    private readonly id$ = this.route.paramMap.pipe(
        map((m) => m.get('id')),
        filter((id) => !!Number(id)),
        take(1),
        distinctUntilChanged(),
    );

    readonly proposalState$ = this.id$.pipe(
        startWith({status: 'loading'}),
        switchMap((data) => {
            if(!Number(data)) return of(data);
            return this.api.getProposalById$(+data).pipe(
                map((res: ApiResponse<ProposalDto>) => ({
                    status: res?.success && res?.data ? ('ok' as const) : ('empty' as const),
                    id: data,
                    proposal: res?.data ?? null,
                    error: '',
                })),
                catchError((e) =>
                    of({
                        status: 'error' as const,
                        id: data,
                        proposal: null,
                        error: e?.error?.message || e?.message || 'Failed to load proposal',
                    }),
                ),
            );
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    readonly resultsState$ = this.id$.pipe(
        startWith({status: 'loading'}),
        switchMap((data) => {
            if(!Number(data)) return of(data);

            return this.api.getResults$(+data).pipe(
                map((res: ApiResponse<VoteDto[]>) => ({
                    status: res?.success ? ('ok' as const) : ('empty' as const),
                    id: data,
                    votes: res?.data ?? [],
                    error: '',
                })),
                catchError((e) =>
                    of({
                        status: 'error' as const,
                        id: data,
                        votes: [],
                        error: e?.error?.message || e?.message || 'Failed to load results',
                    }),
                ),
            );
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    readonly proposalState: any = toSignal(this.proposalState$);

    readonly resultsState: any = toSignal(this.resultsState$);

    readonly statusLabel = computed(() => {
        const p = this.proposalState().proposal;
        if (!p) return 'unknown';
        if (p.executed) return 'executed';
        if (p.endBlock) return 'closed';
        return 'pending';
    });

    readonly statusSeverity = computed<'success' | 'info' | 'warning' | 'danger'>(() => {
        const label = this.statusLabel();
        if (label === 'executed') return 'success';
        if (label === 'closed') return 'warning';
        if (label === 'pending') return 'info';
        return 'danger';
    });

    readonly forAmount = computed(() => this.safeBigInt(this.proposalState().proposal?.voteCountFor));
    readonly againstAmount = computed(() => this.safeBigInt(this.proposalState().proposal?.voteCountAgainst));
    readonly totalAmount = computed(() => this.forAmount() + this.againstAmount());

    readonly forPct = computed(() => {
        const total = this.totalAmount();
        if (total === 0n) return 0;
        return Number((this.forAmount() * 100n) / total);
    });

    readonly againstPct = computed(() => {
        const total = this.totalAmount();
        if (total === 0n) return 0;
        return Number((this.againstAmount() * 100n) / total);
    });

    readonly pieData = computed(() => {
        return {
            labels: ['For', 'Against'],
            datasets: [
                {
                    data: [this.toNumberSafe(this.forAmount()), this.toNumberSafe(this.againstAmount())],
                },
            ],
        };
    });

    readonly pieOptions = computed(() => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        padding: 16,
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => {
                            const label = ctx.label ?? '';
                            const value = ctx.parsed ?? 0;
                            const total = (ctx.dataset?.data ?? []).reduce((a: number, b: number) => a + b, 0);
                            const pct = total ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${pct}%)`;
                        },
                    },
                },
            },
        };
    });

    readonly barData = computed(() => {
        return {
            labels: ['Votes'],
            datasets: [
                { label: 'For', data: [this.toNumberSafe(this.forAmount())] },
                { label: 'Against', data: [this.toNumberSafe(this.againstAmount())] },
            ],
        };
    });

    readonly barOptions = computed(() => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true },
            },
        };
    });

    formatAddress(addr?: string | null): string {
        if (!addr) return '-';
        const a = String(addr);
        return a.length <= 12 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
    }

    formatHash(hash?: string | null): string {
        if (!hash) return '-';
        const h = String(hash);
        return h.length <= 18 ? h : `${h.slice(0, 10)}…${h.slice(-8)}`;
    }

    openTx(hash?: string | null): void {
        if (!hash) return;
        window.open(`https://hoodi.etherscan.io/tx/${hash}`, '_blank');
    }

    private safeBigInt(v?: string | null): bigint {
        try {
            if (!v) return 0n;
            return BigInt(v);
        } catch {
            return 0n;
        }
    }

    private toNumberSafe(v: bigint): number {
        const max = BigInt(Number.MAX_SAFE_INTEGER);
        return Number(v > max ? max : v);
    }

    // canExecute(): boolean {
    //     const state = this.proposalState();
    //     const p = state?.proposal
    //
    //     if(!p) {
    //         return false;
    //     }
    //
    //     if (p.executed) return false;
    //
    //     const now = Math.floor(Date.now() / 1000);
    //     if (now < p.deadline) return false;
    //
    //     const total = p.voteCountForRaw + p.voteCountAgainstRaw;
    //     if (total === 0n) return false;
    //
    //     const quorum = (BigInt(total) * 50n) / 100n;
    //     const hasQuorum = p.voteCountForRaw > quorum;
    //
    //     return hasQuorum;
    // }

    vote(id: number, support: boolean) {
        this._daoService.vote$(id, support).pipe(
            take(1),
        ).subscribe();
    }

    protected execute(id: number) {
        this._daoService.executeProposal$(id).pipe(
            take(1)
        ).subscribe();
    }
}