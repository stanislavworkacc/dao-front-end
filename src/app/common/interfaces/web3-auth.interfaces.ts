export interface AuthNonceResponse {
    nonce: string;
}

export interface AuthVerifyResponse {
    success: boolean;
    message: string;
    address: string;
    chainId: number;
    token: string;
    expiresAt: string;
}