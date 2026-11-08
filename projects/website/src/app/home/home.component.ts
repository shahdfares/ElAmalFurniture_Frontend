import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Category, CategoryServices, Product, ProductServices } from 'shared';

interface CategoryCard {
  name: string;
  slug: string;
  image: string;
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  heroImages = ['/images/hero.png', '/images/hero2.png', '/images/hero3.png'];
  currentIndex = 0;
  private timer?: ReturnType<typeof setInterval>;

  readonly fallbackImage = '/images/No-Image-Found.png';
  categoryCards: CategoryCard[] = [];
  featuredProducts: Product[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private _categoryServices: CategoryServices,
    private _productServices: ProductServices
  ) {}

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.heroImages.length;
      this.cdr.detectChanges();
    }, 5000);

    this.loadCategories();
    this.loadFeaturedProducts();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  // First 5 categories that have products, using the first product's image
  private loadCategories(): void {
    this._categoryServices.getCategories().pipe(
      switchMap((cats: Category[]) => {
        if (!cats.length) return of([] as (CategoryCard | null)[]);

        return forkJoin(
          cats.map((c) =>
            this._productServices.getAll({ categorySlug: c.slug, pageIndex: 1 }).pipe(
              map((res): CategoryCard | null =>
                res.data?.length
                  ? { name: c.name, slug: c.slug, image: this.getImage(res.data[0]) }
                  : null
              ),
              catchError(() => of(null))
            )
          )
        );
      })
    ).subscribe({
      next: (cards) => {
        this.categoryCards = cards
          .filter((c): c is CategoryCard => c !== null)
          .slice(0, 5);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load categories:', err),
    });
  }

  // First 5 products
  private loadFeaturedProducts(): void {
    this._productServices.getAll({ pageIndex: 1 }).subscribe({
      next: (res) => {
        this.featuredProducts = res.data.slice(0, 5);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load products:', err),
    });
  }

  // Primary image, falling back to the first image, then the placeholder
  getImage(product?: Product): string {
    return (
      product?.productImages?.find((img) => img.isPrimary)?.imagesUrl ??
      product?.productImages?.[0]?.imagesUrl ??
      this.fallbackImage
    );
  }
}
