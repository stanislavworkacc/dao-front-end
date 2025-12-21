import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, map} from 'rxjs';
import {url} from '../../../environments/environment';
import {ProposalDto, ProposalResultDto} from '../../common/api/dao-api.types';

@Injectable({providedIn: 'root'})
export class DaoApiService {
    private readonly http: HttpClient = inject(HttpClient);
    private readonly base: string = `${url}/api`;

    getProposals$(): Observable<{data: ProposalDto[]}> {
        return this.http.get<{data: ProposalDto[]}>(`${this.base}/proposals`, {
            withCredentials: true,
        })
    }

    getProposalById$(id: number): Observable<any> {
        return this.http.get<ProposalDto>(`${this.base}/proposals/${id}`, {
            withCredentials: true,
        })
    }

    getResults$(id: number): Observable<any> {
        return this.http.get<ProposalResultDto>(`${this.base}/proposals/${id}/votes`, {
            withCredentials: true,
        })
    }
}