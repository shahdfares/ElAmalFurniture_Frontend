import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductServices, Product, PaginationResponse } from 'shared';

interface StatusPill {
  label: string;
  value: string;
  dot?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  adminName = 'Admin';

  statusPills: StatusPill[] = [
    { label: 'Catalog Sync', value: 'Live & Published', dot: true },
    { label: 'Storage Health', value: '99.8% Cloud Assets' },
  ];

  totalProducts: number | null = null;
  totalCategories: number | null = null;
  categoryNames: string[] = [];

  addedThisMonth: number | null = null;

  recentProducts: Product[] = [];

  loading = true;

  // ---------- Delete dialog state ----------
  productToDelete: Product | null = null;
  deleting = false;

  constructor(
    private productServices: ProductServices,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.productServices.getAll({ pageIndex: 1 }).subscribe({
      next: (res: PaginationResponse<Product>) => {
        this.totalProducts = res.count;

        const names = res.data.map((p) => p.category).filter(Boolean);
        this.categoryNames = [...new Set(names)];
        this.totalCategories = this.categoryNames.length;
        this.recentProducts = res.data.slice(0, 5);

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

  // ---------- Table helpers ----------
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

  timeAgo(date?: string): string {
    if (!date) return '—';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Added ${Math.max(mins, 1)} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Added ${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Added yesterday';
    return `Added ${days} days ago`;
  }

  addedAt(p: Product): string {
    return this.timeAgo((p as any).createdAt);
  }

  // ---------- Visibility ----------
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

  // ---------- Delete ----------
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
        this.loadStats();
      },
      error: (err: unknown) => {
        console.error('Failed to delete product:', err);
        this.deleting = false;
        this.cdr.detectChanges();
      },
    });
  }
}
