import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { SaleService } from '../../services/sale.service';
import { Observable } from 'rxjs';
import { Item } from '../../models/item.model';
import { Sale } from '../../models/sale.model';

@Component({
  selector: 'app-sub-owner-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="owner-details">
      <div class="top-row">
        <div>
          <h1>Sub Owner Details</h1>
          <p>Owner ID: <strong>{{ ownerId }}</strong></p>
        </div>
        <a class="back-link" [routerLink]="['/main-owner']">Back</a>
      </div>

      <div class="grid">
        <article class="panel">
          <h2>Items</h2>
          <ul>
            <li *ngFor="let item of items$ | async">
              <span>{{ item.name }}</span>
              <strong>Rs {{ item.price }}/{{ item.unit }}</strong>
            </li>
          </ul>
        </article>

        <article class="panel">
          <h2>Sales</h2>
          <ul>
            <li *ngFor="let sale of sales$ | async">
              <span>{{ sale.itemId }} x {{ sale.quantity }} {{ sale.unit }}</span>
              <strong>Rs {{ sale.totalPrice }}</strong>
            </li>
          </ul>
        </article>
      </div>
    </section>
  `,
  styleUrls: ['./sub-owner-details.component.scss']
})
export class SubOwnerDetailsComponent implements OnInit {
  ownerId!: string | null;
  items$!: Observable<Item[]>;
  sales$!: Observable<Sale[]>;

  constructor(
    private route: ActivatedRoute,
    private itemSvc: ItemService,
    private saleSvc: SaleService
  ) {}

  ngOnInit(): void {
    this.ownerId = this.route.snapshot.paramMap.get('id');
    if (this.ownerId) {
      this.items$ = this.itemSvc.getByOwner(this.ownerId);
      this.sales$ = this.saleSvc.getByOwner(this.ownerId);
    }
  }
}
