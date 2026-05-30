import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemService } from '../../services/item.service';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Item } from '../../models/item.model';
import { AuthService } from '../../core/auth.service';
import { ItemModalComponent } from './item-modal.component';
import { WarehouseDetailsComponent } from './warehouse-details.component';
import { ToastService } from '../../shared/services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemModalComponent, WarehouseDetailsComponent],
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {
  items$!: Observable<Item[]>;
  filteredItems$!: Observable<Item[]>;
  filter = '';
  filter$ = new BehaviorSubject<string>('');
  showModal = false;
  showAvailabilityFieldsInForm = false;
  currentItem: any = null;
  listening = false;
  showWarehouseDetails = false;
  selectedItemForWarehouse: any = null;

  constructor(
    private itemSvc: ItemService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  private loadItems() {
    const ownerId = this.auth.currentUserValue?.id || '';
    this.items$ = this.itemSvc.getByOwner(ownerId);
    this.filteredItems$ = combineLatest([this.items$, this.filter$]).pipe(
      map(([items, filter]) =>
        items.filter(i =>
          i.name.toLowerCase().includes(filter.toLowerCase())
        )
      )
    );
  }

  add() {
    this.currentItem = null;
    this.showAvailabilityFieldsInForm = false;
    this.showModal = true;
  }

  edit(item: Item) {
    // clone to avoid two-way binding before save
    this.currentItem = { ...item };
    this.showAvailabilityFieldsInForm = false;
    this.showModal = true;
  }

  buyMore(item: Item) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;

    // Open form for adding a new purchase entry for existing item.
    this.currentItem = {
      ...item,
      quantity: 0,
      vendor: '',
      purchaseDate: todayDate,
      paid: false,
      availableQuantity: item.quantity || 0
    };
    this.showAvailabilityFieldsInForm = true;
    this.showModal = true;
  }

  save(item: any) {
    if (item.id) {
      this.itemSvc.update(item).subscribe(() => {
        this.loadItems();
        this.toast.success('Item updated');
      });
    } else {
      this.itemSvc.create(item).subscribe(() => {
        this.loadItems();
        this.toast.success('Item created');
      });
    }
    this.closeModal();
  }

  delete(item: Item) {
    if (confirm('Delete this item?')) {
      this.itemSvc.delete(item.id).subscribe(() => {
        this.loadItems();
        this.toast.success('Item deleted');
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.showAvailabilityFieldsInForm = false;
  }

  showWarehouseInfo(item: Item) {
    if ((item?.quantity || 0) <= 0) {
      this.toast.error('No stock available');
      return;
    }

    this.showModal = false;
    this.selectedItemForWarehouse = item;
    this.showWarehouseDetails = true;
  }

  closeWarehouseDetails() {
    this.showWarehouseDetails = false;
    this.selectedItemForWarehouse = null;
  }

  startVoice(field: 'search') {
    const { webkitSpeechRecognition, SpeechRecognition } = window as any;
    const Recon = SpeechRecognition || webkitSpeechRecognition;
    if (!Recon) {
      this.toast.error('Speech recognition not supported');
      return;
    }
    const recog = new Recon();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    this.listening = true;
    recog.onresult = (event: any) => {
      const text = event.results[0][0].transcript || '';
      this.filter = text;
      this.filter$.next(text);
      this.listening = false;
    };
    recog.onerror = () => {
      this.listening = false;
      this.toast.error('Voice recognition failed');
    };
    recog.onend = () => {
      this.listening = false;
    };
    try {
      recog.start();
    } catch (e) {
      this.listening = false;
    }
  }
}

