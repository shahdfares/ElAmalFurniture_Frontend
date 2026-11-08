import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { CategoryListComponent } from './categories/category-list/category-list.component';

import { API_URL } from 'shared';

@NgModule({
  declarations: [App, CategoryListComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: API_URL, useValue: 'http://localhost:3000/api' },
  ],
  bootstrap: [App],
})
export class AppModule {}
