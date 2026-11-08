import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Category, CategoryServices, Product, ProductServices } from 'shared';

interface CategoryCard {
  id: string;
  name: string;
  slug: string;
  productsCount: number;
  image: string;
}

@Component({
  selector: 'app-category',
  standalone: false,
  templateUrl: './category.component.html',
  styleUrl: './category.component.css',
})
export class CategoryComponent implements OnInit {
  categoryCards: CategoryCard[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  readonly fallbackImage = '/images/No-Image-Found.png';

  constructor(
    private cdr: ChangeDetectorRef,
    private _categoryServices: CategoryServices,
    private _productServices: ProductServices
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this._categoryServices.getCategories().pipe(
      switchMap((cats: Category[]) => {
        if (!cats.length) return of([] as CategoryCard[]);

        return forkJoin(
          cats.map((c) =>
            this._productServices.getAll({ categorySlug: c.slug, pageIndex: 1 }).pipe(
              map((res): CategoryCard => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                productsCount: c.productsCount,
                image: res.data?.length ? this.getImage(res.data[0]) : this.fallbackImage,
              })),
              catchError(() =>
                of<CategoryCard>({
                  id: c.id,
                  name: c.name,
                  slug: c.slug,
                  productsCount: c.productsCount,
                  image: this.fallbackImage,
                })
              )
            )
          )
        );
      })
    ).subscribe({
      next: (cards) => {
        this.categoryCards = cards;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.errorMessage = 'Failed to load categories. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  retry(): void {
    this.loadCategories();
  }

  getImage(product?: Product): string {
    return (
      product?.productImages?.find((img) => img.isPrimary)?.imagesUrl ??
      product?.productImages?.[0]?.imagesUrl ??
      this.fallbackImage
    );
  }
}
