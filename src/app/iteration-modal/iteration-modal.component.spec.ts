import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IterationModalComponent } from './iteration-modal.component';

describe('IterationModalComponent', () => {
  let component: IterationModalComponent;
  let fixture: ComponentFixture<IterationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IterationModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IterationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
