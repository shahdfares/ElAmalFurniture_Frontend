import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { ProductServices } from 'shared';
import { Category } from 'shared';
import { CategoryServices } from 'shared';
import { TechspecServices } from '../services/techspec/techspec-services';


interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
}

interface SpecRow {
  id: string;
  name: string;
  selected: boolean;
  value: string;
}

@Component({
  selector: 'app-addproduct',
  standalone: false,
  templateUrl: './addproduct.component.html',
  styleUrl: './addproduct.component.css',
})
export class AddproductComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private _CategoryServices = inject(CategoryServices);
  private _ProductServices = inject(ProductServices);
  private _TechSpecServices = inject(TechspecServices);

  readonly maxAssets = 8;
  readonly maxFileSize = 15 * 1024 * 1024; // 15MB
  readonly allowedTypes = ['image/png', 'image/jpeg'];

  @ViewChild('descriptionBox') descriptionBox!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  categories: Category[] = [];
  categoriesLoading = false;
  categoriesError = '';

  // Category dropdown
  categoryOpen = false;

  // Category add / rename modal
  categoryModal: { mode: 'add' | 'edit'; id?: string } | null = null;
  categoryModalName = '';
  categoryModalError = '';
  categoryModalSaving = false;

  // Category delete confirmation modal
  categoryToDelete: Category | null = null;
  categoryDeleting = false;

  media: MediaItem[] = [];
  primaryId: string | null = null;
  isDragging = false;
  uploadError = '';
  isSaving = false;

  // Technical specifications
  specs: SpecRow[] = [];
  specsLoading = false;
  specsError = '';

  // Add / rename modal
  specModal: { mode: 'add' | 'edit'; id?: string } | null = null;
  specModalName = '';
  specModalError = '';
  specModalSaving = false;

  // Delete confirmation modal
  specToDelete: SpecRow | null = null;
  specDeleting = false;

  toast: { type: 'success' | 'error'; message: string } | null = null;
  private toastTimer?: ReturnType<typeof setTimeout>;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    code: [''], // not required
    categoryId: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadSpecs();
  }

  ngOnDestroy(): void {
    clearTimeout(this.toastTimer);
    this.media.forEach(m => URL.revokeObjectURL(m.previewUrl));
  }

  // ---------- Toast ----------
  showToast(type: 'success' | 'error', message: string): void {
    clearTimeout(this.toastTimer);
    this.toast = { type, message };
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 4000);
  }

  closeToast(): void {
    clearTimeout(this.toastTimer);
    this.toast = null;
    this.cdr.detectChanges();
  }

  // ---------- Categories ----------
  loadCategories(selectName?: string): void {
    this.categoriesLoading = true;
    this.categoriesError = '';

    this._CategoryServices.getCategories().subscribe({
      next: (res) => {
        // Supports the API returning an array directly or wrapped in data / items
        this.categories = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
        this.categoriesLoading = false;

        // If the selected category no longer exists, clear the selection
        const current = this.form.controls.categoryId.value;
        if (current && !this.categories.some(c => String(c.id) === String(current))) {
          this.form.controls.categoryId.setValue('');
        }

        // Auto-select a category that was just added
        if (selectName) {
          const created = this.categories.find(
            c => c.name.toLowerCase() === selectName.toLowerCase()
          );
          if (created) this.form.controls.categoryId.setValue(String(created.id));
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.categoriesError = 'Failed to load categories.';
        this.categoriesLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get selectedCategoryName(): string {
    const id = this.form.controls.categoryId.value;
    if (!id) return '';
    return this.categories.find(c => String(c.id) === String(id))?.name ?? '';
  }

  isCategorySelected(c: Category): boolean {
    const id = this.form.controls.categoryId.value;
    return !!id && String(c.id) === String(id);
  }

  toggleCategoryDropdown(): void {
    if (this.categoryOpen) {
      this.closeCategoryDropdown();
    } else {
      this.categoryOpen = true;
    }
  }

  closeCategoryDropdown(): void {
    if (!this.categoryOpen) return;
    this.categoryOpen = false;
    this.form.controls.categoryId.markAsTouched();
  }

  selectCategory(c: Category): void {
    this.form.controls.categoryId.setValue(String(c.id));
    this.categoryOpen = false;
    this.form.controls.categoryId.markAsTouched();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.categoryOpen) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.cat-dropdown')) {
      this.closeCategoryDropdown();
    }
  }

  // ----- Category: add / rename -----
  openAddCategory(): void {
    this.categoryOpen = false;
    this.categoryModal = { mode: 'add' };
    this.categoryModalName = '';
    this.categoryModalError = '';
    this.focusById('category-modal-input');
  }

  openEditCategory(c: Category): void {
    this.categoryOpen = false;
    this.categoryModal = { mode: 'edit', id: String(c.id) };
    this.categoryModalName = c.name;
    this.categoryModalError = '';
    this.focusById('category-modal-input');
  }

  closeCategoryModal(): void {
    if (this.categoryModalSaving) return;
    this.categoryModal = null;
  }

  saveCategoryModal(): void {
    if (!this.categoryModal || this.categoryModalSaving) return;

    const modal = this.categoryModal;
    const name = this.categoryModalName.trim();

    if (!name) {
      this.categoryModalError = 'Name is required.';
      return;
    }

    const duplicate = this.categories.some(
      c => c.name.toLowerCase() === name.toLowerCase() && String(c.id) !== modal.id
    );
    if (duplicate) {
      this.categoryModalError = 'This category already exists.';
      return;
    }

    const request$ =
      modal.mode === 'add'
        ? this._CategoryServices.addCategories(name)
        : this._CategoryServices.updateCategories(modal.id!, name);

    this.categoryModalSaving = true;
    this.categoryModalError = '';

    request$.subscribe({
      next: () => {
        this.categoryModalSaving = false;
        this.categoryModal = null;

        if (modal.mode === 'edit') {
          // Show the new name immediately, without waiting for the list to reload
          this.categories = this.categories.map(c =>
            String(c.id) === modal.id ? { ...c, name } : c
          );
          this.cdr.detectChanges();
        }

        this.loadCategories(modal.mode === 'add' ? name : undefined);
        this.showToast('success', modal.mode === 'add' ? 'Category added.' : 'Category updated.');
      },
      error: (err) => {
        this.categoryModalSaving = false;
        console.error(err);
        this.categoryModalError =
          err?.error?.message || err?.error?.title || 'Something went wrong. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  // ----- Category: delete -----
  openDeleteCategory(c: Category): void {
    this.categoryOpen = false;
    this.categoryToDelete = c;
  }

  closeDeleteCategory(): void {
    if (this.categoryDeleting) return;
    this.categoryToDelete = null;
  }

  confirmDeleteCategory(): void {
    const category = this.categoryToDelete;
    if (!category || this.categoryDeleting) return;

    this.categoryDeleting = true;
    this._CategoryServices.deleteCategories(String(category.id)).subscribe({
      next: () => {
        this.categoryDeleting = false;
        this.categoryToDelete = null;
        this.categories = this.categories.filter(c => String(c.id) !== String(category.id));

        if (String(this.form.controls.categoryId.value) === String(category.id)) {
          this.form.controls.categoryId.setValue('');
        }

        this.showToast('success', 'Category deleted.');
      },
      error: (err) => {
        this.categoryDeleting = false;
        this.categoryToDelete = null;
        console.error(err);
        this.showToast('error', err?.error?.message || err?.error?.title || 'Failed to delete category.');
      },
    });
  }

  // ---------- Technical specifications ----------
  loadSpecs(): void {
    this.specsLoading = true;
    this.specsError = '';

    this._TechSpecServices.getTechSpec().subscribe({
      next: (res) => {
        const list: { id: string; name: string }[] = Array.isArray(res)
          ? res
          : (res?.data ?? res?.items ?? []);

        // Keep the selection and typed values when the list is refreshed
        const previous = new Map(this.specs.map(s => [s.id, s]));
        this.specs = list.map(s => ({
          id: s.id,
          name: s.name,
          selected: previous.get(s.id)?.selected ?? false,
          value: previous.get(s.id)?.value ?? '',
        }));
        this.specsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.specsError = 'Failed to load specifications.';
        this.specsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleSpec(spec: SpecRow): void {
    spec.selected = !spec.selected;
    if (spec.selected) {
      this.focusById(`spec-value-${spec.id}`);
    } else {
      spec.value = '';
    }
  }

  // ----- Delete -----
  openDeleteSpec(spec: SpecRow): void {
    this.specToDelete = spec;
  }

  closeDeleteSpec(): void {
    if (this.specDeleting) return;
    this.specToDelete = null;
  }

  confirmDeleteSpec(): void {
    const spec = this.specToDelete;
    if (!spec || this.specDeleting) return;

    this.specDeleting = true;
    this._TechSpecServices.deleteTechSpec(spec.id).subscribe({
      next: () => {
        this.specDeleting = false;
        this.specToDelete = null;
        this.specs = this.specs.filter(s => s.id !== spec.id);
        this.showToast('success', 'Specification deleted.');
      },
      error: (err) => {
        this.specDeleting = false;
        this.specToDelete = null;
        console.error(err);
        this.showToast('error', err?.error?.message || err?.error?.title || 'Failed to delete specification.');
      },
    });
  }

  // ----- Add / rename -----
  openAddSpec(): void {
    this.specModal = { mode: 'add' };
    this.specModalName = '';
    this.specModalError = '';
    this.focusById('spec-modal-input');
  }

  openEditSpec(spec: SpecRow): void {
    this.specModal = { mode: 'edit', id: spec.id };
    this.specModalName = spec.name;
    this.specModalError = '';
    this.focusById('spec-modal-input');
  }

  closeSpecModal(): void {
    if (this.specModalSaving) return;
    this.specModal = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeCategoryDropdown();
    this.closeCategoryModal();
    this.closeDeleteCategory();
    this.closeSpecModal();
    this.closeDeleteSpec();
  }

  saveSpecModal(): void {
    if (!this.specModal || this.specModalSaving) return;

    const modal = this.specModal;
    const name = this.specModalName.trim();

    if (!name) {
      this.specModalError = 'Name is required.';
      return;
    }

    const duplicate = this.specs.some(
      s => s.name.toLowerCase() === name.toLowerCase() && s.id !== modal.id
    );
    if (duplicate) {
      this.specModalError = 'This specification already exists.';
      return;
    }

    const request$ =
      modal.mode === 'add'
        ? this._TechSpecServices.addTechSpec(name)
        : this._TechSpecServices.updateTechSpec(modal.id!, name);

    this.specModalSaving = true;
    this.specModalError = '';

    request$.subscribe({
      next: () => {
        this.specModalSaving = false;
        this.specModal = null;
        this.loadSpecs();
        this.showToast('success', modal.mode === 'add' ? 'Specification added.' : 'Specification updated.');
      },
      error: (err) => {
        this.specModalSaving = false;
        this.specModalError =
          err?.error?.message || err?.error?.title || 'Something went wrong. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  private focusById(id: string): void {
    setTimeout(() => {
      (this.host.nativeElement.querySelector(`[id="${id}"]`) as HTMLElement | null)?.focus();
    });
  }

  // ---------- Description ----------
  get wordCount(): number {
    const text = (this.form.controls.description.value || '').trim();
    return text ? text.split(/\s+/).length : 0;
  }

  applyFormat(type: 'bold' | 'italic' | 'underline' | 'ul' | 'ol' | 'quote' | 'link' | 'image'): void {
    const el = this.descriptionBox.nativeElement;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = el.value;
    const selected = value.substring(start, end);

    let replacement = selected;
    switch (type) {
      case 'bold': replacement = `**${selected || 'text'}**`; break;
      case 'italic': replacement = `*${selected || 'text'}*`; break;
      case 'underline': replacement = `<u>${selected || 'text'}</u>`; break;
      case 'ul': replacement = (selected || 'item').split('\n').map(l => `- ${l}`).join('\n'); break;
      case 'ol': replacement = (selected || 'item').split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n'); break;
      case 'quote': replacement = (selected || 'quote').split('\n').map(l => `> ${l}`).join('\n'); break;
      case 'link': replacement = `[${selected || 'link text'}](https://)`; break;
      case 'image': replacement = `![${selected || 'alt text'}](https://)`; break;
    }

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    this.form.controls.description.setValue(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, start + replacement.length);
    });
  }

  // ---------- Media ----------
  get primaryItem(): MediaItem | undefined {
    return this.media.find(m => m.id === this.primaryId);
  }

  get slots(): number[] {
    const empty = Math.max(0, this.maxAssets - this.media.length);
    return Array.from({ length: Math.min(empty, 2) });
  }

  browse(): void {
    this.fileInput.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) this.addFiles(Array.from(event.dataTransfer.files));
  }

  private addFiles(files: File[]): void {
    this.uploadError = '';
    for (const file of files) {
      if (this.media.length >= this.maxAssets) {
        this.uploadError = `Maximum ${this.maxAssets} images allowed.`;
        break;
      }
      if (!this.allowedTypes.includes(file.type)) {
        this.uploadError = 'Only PNG and JPG files are supported.';
        continue;
      }
      if (file.size > this.maxFileSize) {
        this.uploadError = `"${file.name}" is larger than 15MB.`;
        continue;
      }
      const item: MediaItem = {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      };
      this.media.push(item);
      if (!this.primaryId) this.primaryId = item.id;
    }
  }

  setPrimary(id: string): void {
    this.primaryId = id;
    // Move the primary image to the first position
    const idx = this.media.findIndex(m => m.id === id);
    if (idx > 0) {
      const [item] = this.media.splice(idx, 1);
      this.media.unshift(item);
    }
  }

  removeMedia(id: string): void {
    const item = this.media.find(m => m.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    this.media = this.media.filter(m => m.id !== id);
    if (this.primaryId === id) this.primaryId = this.media[0]?.id ?? null;
  }

  trackById(_: number, item: MediaItem): string {
    return item.id;
  }

  // ---------- Actions ----------
  discard(): void {
    this.media.forEach(m => URL.revokeObjectURL(m.previewUrl));
    this.media = [];
    this.primaryId = null;
    this.uploadError = '';
    this.specs.forEach(s => {
      s.selected = false;
      s.value = '';
    });
    this.form.reset({ name: '', code: '', categoryId: '', description: '' });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isSaving) return;

    const v = this.form.getRawValue();

    // Field names must match what the API expects
    const formData = new FormData();
    formData.append('Name', v.name!.trim());
    formData.append('Code', (v.code || '').trim());
    formData.append('Description', v.description || '');
    formData.append('CategoryId', v.categoryId!);

    // Only specs that are selected AND have a value are sent
    this.specs
      .filter(s => s.selected && s.value.trim())
      .forEach((s, i) => {
        formData.append(`TechnicalSpecificationRequests[${i}].TechnicalSpecificationId`, s.id);
        formData.append(`TechnicalSpecificationRequests[${i}].Value`, s.value.trim());
      });

    // The primary image is always first in the array (setPrimary moves it to the front)
    this.media.forEach(m => formData.append('Images', m.file, m.file.name));

    this.isSaving = true;
    this._ProductServices.addProduct(formData).subscribe({
      next: () => {
        this.isSaving = false;
        this.discard(); // Clear the form, specs and images after success
        this.showToast('success', 'Product added successfully.');
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);
        this.showToast(
          'error',
          err?.error?.message || err?.error?.title || 'Failed to add product. Please try again.'
        );
      },
    });
  }
}
