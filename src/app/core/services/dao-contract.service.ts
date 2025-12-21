import {Injectable, signal, WritableSignal, inject, DestroyRef} from '@angular/core';
import {Contract, ethers, JsonRpcSigner} from 'ethers';
import {from, defer, Observable, of, switchMap, tap, catchError, map, take} from 'rxjs';
import {EthereumService, WalletInfo} from "./ethereum";
import {RpcProviderService} from "./rpc-provider.service";
import {ToastService} from "./toast.service";
import {DAO_ABI} from "../../common/blockchain/abi/dao.abi";
import {clearOldTxs, removePendingTx, savePendingTx} from "../../common/blockchain/storage/tx-storage";
import {
    addStoredProposalId,
    addVotedId,
    getStoredProposalIds,
    getVotedIds
} from "../../common/blockchain/storage/proposal-storage";
import {ProposalVM} from "../../common/interfaces/proposals.types";
import {environment} from "../../../environments/environment";
import {ERC20_ABI} from "../../common/blockchain/abi/erc20.abi";

@Injectable({providedIn: 'root'})
export class DaoContractService {
    private readonly _destroyRef: DestroyRef = inject(DestroyRef);
    private readonly eth: EthereumService = inject(EthereumService);
    private readonly rpc: RpcProviderService = inject(RpcProviderService);
    private readonly toast: ToastService = inject(ToastService);

    public readonly proposals: WritableSignal<ProposalVM[]> = signal([]);
    public readonly isLoading: WritableSignal<boolean> = signal(false);

    private readContract() {
        return new ethers.Contract(environment.DAO_ADDRESS, DAO_ABI, this.rpc.getRpcProvider);
    }

    private async writeContract(): Promise<ethers.Contract> {
        const signer: JsonRpcSigner = this.eth.getSigner;
        if (!signer) throw new Error('Wallet not connected');
        return new ethers.Contract(environment.DAO_ADDRESS, DAO_ABI, signer);
    }

    constructor() {
        this.init$().pipe(
            take(1),
        ).subscribe()
    }

    init$(): Observable<void> {
        return defer(() => {
            clearOldTxs(60);
            this.isLoading.set(true);
            return from(this.loadStoredProposals());
        }).pipe(
            tap(() => this.attachListeners()),
            tap(() => this.isLoading.set(false)),
            map(() => void 0),
            catchError((e) => {
                console.error(e);
                this.isLoading.set(false);
                return of(void 0);
            }),
        );
    }

    private async loadStoredProposals(): Promise<void> {
        const ids = getStoredProposalIds().map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
        if (!ids.length) {
            this.proposals.set([]);
            return;
        }

        const c = this.readContract();
        const votedSet = new Set(getVotedIds());

        const list: ProposalVM[] = await Promise.all(
            ids.map(async (id: number) => {
                const p = await c['getProposal'](id);
                return this.toVM(p, votedSet.has(String(id)));
            }),
        );

        this.proposals.set(list.sort((a, b) => b.id - a.id));
    }

    private toVM(p: any, isVotedByMe: boolean): ProposalVM {
        const forRaw: bigint = p.voteCountFor as bigint;
        const againstRaw: bigint = p.voteCountAgainst as bigint;

        return {
            id: Number(p.id),
            description: p.description,
            executed: Boolean(p.executed),
            voteCountFor: ethers.formatUnits(p.voteCountFor, 0),
            voteCountAgainst: ethers.formatUnits(p.voteCountAgainst, 0),
            deadline: Number(p.deadline),
            status: 'idle',
            lastTxHash: null,
            lastError: null,
            isVotedByMe,
            voteCountForRaw: forRaw,
            voteCountAgainstRaw: againstRaw,
        };
    }

    createProposal$(description: string): Observable<string | null> {
        const desc = description?.trim();
        if (!desc) {
            this.toast.error('Description is required');
            return of(null);
        }

        const wallet = this.eth.getCurrentWalletInfo;
        if (!wallet?.address) {
            this.toast.error('Wallet not connected');
            return of(null);
        }

        return this.checkCreateProposalPrereqs$(wallet).pipe(
            tap(() => this.toast.info('Sign the transaction in your wallet…')),
            switchMap(() => defer(() => from(this.writeContract()))),
            switchMap((contract: Contract) =>
                from(contract['createProposal'](desc)).pipe(
                    tap((tx: ethers.TransactionResponse) => {
                        savePendingTx({
                            hash: tx.hash,
                            chainId: wallet.chainId ?? 0,
                            contract: environment.DAO_ADDRESS,
                            tag: 'createProposal',
                            timestamp: Date.now(),
                        });
                        this.toast.info('Transaction submitted. Waiting for confirmation…');
                    }),
                    switchMap((tx: ethers.TransactionResponse) =>
                        from(tx.wait()).pipe(map(() => tx.hash)),
                    ),
                ),
            ),
            tap((hash: string) => {
                this.toast.success('Proposal created (tx confirmed)');
                if (hash) removePendingTx(hash);
            }),
            catchError((e) => {
                this.toast.error(this.humanizeEthersError(e));
                return of(null);
            }),
        );
    }

    private humanizeEthersError(e: any): string {
        const msg =
            e?.shortMessage ||
            e?.reason ||
            e?.info?.error?.message ||
            e?.message ||
            'Transaction failed';

        if (String(msg).includes('DAO: insufficient balance to create proposal')) {
            return 'Insufficient governance token balance to create proposal.';
        }

        if (String(msg).includes('Only owner')) {
            return 'Only owner can create proposals.';
        }

        if (e?.code === 'ACTION_REJECTED') {
            return 'You rejected the transaction in the wallet.';
        }

        if (String(msg).includes('DAO: voting period is still active')) {
            return 'Voting is still active. You can execute only after the deadline.';
        }

        if (String(msg).includes('DAO: proposal did not reach quorum')) {
            return 'Quorum not reached. Proposal cannot be executed.';
        }

        if (String(msg).includes('OwnableUnauthorizedAccount') || String(msg).includes('Only owner')) {
            return 'Only owner can execute proposals.';
        }

        return msg;
    }

    vote$(proposalId: number, support: boolean): Observable<string | null> {
        const wallet: WalletInfo = this.eth.getCurrentWalletInfo;
        if (!wallet?.address) {
            this.toast.error('Wallet not connected');
            return of(null);
        }

        const votedSet = new Set(getVotedIds());
        if (votedSet.has(String(proposalId))) {
            this.toast.info('You have already voted (local check).');
            return of(null);
        }
        return defer(() => from(this.writeContract())).pipe(
            tap(() => this.toast.info('Sign the vote transaction in your wallet…')),
            switchMap((c) =>
                from(c['vote'](proposalId, support)).pipe(
                    tap((tx: ethers.TransactionResponse) => {
                        savePendingTx({
                            hash: tx.hash,
                            chainId: wallet.chainId,
                            contract: environment.DAO_ADDRESS,
                            tag: 'vote',
                            proposalId,
                            timestamp: Date.now(),
                        });
                        this.markProposalStatus(proposalId, 'pending', tx.hash);
                    }),
                    switchMap((tx: ethers.TransactionResponse) => from(tx.wait()).pipe(map(() => tx.hash))),
                ),
            ),
            tap((hash: string) => {
                addVotedId(String(proposalId));
                this.toast.success('Vote confirmed');
                this.markProposalStatus(proposalId, 'success', hash);
                if (hash) removePendingTx(hash);
                this.refreshProposal$(proposalId).subscribe();
            }),
            catchError((e) => {
                console.error(e);
                this.toast.error(e?.shortMessage || e?.message || 'Vote failed');
                this.markProposalStatus(proposalId, 'error', null, e?.message);
                return of(null);
            }),
        );
    }

    private checkCreateProposalPrereqs$(wallet: WalletInfo): Observable<void> {
        const contract: Contract = this.readContract();

        return defer(() =>
            from(Promise.all([
                contract['owner']() as Promise<string>,
                contract['minTokensToCreateProposal']() as Promise<bigint>,
                contract['GOVERNANCE_TOKEN']() as Promise<string>,
            ]))
        ).pipe(
            switchMap(([owner, min, tokenAddress]) => {
                // if (wallet.address.toLowerCase() !== String(owner).toLowerCase()) {
                //     throw new Error('Only owner can create proposals');
                // }

                const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.rpc.getRpcProvider);

                return defer(() => from(Promise.all([
                    token['balanceOf'](wallet.address) as Promise<bigint>,
                    token['decimals']().catch(() => 18) as Promise<number>,
                    token['symbol']().catch(() => 'TOKEN') as Promise<string>,
                ]))).pipe(
                    map(([bal, decimals, symbol]) => {
                        if (bal < min) {
                            const balFmt: string = ethers.formatUnits(bal, decimals);
                            const minFmt: string = ethers.formatUnits(min, decimals);
                            throw new Error(`Insufficient ${symbol} balance. Need ${minFmt}, you have ${balFmt}.`);
                        }
                        return void 0;
                    }),
                );
            }),
        );
    }

    executeProposal$(proposalId: number): Observable<string | null> {
        const wallet = this.eth.getCurrentWalletInfo;
        if (!wallet?.address) {
            this.toast.error('Wallet not connected');
            return of(null);
        }

        const p = this.proposals().find(x => x.id === proposalId);
        if (!p) return of(null);

        if (p.executed) {
            this.toast.info('Proposal is already executed.');
            return of(null);
        }

        const now = Math.floor(Date.now() / 1000);
        if (now < p.deadline) {
            this.toast.info('Voting is still active. Wait until deadline.');
            return of(null);
        }

        const total = p.voteCountForRaw + p.voteCountAgainstRaw;
        const quorum = (total * 50n) / 100n;
        if (total === 0n || !(p.voteCountForRaw > quorum)) {
            this.toast.error('Quorum not reached. Cannot execute.');
            return of(null);
        }

        return defer(() => from(this.writeContract())).pipe(
            tap(() => this.toast.info('Sign the execute transaction in your wallet…')),
            switchMap((c: Contract) =>
                from(c['executeProposal'](proposalId, false)).pipe(
                    tap((tx: ethers.TransactionResponse) => {
                        savePendingTx({
                            hash: tx.hash,
                            chainId: wallet.chainId ?? 0,
                            contract: environment.DAO_ADDRESS,
                            tag: 'executeProposal',
                            proposalId,
                            timestamp: Date.now(),
                        });
                        this.markProposalStatus(proposalId, 'pending', tx.hash);
                        this.toast.info('Execution submitted. Waiting for confirmation…');
                    }),
                    switchMap((tx: ethers.TransactionResponse) =>
                        from(tx.wait()).pipe(map(() => tx.hash)),
                    ),
                ),
            ),
            tap((hash: string) => {
                this.toast.success('Proposal executed (tx confirmed)');
                this.markProposalStatus(proposalId, 'success', hash);
                if (hash) removePendingTx(hash);
                this.refreshProposal$(proposalId).subscribe();
            }),
            catchError((e) => {
                this.toast.error(this.humanizeEthersError(e));
                this.markProposalStatus(proposalId, 'error', null, e?.message);
                return of(null);
            }),
        );
    }

    private refreshProposal$(proposalId: number): Observable<void> {
        const c = this.readContract();
        return defer(() => from(c['getProposal'](proposalId))).pipe(
            tap((p) => {
                const votedSet = new Set(getVotedIds());
                const vm = this.toVM(p, votedSet.has(String(proposalId)));
                this.proposals.update((list) => list.map((x) => (x.id === proposalId ? {...x, ...vm} : x)));
            }),
            map(() => void 0),
            catchError(() => of(void 0)),
        );
    }

    private markProposalStatus(id: number, status: ProposalVM['status'], hash?: string | null, err?: string) {
        this.proposals.update((list) => list.map((p) => p.id === id ? {...p, status, lastTxHash: hash ?? p.lastTxHash, lastError: err ?? null} : p),
        );
    }

    private attachListeners(): void {
        const contract: Contract = this.readContract();

        contract.on('ProposalCreated', async (id: bigint, description: string, creator: string) => {
            const proposalId: number = Number(id);
            addStoredProposalId(String(proposalId));

            const p = await contract['getProposal'](proposalId);
            const votedSet = new Set(getVotedIds());
            const vm: ProposalVM = this.toVM(p, votedSet.has(String(proposalId)));

            this.proposals.update((list) => {
                if (list.some((x) => x.id === proposalId)) return list;
                return [{...vm, status: 'success'}, ...list];
            });

            this.toast.success(`Proposal #${proposalId} confirmed`);
        });

        contract.on('Voted', async (id: bigint, voter: string, suport: boolean, amount: bigint) => {
            const proposalId: number = Number(id);
            this.refreshProposal$(proposalId).subscribe();
        });

        contract.on('ProposalExecuted', async (id: bigint) => {
            const proposalId = Number(id);

            this.toast.success(`Proposal #${proposalId} executed`);
            this.refreshProposal$(proposalId).subscribe();
        });
    }
}