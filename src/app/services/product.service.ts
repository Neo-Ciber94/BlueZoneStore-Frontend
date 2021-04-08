import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Product } from '../models/Product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient) { }

  post(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(environment.apiUrl, product);
  }

  update(product: Product): Observable<Product> {
    return this.http.put<Product>(environment.apiUrl, product);
  }

  delete(id: number): Observable<Product> {
    return this.http.delete<Product>(`${environment.apiUrl}/${id}`);
  }

  getById(id: number): Observable<Product|undefined> {
    return this.http.get<Product>(`${environment.apiUrl}/${id}`);
  }

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}`);
  }
}
