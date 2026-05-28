import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemFormComponent } from './item-form.component';

@Component({
  selector: 'app-item-modal',
  standalone: true,
  imports: [CommonModule, ItemFormComponent],
  templateUrl: './item-modal.component.html',
  styleUrls: ['./item-modal.component.scss']
})
export class ItemModalComponent {
  @Input() item: any;
  @Input() showAvailabilityFields = false;
  @Output() save = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() viewWarehouseDetails = new EventEmitter<any>();

  onSave(item: any) {
    this.save.emit(item);
  }
  
  onViewWarehouseDetails(item: any) {
    this.viewWarehouseDetails.emit(item);
  }

  close() {
    this.closeModal.emit();
  }
}
