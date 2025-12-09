import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AuthNonceResponse, AuthVerifyResponse} from "../../common/interfaces/web3-auth.interfaces";
import {url} from "../../../environments/environment";

@Injectable({providedIn: 'root'})
export class Web3AuthApiService {
    private readonly baseUrl = `${url}/api/auth`;

    constructor(private http: HttpClient) {
    }

    getNonce(address: string): Observable<AuthNonceResponse> {
        return this.http.get<AuthNonceResponse>(`${this.baseUrl}/nonce`, {
            params: {address},
            withCredentials: true
        });
    }

    verify(message: string, signature: string): Observable<AuthVerifyResponse> {
        return this.http.post<AuthVerifyResponse>(`${this.baseUrl}/verify`, {
            message,
            signature,
        }, {
            withCredentials: true
        });
    }

    logout(): Observable<{success: true}> {
        return this.http.post<{success: true}>(`${this.baseUrl}/logout`, {}, {
            withCredentials: true
        });
    }

    checkHealth(): Observable<{success: true}> {
        return this.http.get<{success: true}>(`${this.baseUrl}/health`, {
            withCredentials: true
        });
    }
}