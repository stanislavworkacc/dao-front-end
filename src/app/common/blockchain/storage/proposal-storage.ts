export const PROPOSALS_KEY = 'proposals';
export const VOTED_PROPOSALS_KEY = 'voted_proposals';

function readArray(key: string): string[] {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
        return [];
    }
}

function writeArray(key: string, value: string[]) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function getStoredProposalIds(): string[] {
    return readArray(PROPOSALS_KEY);
}

export function addStoredProposalId(id: string) {
    const current = getStoredProposalIds();
    if (current.includes(id)) return;
    writeArray(PROPOSALS_KEY, [...current, id]);
}

export function getVotedIds(): string[] {
    return readArray(VOTED_PROPOSALS_KEY);
}

export function addVotedId(id: string) {
    const current = getVotedIds();
    if (current.includes(id)) return;
    writeArray(VOTED_PROPOSALS_KEY, [...current, id]);
}