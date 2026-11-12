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

  addCategories(name: string):Observable<any>{
    return this._HttpClient.post(`${this.apiUrl}/category`,{name} );
  }

  updateCategories(id: string, name: string):Observable<any>{
    return this._HttpClient.put(`${this.apiUrl}/category/${id}`, {name});
  }

  deleteCategories(id: string):Observable<any>{
    return this._HttpClient.delete(`${this.apiUrl}/category/${id}`);
  }
}
