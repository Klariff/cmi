import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardExerciseComponent } from './card-exercise.component';

describe('CardExerciseComponent', () => {
  let component: CardExerciseComponent;
  let fixture: ComponentFixture<CardExerciseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardExerciseComponent]
    });
    fixture = TestBed.createComponent(CardExerciseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
