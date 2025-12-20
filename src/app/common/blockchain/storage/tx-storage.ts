export const TX_STORAGE_KEY = 'pending_transactions';

export type StoredTx = {
    hash: string;
    chainId: number;
    contract?: string;
    tag?: 'createProposal' | 'vote';
    proposalId?: number;
    timestamp: number;
};

export function getTxs(): StoredTx[] {
    try { return JSON.parse(localStorage.getItem(TX_STORAGE_KEY) || '[]'); } catch { return []; }
}

export function savePendingTx(tx: StoredTx) {
    const list = getTxs();
    if (list.some((t) => t.hash === tx.hash)) return;
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify([...list, tx]));
}

export function removePendingTx(hash: string) {
    const list = getTxs().filter((t) => t.hash !== hash);
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(list));
}

export function clearOldTxs(maxAgeMinutes = 60) {
    const cutoff = Date.now() - maxAgeMinutes * 60_000;
    const list = getTxs().filter((t) => t.timestamp > cutoff);
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(list));
}