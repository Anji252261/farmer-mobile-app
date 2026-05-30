import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MainOwnerDashboardComponent } from './main-owner-dashboard.component';
import { UserService } from '../../services/user.service';

describe('MainOwnerDashboardComponent', () => {
  let component: MainOwnerDashboardComponent;
  let fixture: ComponentFixture<MainOwnerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainOwnerDashboardComponent],
      providers: [
        {
          provide: UserService,
          useValue: {
            getByRole: () => of([{ id: '2', name: 'Farmer One', email: 'farmer1@example.com', phone: '9876543210', shopName: 'Farmer One Agro Shop', role: 'SUB_OWNER' }]),
            createSubOwner: () => of({ id: '4', name: 'New Owner', email: 'new@example.com', phone: '9988776655', shopName: 'New Owner Farm', role: 'SUB_OWNER' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainOwnerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
