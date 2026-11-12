import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeleteConfirmDialogComponent } from '../delete-confirm-dialog/delete-confirm-dialog';



@NgModule({
  declarations: [DeleteConfirmDialogComponent],
  imports: [CommonModule],
  exports: [DeleteConfirmDialogComponent],
})
export class SharedUiModule {}
