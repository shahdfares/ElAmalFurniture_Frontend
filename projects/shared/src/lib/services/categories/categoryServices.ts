import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../api-url.token';

@Injectable({
  providedIn: 'root',
})
export class CategoryServices {
  constructor(private  _HttpClient:HttpClient,
    @Inject(API_URL) private apiUrl: string
  ){ }

  getCategories():Observable<any>{
    return this._HttpClient.get(`${this.apiUrl}/category`);
  }
}
