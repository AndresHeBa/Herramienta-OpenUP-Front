import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentanaCreacionComponent } from './ventana-creacion.component';

describe('VentanaCreacionComponent', () => {
  let component: VentanaCreacionComponent;
  let fixture: ComponentFixture<VentanaCreacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentanaCreacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentanaCreacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
