import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';


@Injectable()
export class APPService {
    constructor(private http: HttpClient) { }

    search(keyword: string): Promise<any> {
        return this.http.get<any>(`https://asia-east2-yt-master-queue.cloudfunctions.net/app/search/${keyword}`).toPromise()
    }

}