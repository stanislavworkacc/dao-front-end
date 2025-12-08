import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiweOverlayComponent } from './siwe-overlay.component';

describe('SiweOverlayComponent', () => {
  let component: SiweOverlayComponent;
  let fixture: ComponentFixture<SiweOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiweOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiweOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
