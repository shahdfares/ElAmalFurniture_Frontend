
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  Category,
  CategoryServices,
  Product,
  ProductServices
} from 'shared';

import { environment } from '../../environments/environment';

import {
  HubConnection,
  HubConnectionBuilder
} from '@microsoft/signalr';


@Component({
  selector: 'app-product',
  standalone: false,
  templateUrl: './product.component.html',
  styleUrl: './product.component.css',
})
export class ProductComponent implements OnInit, OnDestroy {

  // ---------- Products ----------
  products: Product[] = [];

  pageIndex = 1;
  pageSize = 0;
  totalPages = 1;
  pages: number[] = [];
  totalCount = 0;

  // ---------- Category ----------
  categories: Category[] = [];
  selectedCategory = '';

  visibleCount = 5;
  showAll = false;

  // ---------- Sort ----------
  selectedSort = '';

  sortOptions = [
    { label: 'Newest First', value: 'Newest' },
    { label: 'Oldest First', value: 'Oldest' },
    { label: 'Name A – Z', value: 'NameAsc' },
    { label: 'Name Z – A', value: 'NameDesc' },
  ];

  private routeSub!: Subscription;

  // ---------- SignalR ----------
  private hubConnection?: HubConnection;

  constructor(
    private _productServices: ProductServices,
    private _categoryServices: CategoryServices,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  // ---------- On Init ----------
  ngOnInit(): void {

    this.loadCategories();

    // Connect to SignalR
    this.connectToProductHub();

    // Runs on first load and every time the category changes
    this.routeSub = this.route.paramMap.subscribe((params) => {

      this.selectedCategory = params.get('categorySlug') ?? '';

      this.pageIndex = 1;

      this.loadProducts();

    });

  }

  // ---------- On Destroy ----------
  ngOnDestroy(): void {

    this.routeSub?.unsubscribe();

    // Stop SignalR connection
    this.hubConnection?.stop();

  }

  // ---------- SignalR ----------
  private async connectToProductHub(): Promise<void> {

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(environment.hubUrl)
      .withAutomaticReconnect()
      .build();

    // When product visibility changes
    this.hubConnection.on('ProductVisibilityChanged', () => {

      console.log('Product visibility changed. Reloading products...');

      this.loadProducts();

    });

    // When primary image changes
    this.hubConnection.on('PrimaryImageChanged', (productId: string) => {

      console.log('Primary image changed for product:', productId);

      this.loadProducts();

    });

    try {

      await this.hubConnection.start();

      console.log('Connected to Product Hub');

    } catch (error) {

      console.error('SignalR connection failed:', error);

    }

  }

  // ---------- Products ----------
  loadProducts(): void {

    this._productServices.getAll({

      pageIndex: this.pageIndex,
      categorySlug: this.selectedCategory,
      sort: this.selectedSort,

    }).subscribe({

      next: (response) => {

        this.products = response.data;

        this.pageIndex = response.pageIndex;
        this.pageSize = response.pageSize;
        this.totalCount = response.count;

        this.totalPages = Math.max(
          1,
          Math.ceil(response.count / response.pageSize)
        );

        this.pages = Array.from(
          { length: this.totalPages },
          (_, i) => i + 1
        );

        this.cdr.detectChanges();

      },

      error: (err) => {

        console.error('Failed to load products:', err);

      },

    });

  }

  // ---------- Pagination ----------
  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.pageIndex
    ) return;

    this.pageIndex = page;

    this.loadProducts();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }

  // ---------- Primary Image ----------
  getPrimaryImage(product: Product): string {

    return product.productImages.find(img => img.isPrimary)?.imagesUrl
      ?? '/images/No-Image-Found.png';

  }

  // ---------- Products Count ----------
  get startIndex(): number {

    return this.totalCount === 0
      ? 0
      : (this.pageIndex - 1) * this.pageSize + 1;

  }

  get endIndex(): number {

    return (this.pageIndex - 1) * this.pageSize + this.products.length;

  }

  // ---------- Categories ----------
  loadCategories(): void {

    this._categoryServices.getCategories().subscribe({

      next: (res) => {

        this.categories = res;

        this.cdr.detectChanges();

      },

      error: (err) => {

        console.error('Failed to load categories:', err);

      },

    });

  }

  get visibleCategories(): Category[] {

    return this.showAll
      ? this.categories
      : this.categories.slice(0, this.visibleCount);

  }

  get hasMoreCategories(): boolean {

    return this.categories.length > this.visibleCount;

  }

  toggleShowAll(): void {

    this.showAll = !this.showAll;

  }

  // ---------- Select Category ----------
  // The URL is the source of truth
  selectCategory(slug: string): void {

    if (this.selectedCategory === slug) {

      this.router.navigate(['/collections']);

    } else {

      this.router.navigate(['/collections', slug]);

    }

  }

  get currentCategoryName(): string {

    return this.categories.find(c => c.slug === this.selectedCategory)?.name
      ?? 'All Products';

  }

  // ---------- Sort ----------
  selectSort(value: string): void {

    this.selectedSort = value;

    this.pageIndex = 1;

    this.loadProducts();

  }

  // ---------- Reset Filters ----------
  get hasActiveFilters(): boolean {

    return this.selectedCategory !== '' || this.selectedSort !== '';

  }

  resetFilters(): void {

    this.selectedSort = '';

    if (this.selectedCategory) {

      this.router.navigate(['/collections']);

    } else {

      this.pageIndex = 1;

      this.loadProducts();

    }

  }

}
