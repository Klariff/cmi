import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordFormDialogComponent } from './password-form-dialog.component';

describe('PasswordFormDialogComponent', () => {
  let component: PasswordFormDialogComponent;
  let fixture: ComponentFixture<PasswordFormDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasswordFormDialogComponent]
    });
    fixture = TestBed.createComponent(PasswordFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
