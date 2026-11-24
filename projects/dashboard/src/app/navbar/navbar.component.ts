import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  title = '';

  constructor(private router: Router, private route: ActivatedRoute) {
    this.updateTitle();

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.updateTitle());
  }

  private updateTitle() {
    let r: ActivatedRoute | null = this.route.root;
    while (r?.firstChild) {
      r = r.firstChild;
    }
    this.title = r?.snapshot?.data?.['title'] ?? '';
  }
}
