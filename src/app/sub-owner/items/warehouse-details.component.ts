import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Item, PurchaseEntry } from '../../models/item.model';

@Component({
  selector: 'app-warehouse-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './warehouse-details.component.html',
  styleUrls: ['./warehouse-details.component.scss']
})
export class WarehouseDetailsComponent {
  @Input() item?: Item;
  @Output() close = new EventEmitter<void>();

  getValue(field: keyof Item): Item[keyof Item] | '-' {
    if (!this.item) {
      return '-';
    }

    const value = this.item[field];
    return value ?? '-';
  }

  isInStock(): boolean {
    return (this.item?.quantity || 0) > 0;
  }

  getQuantity(): number {
    return this.item?.quantity || 0;
  }

  getPurchaseHistory(): PurchaseEntry[] {
    const history = this.item?.purchaseHistory;
    if (Array.isArray(history) && history.length > 0) {
      return history;
    }

    if (!this.item?.vendor) {
      return [];
    }

    return [{
      id: `ph-fallback-${this.item.id}`,
      supplierName: this.item.vendor,
      boughtQuantity: Number(this.item.quantity || 0),
      availableQuantity: Number(this.item.availableQuantity ?? this.item.quantity ?? 0),
      purchaseRate: Number(this.item.price || 0),
      paid: !!this.item.paid,
      purchaseDate: this.item.purchaseDate || '',
      paymentProofImage: this.item.paymentProofImage
    }];
  }

  getTotalBoughtQuantity(): number {
    return this.getPurchaseHistory().reduce((sum, row) => sum + Number(row.boughtQuantity || 0), 0);
  }

  getTotalAvailableQuantity(): number {
    return this.getPurchaseHistory().reduce((sum, row) => sum + Number(row.availableQuantity || 0), 0);
  }

  getUnpaidPurchaseCount(): number {
    return this.getPurchaseHistory().filter(row => !row.paid).length;
  }

  trackByPurchaseId(index: number, row: PurchaseEntry): string {
    return row.id || `${row.supplierName}-${row.purchaseDate}-${index}`;
  }

  closeModal() {
    this.close.emit();
  }
}
