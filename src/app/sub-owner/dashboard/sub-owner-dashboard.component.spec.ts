import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SubOwnerDashboardComponent } from './sub-owner-dashboard.component';
import { DashboardService } from '../../services/dashboard.service';

describe('SubOwnerDashboardComponent', () => {
  let component: SubOwnerDashboardComponent;
  let fixture: ComponentFixture<SubOwnerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubOwnerDashboardComponent],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getMetrics: () =>
              of({
                totalItems: 0,
                totalCustomers: 0,
                totalOrders: 0,
                todaySaleAmount: 0,
                last7DaysSaleAmount: 0,
                topSellingItem: 'No sales yet',
                lowStockItems: []
              })
          }
        }
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
