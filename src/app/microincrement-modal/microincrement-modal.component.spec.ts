import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MicroincrementModalComponent } from './microincrement-modal.component';

describe('MicroincrementModalComponent', () => {
  let component: MicroincrementModalComponent;
  let fixture: ComponentFixture<MicroincrementModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MicroincrementModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MicroincrementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
