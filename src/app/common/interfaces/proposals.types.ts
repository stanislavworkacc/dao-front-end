export type TxState = 'idle' | 'signing' | 'pending' | 'success' | 'error';

export interface ProposalVM {
    id: number;
    description: string;
    executed: boolean;
    voteCountFor: string;      // formatted
    voteCountAgainst: string;  // formatted
    deadline: number;          // unix seconds
    status: TxState;           // status for last action
    lastTxHash?: string | null;
    lastError?: string | null;
    isVotedByMe?: boolean;     // UI-only guard
}