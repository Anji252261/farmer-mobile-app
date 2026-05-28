import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerListComponent } from './customer-list.component';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { of } from 'rxjs';

describe('CustomerListComponent', () => {
  let component: CustomerListComponent;
  let fixture: ComponentFixture<CustomerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        {
          provide: CustomerService,
          useValue: {
            getByOwner: () => of([]),
            create: () => of(null),
            delete: () => of(null)
          }
        },
        {
          provide: AuthService,
          useValue: {
            currentUserValue: { id: '2' }
          }
        },
        {
          provide: ToastService,
          useValue: {
            success: () => {},
            error: () => {}
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
