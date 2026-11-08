import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CategoryServices, ProductServices } from 'shared';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent implements OnInit {
  private categoryService = inject(CategoryServices);
  private productService = inject(ProductServices);

  year = new Date().getFullYear();
  collections = signal<any[]>([]);

  ngOnInit() {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        const list: any[] = Array.isArray(res)
          ? res
          : res?.data ?? res?.items ?? res?.categories ?? [];

        if (!list.length) return;

        // نفحص كل category: هل فيها منتجات؟
        const checks = list.map((c) =>
          this.productService.getAll({ categorySlug: c.slug }).pipe(
            map((r: any) => {
              const items: any[] = Array.isArray(r)
                ? r
                : r?.data ?? r?.items ?? [];
              return items.length > 0 ? c : null;
            }),
            catchError(() => of(null))
          )
        );

        forkJoin(checks).subscribe((result) => {
          const withProducts = result.filter((c) => c !== null);
          // آخر 5 categories فيها منتجات
          this.collections.set(withProducts.slice(-5));
        });
      },
      error: (err) => console.error('Failed to load categories:', err),
    });
  }
}
