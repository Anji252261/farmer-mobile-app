import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SubOwnerDashboardComponent } from './sub-owner-dashboard.component';
import { AuthService } from '../../core/auth.service';
import { ItemService } from '../../services/item.service';
import { CustomerService } from '../../services/customer.service';
import { SaleService } from '../../services/sale.service';

describe('SubOwnerDashboardComponent', () => {
  let component: SubOwnerDashboardComponent;
  let fixture: ComponentFixture<SubOwnerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubOwnerDashboardComponent],
      providers: [
        { provide: AuthService, useValue: { currentUserValue: { id: '2' } } },
        { provide: ItemService, useValue: { getByOwner: () => of([]) } },
        { provide: CustomerService, useValue: { getByOwner: () => of([]) } },
        { provide: SaleService, useValue: { getByOwner: () => of([]) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubOwnerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
