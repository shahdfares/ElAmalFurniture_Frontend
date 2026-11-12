import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServices } from '../services/auth-services';

interface NavItem {
  label: string;
  icon: string;
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
    { label: 'Overview', icon: 'dashboard', route: '/home' },
    { label: 'Products', icon: 'chair', route: '/products' },
    { label: 'Categories', icon: 'category', route: '/categories' },
    { label: 'Inventory', icon: 'inventory_2', route: '/inventory' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  constructor(private auth: AuthServices, private router: Router) {}

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
