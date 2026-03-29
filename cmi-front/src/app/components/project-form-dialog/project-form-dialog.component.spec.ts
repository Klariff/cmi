import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectFormDialogComponent } from './project-form-dialog.component';

describe('ProjectFormDialogComponent', () => {
  let component: ProjectFormDialogComponent;
  let fixture: ComponentFixture<ProjectFormDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectFormDialogComponent]
    });
    fixture = TestBed.createComponent(ProjectFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
