import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Category, CategoryServices, Product, ProductServices } from 'shared';

@Component({
  selector: 'app-product',
  standalone: false,
  templateUrl: './product.component.html',
  styleUrl: './product.component.css',
})
export class ProductComponent implements OnInit, OnDestroy {

  // Products
  products: Product[] = [];
  pageIndex = 1;
  pageSize = 0;
  totalPages = 1;
  pages: number[] = [];
  totalCount = 0;

  // Category
  categories: Category[] = [];
  selectedCategory = '';
  visibleCount = 5;
  showAll = false;

  // Sort
  selectedSort = '';
  sortOptions = [
    { label: 'Newest First', value: 'Newest' },
    { label: 'Oldest First', value: 'Oldest' },
    { label: 'Name A – Z',   value: 'NameAsc' },
    { label: 'Name Z – A',   value: 'NameDesc' },
  ];

  private routeSub!: Subscription;

  constructor(
    private _productServices: ProductServices,
    private _categoryServices: CategoryServices,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();

    // Runs on first load and every time the :categorySlug changes (e.g. from the navbar)
    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.selectedCategory = params.get('categorySlug') ?? '';
      this.pageIndex = 1;
      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
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
        this.totalPages = Math.max(1, Math.ceil(response.count / response.pageSize));
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load products:', err);
      },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.pageIndex) return;

    this.pageIndex = page;
    this.loadProducts();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPrimaryImage(product: Product) {
    return product.productImages.find(img => img.isPrimary)?.imagesUrl
      ?? '/images/No-Image-Found.png';
  }

  get startIndex(): number {
    return this.totalCount === 0 ? 0 : (this.pageIndex - 1) * this.pageSize + 1;
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
      error: (err) => console.error('Failed to load categories:', err),
    });
  }

  get visibleCategories(): Category[] {
    return this.showAll ? this.categories : this.categories.slice(0, this.visibleCount);
  }

  get hasMoreCategories(): boolean {
    return this.categories.length > this.visibleCount;
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }

  // The URL is the source of truth: navigate and let paramMap reload the products
  selectCategory(slug: string): void {
    if (this.selectedCategory === slug) {
      this.router.navigate(['/collections']);
    } else {
      this.router.navigate(['/collections', slug]);
    }
  }

  get currentCategoryName(): string {
    return this.categories.find(c => c.slug === this.selectedCategory)?.name ?? 'All Products';
  }

  // ---------- Sort ----------
  selectSort(value: string): void {
    this.selectedSort = value;
    this.pageIndex = 1;
    this.loadProducts();
  }

  // ---------- Reset ----------
  get hasActiveFilters(): boolean {
    return this.selectedCategory !== '' || this.selectedSort !== '';
  }

  resetFilters(): void {
    this.selectedSort = '';

    if (this.selectedCategory) {
      this.router.navigate(['/collections']); // paramMap subscription reloads products
    } else {
      this.pageIndex = 1;
      this.loadProducts();
    }
  }
}
