import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletAccountsModalComponent } from './wallet-accounts-modal.component';

describe('WalletAccountsModalComponent', () => {
  let component: WalletAccountsModalComponent;
  let fixture: ComponentFixture<WalletAccountsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalletAccountsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WalletAccountsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
