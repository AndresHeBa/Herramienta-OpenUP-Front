import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MicroincrementListComponent } from './microincrement-list.component';

describe('MicroincrementListComponent', () => {
  let component: MicroincrementListComponent;
  let fixture: ComponentFixture<MicroincrementListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MicroincrementListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MicroincrementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
