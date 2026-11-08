import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { HttpClientModule } from '@angular/common/http';
import { API_URL } from 'shared';
import { environment } from '../environments/environment';

import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { AboutComponent } from './about/about.component';
import { ProductComponent } from './product/product.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { CategoryComponent } from './category/category.component';

@NgModule({
  declarations: [
    App,
    HomeComponent,
    NavbarComponent,
    FooterComponent,
    NotfoundComponent,
    AboutComponent,
    ProductComponent,
    ProductDetailsComponent,
    CategoryComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: API_URL, useValue: environment.apiUrl },
  ],
  bootstrap: [App],
})
export class AppModule {}
