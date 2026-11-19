import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})

export class NavbarComponent implements OnDestroy {
  title = '';

  // Page names by route (checked in order, first match wins)
  private readonly titles: { path: string; label: string }[] = [
    { path: '/home', label: 'Overview' },
    { path: '/products', label: 'Products' },
    { path: '/addproduct', label: 'Add Product' },
    { path: '/settings', label: 'Settings' },
  ];

  private sub: Subscription;

  constructor(private router: Router, private route: ActivatedRoute) {
    // Set the title right away (covers the first load / page refresh)
    this.updateTitle();

    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.updateTitle());
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private updateTitle(): void {
    // 1) A title set on the route (data: { title: '...' }) wins
    let r = this.route;
    while (r.firstChild) r = r.firstChild;
    const fromRoute = r.snapshot.data['title'];
    if (fromRoute) {
      this.title = fromRoute;
      return;
    }

    // 2) Otherwise match the current URL
    const url = this.router.url.split('?')[0].split('#')[0].toLowerCase();
    const match = this.titles.find(
      (t) => url === t.path || url.startsWith(t.path + '/')
    );
    if (match) {
      this.title = match.label;
      return;
    }

    // 3) Fallback: the last URL segment, capitalized
    const last = url.split('/').filter(Boolean).pop() ?? '';
    this.title = last ? last.charAt(0).toUpperCase() + last.slice(1) : '';
  }
}
