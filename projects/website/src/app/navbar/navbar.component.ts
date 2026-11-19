import {
  Component, OnDestroy, OnInit, ChangeDetectorRef,
  ElementRef, HostListener, ViewChild
} from '@angular/core';
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

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  dashboardUrl = environment.dashboard;

  showSearch = false;
  searchTerm = '';
  currentLanguage: 'EN' | 'AR' = 'EN';

  isHomePage = false;
  currentUrl = '';

  categories: Category[] = [];
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
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
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
    this.currentUrl = url;
    this.isHomePage =
      url === '/home' || url === '/' || url.startsWith('/home?');
  }

  // Categories ينور لما نكون جوه /collections/:slug
  get isCategoryRoute(): boolean {
    return this.currentUrl.startsWith('/collections/');
  }

  // ---------- Categories dropdown ----------

  openCategories(): void {
    if (!this.categoriesOpen) {
      this.categoriesOpen = true;
      this.cdr.detectChanges();
    }
  }

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

  // ---------- Search ----------

  // الضغط على الأيقونة: يفتح ويفضل مفتوح (مفيش toggle)
  onSearchIconClick(): void {
    if (!this.showSearch) {
      this.openSearch();
    } else if (this.searchTerm.trim()) {
      this.submitSearch();          // لو في كلمة مكتوبة يبحث
    } else {
      this.searchInput?.nativeElement.focus();
    }
  }

  openSearch(): void {
    this.showSearch = true;
    this.cdr.detectChanges();
    setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
  }

  closeSearch(): void {
    if (this.showSearch) {
      this.showSearch = false;
      this.searchTerm = '';
      this.cdr.detectChanges();
    }
  }

  submitSearch(): void {
    const query = this.searchTerm.trim();
    if (!query) return;

    this.router.navigate(['/collections'], {
      queryParams: { search: query },
    });
  }

  // ---------- Outside click / Escape ----------

  @HostListener('document:pointerdown', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node;
    const host: HTMLElement = this.elRef.nativeElement;

    const dropdown = host.querySelector('.categories-dropdown');
    if (dropdown && !dropdown.contains(target)) {
      this.closeCategories();
    }

    const search = host.querySelector('.search-container');
    if (this.showSearch && search && !search.contains(target)) {
      this.closeSearch();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSearch();
    this.closeCategories();
  }

  // ---------- Language ----------

  get nextLanguage(): 'EN' | 'AR' {
    return this.currentLanguage === 'EN' ? 'AR' : 'EN';
  }

  toggleLanguage(): void {
    this.currentLanguage = this.currentLanguage === 'EN' ? 'AR' : 'EN';
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }
}
