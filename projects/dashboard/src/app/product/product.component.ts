import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ProductServices,
  Product,
  ProductImages,
  PaginationResponse,
  CategoryServices,
} from 'shared';

interface CategoryChip {
  name: string;
  slug: string;
  count: number;
}

@Component({
  selector: 'app-product',
  standalone: false,
  templateUrl: './product.component.html',
  styleUrl: './product.component.css',
})
export class ProductComponent implements OnInit {
  // ---------- Data ----------
  products: Product[] = [];
  categories: CategoryChip[] = [];
  totalAll = 0;
  totalCount = 0;
  loading = true;

  // ---------- Filters ----------
  selectedSlug: string | null = null;
  search = '';
  statusFilter: 'all' | 'visible' | 'hidden' = 'all';
  sort = 'newest'; // غيّريها لو الـ API بيستخدم قيم تانية

  // ---------- Categories chips ----------
  readonly VISIBLE_CATS = 5;
  showAllCats = false;

  // ---------- Pagination ----------
  page = 1;
  pageSize = 0;

  // ---------- Delete dialog ----------
  productToDelete: Product | null = null;
  deleting = false;

  // ---------- Gallery ----------
  galleryProduct: Product | null = null;
  imageToPrimary: ProductImages | null = null;
  settingPrimary = false;

  constructor(
    private productServices: ProductServices,
    private categoryServices: CategoryServices,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  // ================= Categories =================
  get shownCategories(): CategoryChip[] {
    return this.showAllCats ? this.categories : this.categories.slice(0, this.VISIBLE_CATS);
  }

  get hiddenCount(): number {
    return Math.max(this.categories.length - this.VISIBLE_CATS, 0);
  }

  loadCategories(): void {
    this.categoryServices.getCategories().subscribe({
      next: (cats: any[]) => {
        if (!cats?.length) return;

        forkJoin(
          cats.map((c) =>
            this.productServices.getAll({ categorySlug: c.slug, pageIndex: 1 }).pipe(
              map((r) => r.count),
              catchError(() => of(0))
            )
          )
        ).subscribe((counts) => {
          this.categories = cats.map((c, i) => ({
            name: c.name,
            slug: c.slug,
            count: counts[i],
          }));
          this.cdr.detectChanges();
        });
      },
      error: (err: unknown) => console.error('Failed to load categories:', err),
    });
  }

  selectCategory(slug: string | null): void {
    this.selectedSlug = slug;
    this.page = 1;
    this.loadProducts();
  }

  // ================= Products =================
  loadProducts(): void {
    this.loading = true;
    this.productServices
      .getAll({
        pageIndex: this.page,
        categorySlug: this.selectedSlug ?? undefined,
        sort: this.sort || undefined,
      })
      .subscribe({
        next: (res: PaginationResponse<Product>) => {
          this.products = res.data;
          this.totalCount = res.count;
          if (!this.selectedSlug) this.totalAll = res.count;

          const size = (res as any).pageSize ?? res.data.length;
          if (size > this.pageSize) this.pageSize = size;

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('Failed to load products:', err);
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // البحث بالاسم + فلتر الحالة (على منتجات الصفحة الحالية)
  get filteredProducts(): Product[] {
    const q = this.search.trim().toLowerCase();
    return this.products.filter((p) => {
      const matchSearch = !q || p.name?.toLowerCase().includes(q);
      const visible = this.isVisible(p);
      const matchStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'visible' ? visible : !visible);
      return matchSearch && matchStatus;
    });
  }

  onSortChange(): void {
    this.page = 1;
    this.loadProducts();
  }

  // ================= Helpers =================
  getPrimaryImage(p: Product): string {
    return (
      p.productImages?.find((img) => img.isPrimary)?.imagesUrl ??
      p.productImages?.[0]?.imagesUrl ??
      ''
    );
  }

  isVisible(p: Product): boolean {
    return p.isVisibile ?? true;
  }

  // ================= Visibility =================
  toggleVisibility(p: Product): void {
    const next = !this.isVisible(p);
    this.productServices.updateVisibility(p.id, next).subscribe({
      next: () => {
        p.isVisibile = next;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => console.error('Failed to update visibility:', err),
    });
  }

  // ================= Pagination =================
  get totalPages(): number {
    return this.pageSize ? Math.ceil(this.totalCount / this.pageSize) : 1;
  }

  get from(): number {
    return this.totalCount === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get to(): number {
    return Math.min(this.page * this.pageSize, this.totalCount);
  }

  get pageList(): (number | '…')[] {
    const total = this.totalPages;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const list: (number | '…')[] = [1];
    if (this.page > 3) list.push('…');
    for (let i = Math.max(2, this.page - 1); i <= Math.min(total - 1, this.page + 1); i++) {
      list.push(i);
    }
    if (this.page < total - 2) list.push('…');
    list.push(total);
    return list;
  }

  goTo(p: number | '…'): void {
    if (p === '…' || p === this.page || p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadProducts();
  }

  // ================= Delete =================
  openDeleteDialog(p: Product): void {
    this.productToDelete = p;
  }

  closeDeleteDialog(): void {
    if (this.deleting) return;
    this.productToDelete = null;
  }

  confirmDelete(): void {
    const p = this.productToDelete;
    if (!p) return;

    this.deleting = true;
    this.productServices.deleteProduct(p.id).subscribe({
      next: () => {
        this.deleting = false;
        this.productToDelete = null;
        if (this.products.length === 1 && this.page > 1) this.page--;
        this.loadProducts();
        this.loadCategories();
      },
      error: (err: unknown) => {
        console.error('Failed to delete product:', err);
        this.deleting = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ================= Gallery =================
  openGallery(p: Product): void {
    this.galleryProduct = p;
  }

  closeGallery(): void {
    if (this.settingPrimary) return;
    this.imageToPrimary = null;
    this.galleryProduct = null;
  }

  askPrimary(img: ProductImages): void {
    if (img.isPrimary) return;
    this.imageToPrimary = img;
  }

  cancelPrimary(): void {
    if (this.settingPrimary) return;
    this.imageToPrimary = null;
  }

  confirmPrimary(): void {
    const p = this.galleryProduct;
    const img = this.imageToPrimary;
    if (!p || !img) return;

    this.settingPrimary = true;
    this.productServices.setPrimaryImage(p.id, (img as any).id).subscribe({
      next: () => {
        p.productImages.forEach((i) => (i.isPrimary = i === img));
        this.settingPrimary = false;
        this.imageToPrimary = null;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to set primary image:', err);
        this.settingPrimary = false;
        this.cdr.detectChanges();
      },
    });
  }
}
