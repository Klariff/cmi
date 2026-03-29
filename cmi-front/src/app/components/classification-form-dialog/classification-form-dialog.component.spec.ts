import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassificationFormDialogComponent } from './classification-form-dialog.component';

describe('ClassificationFormDialogComponent', () => {
  let component: ClassificationFormDialogComponent;
  let fixture: ComponentFixture<ClassificationFormDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClassificationFormDialogComponent]
    });
    fixture = TestBed.createComponent(ClassificationFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
