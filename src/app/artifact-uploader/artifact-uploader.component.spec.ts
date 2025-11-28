import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtifactUploaderComponent } from './artifact-uploader.component';

describe('ArtifactUploaderComponent', () => {
  let component: ArtifactUploaderComponent;
  let fixture: ComponentFixture<ArtifactUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtifactUploaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtifactUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
