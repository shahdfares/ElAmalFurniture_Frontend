import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'lib-delete-confirm-dialog',
  standalone: false,                          // ← بدل imports: []
  templateUrl: './delete-confirm-dialog.html',
  styleUrl: './delete-confirm-dialog.css',
})
export class DeleteConfirmDialogComponent {
  @Input() name = '';
  @Input() imageUrl: string | null = null;
  @Input() deleting = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.deleting) this.cancelled.emit();
  }

  onBackdropClick(): void {
    if (!this.deleting) this.cancelled.emit();
  }
}
