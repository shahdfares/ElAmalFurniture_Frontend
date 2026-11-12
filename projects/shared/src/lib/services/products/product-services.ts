import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../api-url.token';
import { PaginationResponse, Product, ProductFilter } from '../../../public-api';



@Injectable({
  providedIn: 'root',
})
export class ProductServices {
  constructor (private _httpClient:HttpClient,
    @Inject (API_URL) private apiUrl:string
  ){}

  getAll(filter: ProductFilter = {}):Observable<PaginationResponse<Product>>{

    let params = new HttpParams();

    if (filter.pageIndex) params = params.set('pageIndex', filter.pageIndex);

    if (filter.categorySlug) params = params.set('categorySlug', filter.categorySlug);

    if (filter.sort) params = params.set('sort', filter.sort);

      return this._httpClient.get<PaginationResponse<Product>>
      (`${this.apiUrl}/product`, {params})
  }


getProductDetails(categorySlug: string, productSlug: string):Observable<any>{

    return this._httpClient.get(`${this.apiUrl}/product/${categorySlug}/${productSlug}`)
  }

updateProduct(id: string, body: FormData): Observable<any> {
  return this._httpClient.put(`${this.apiUrl}product/${id}`, body);
}

deleteProduct(id: string):Observable<any>{
  return this._httpClient.delete(`${this.apiUrl}/product/${id}`)
}

updateVisibility(id: string, isVisibile: boolean):Observable<any>{
  return this._httpClient.patch(`${this.apiUrl}/product/${id}/visibility`, {isVisibile})
}

setPrimaryImage(productId:string, imageId:string):Observable<any>{
  return this._httpClient.patch(`${this.apiUrl}/product/${productId}/primary-image/${imageId}`, {})
}

addProduct(formData: FormData): Observable<any> {
  return this._httpClient.post(`${this.apiUrl}/product`, formData);
}

}
