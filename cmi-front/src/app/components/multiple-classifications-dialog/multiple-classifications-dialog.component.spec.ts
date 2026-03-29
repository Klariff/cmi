import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleClassificationsDialogComponent } from './multiple-classifications-dialog.component';

describe('MultipleClassificationsDialogComponent', () => {
  let component: MultipleClassificationsDialogComponent;
  let fixture: ComponentFixture<MultipleClassificationsDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MultipleClassificationsDialogComponent]
    });
    fixture = TestBed.createComponent(MultipleClassificationsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
