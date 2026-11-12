import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteConfirmDialog } from './delete-confirm-dialog';

describe('DeleteConfirmDialog', () => {
  let component: DeleteConfirmDialog;
  let fixture: ComponentFixture<DeleteConfirmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
