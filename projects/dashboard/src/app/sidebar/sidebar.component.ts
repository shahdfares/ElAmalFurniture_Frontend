import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServices } from '../services/auth-services';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})

export class SidebarComponent {
  navItems: NavItem[] = [
    { label: 'Overview', route: '/home' },
    { label: 'Products', route: '/products' },
  ];

  constructor(private auth: AuthServices, private router: Router) {}

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
