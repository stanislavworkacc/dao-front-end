export type ProposalStatus = 'pending' | 'active' | 'finished' | 'executed' | 'failed';

export interface ProposalDto {
    id: number;
    description: string;
    creator: string;
    executed: boolean;
    deadline?: number;
    createdAt?: string;
    status?: ProposalStatus;
}

export interface ProposalResultDto {
    id: number;
    voteFor: string;
    voteAgainst: string;
    quorumReached?: boolean;
}