import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProposalDetailsPageComponent } from './proposal-details-page.component';

describe('ProposalDetailsPageComponent', () => {
  let component: ProposalDetailsPageComponent;
  let fixture: ComponentFixture<ProposalDetailsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProposalDetailsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProposalDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
