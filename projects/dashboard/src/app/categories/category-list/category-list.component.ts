import { Component, OnInit } from '@angular/core';
import { Category, CategoryServices } from 'shared';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css',
  standalone: false,
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  searchTerm = '';

  private readonly avatarColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
  ];

  constructor(private categoryServices: CategoryServices) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.categoryServices.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load categories. Please try again.';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  get filteredCategories(): Category[] {
    if (!this.searchTerm.trim()) return this.categories;
    const term = this.searchTerm.toLowerCase();
    return this.categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term)
    );
  }

  getTotalProducts(): number {
    return this.categories.reduce((sum, c) => sum + (c.productsCount || 0), 0);
  }

  getAvatarColor(index: number): string {
    return this.avatarColors[index % this.avatarColors.length];
  }
}
