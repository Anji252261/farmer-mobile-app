import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SalesFormComponent } from './sales-form.component';
import { ItemService } from '../../services/item.service';
import { SaleService } from '../../services/sale.service';
import { ToastService } from '../../shared/services/toast.service';
import { CustomerService } from '../../services/customer.service';

describe('SalesFormComponent', () => {
  let component: SalesFormComponent;
  let fixture: ComponentFixture<SalesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesFormComponent, ReactiveFormsModule],
      providers: [
        {
          provide: ItemService,
          useValue: {
            getByOwner: () => of([])
          }
        },
        {
          provide: SaleService,
          useValue: {
            getByOwner: () => of([]),
            createBulk: () => of([])
          }
        },
        {
          provide: CustomerService,
          useValue: {
            getAll: () => of([])
          }
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true)
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

    fixture = TestBed.createComponent(SalesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
