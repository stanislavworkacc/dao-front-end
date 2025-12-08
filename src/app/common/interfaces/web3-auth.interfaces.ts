export interface AuthNonceResponse {
    nonce: string;
}

export interface AuthVerifyResponse {
    success: boolean;
    address: string;
    chainId: number;
}