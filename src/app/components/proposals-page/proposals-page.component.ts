import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {catchError, map, of, startWith} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProposalDto } from '../../common/api/dao-api.types';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import {DaoApiService} from "../../core/services/dao-api.service";

type LoadState<T> =
    | { kind: 'loading' }
    | { kind: 'error'; error: string }
    | { kind: 'ready'; data: T };

@Component({
    standalone: true,
    selector: 'app-proposals-page',
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ProgressSpinnerModule,
        MessageModule,
        TagModule,
        ButtonModule,
    ],
    templateUrl: './proposals-page.component.html',
    styleUrl: './proposals-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalsPageComponent {
    private readonly api: DaoApiService = inject(DaoApiService);

    private readonly stateSig = toSignal<LoadState<ProposalDto[]>>(
        this.api.getProposals$().pipe(
            startWith({ kind: 'loading' } as const),
            catchError((e: any) => of({ kind: 'error', error: e?.message || 'Failed to load proposals' } as const)),
            map((response: any) => response?.data),
        ),
    );

    state: any = computed<LoadState<ProposalDto[]>>(() => {
        const s = this.stateSig();

        if ((s as any)?.kind === 'error' || (s as any)?.kind === 'loading') return s as any;
        return Array.isArray(s) ? ({ kind: 'ready', data: s } as any) : (s as any);
    });

    severity(p: ProposalDto) {
        if (p.executed) return 'success';
        if (p.status === 'finished') return 'secondary';
        if (p.status === 'active') return 'info';
        if (p.status === 'failed') return 'danger';
        return 'warning';
    }

    label(p: ProposalDto) {
        if (p.executed) return 'executed';
        return p.status || 'pending';
    }
}