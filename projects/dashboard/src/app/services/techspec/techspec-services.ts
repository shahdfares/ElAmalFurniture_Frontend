import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from 'shared';

@Injectable({
  providedIn: 'root',
})
export class TechspecServices {
  constructor (private _httpClient:HttpClient,
    @Inject (API_URL) private apiUrl:string
  ){}

getTechSpec():Observable<any>{
    return this._httpClient.get(`${this.apiUrl}/TechnicalSpecifications`)
  }

addTechSpec(name: string):Observable<any>{
    return this._httpClient.post(`${this.apiUrl}/TechnicalSpecifications`, {name})
  }

updateTechSpec(id:string, name: string):Observable<any>{
    return this._httpClient.put(`${this.apiUrl}/TechnicalSpecifications/${id}`, {name})
  }


deleteTechSpec(id: string):Observable<any>{
    return this._httpClient.delete(`${this.apiUrl}/TechnicalSpecifications/${id}`)
  }
}
