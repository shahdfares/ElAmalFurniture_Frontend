import { Component, OnDestroy, OnInit, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { Category, CategoryServices } from 'shared';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {

  dashboardUrl = environment.dashboard;

  showSearch = false;
  searchTerm = '';
  currentLanguage: 'EN' | 'AR' = 'EN';

  isHomePage = false;

  categories: Category[] = [];

  // Dropdown state
  categoriesOpen = false;

  private routerSubscription: Subscription;

  constructor(
    private router: Router,
    private _categoryServices: CategoryServices,
    private cdr: ChangeDetectorRef,
    private elRef: ElementRef
  ) {
    this.updateCurrentPage(this.router.url);

    this.routerSubscription = this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.updateCurrentPage(event.urlAfterRedirects);
        this.closeCategories();
      });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this._categoryServices.getCategories().subscribe({
      next: (res) => {
        this.categories = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load categories:', err),
    });
  }

  private updateCurrentPage(url: string): void {
    this.isHomePage =
      url === '/home' ||
      url === '/' ||
      url.startsWith('/home?');
  }

  // ---------- Categories dropdown ----------

  // Hover / Click: افتح
  openCategories(): void {
    if (!this.categoriesOpen) {
      this.categoriesOpen = true;
      this.cdr.detectChanges();
    }
  }

  // Click على اللينك: افتح (من غير toggle) ومتروحش لأي صفحة
  onCategoriesClick(event: Event): void {
    event.preventDefault();
    this.openCategories();
  }


  closeCategories(): void {
    if (this.categoriesOpen) {
      this.categoriesOpen = false;
      this.cdr.detectChanges();
    }
  }

  // pointerdown بيشتغل فوراً على الماوس واللمس
  @HostListener('document:pointerdown', ['$event'])
  onDocumentClick(event: Event): void {
    const dropdown = this.elRef.nativeElement.querySelector('.categories-dropdown');

    if (dropdown && !dropdown.contains(event.target as Node)) {
      this.closeCategories();
    }
  }

  get nextLanguage(): 'EN' | 'AR' {
    return this.currentLanguage === 'EN' ? 'AR' : 'EN';
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.searchTerm = '';
    }
    this.cdr.detectChanges();
  }

  toggleLanguage(): void {
    this.currentLanguage = this.currentLanguage === 'EN' ? 'AR' : 'EN';
    this.cdr.detectChanges();
  }

  submitSearch(): void {
    const query = this.searchTerm.trim();
    if (!query) return;
    console.log('Search:', query);
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }
}
