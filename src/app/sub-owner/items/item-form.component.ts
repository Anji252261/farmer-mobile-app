import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ItemService } from '../../services/item.service';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { finalize } from 'rxjs';
import { PurchaseEntry } from '../../models/item.model';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './item-form.component.html',
  styleUrls: ['./item-form.component.scss']
})
export class ItemFormComponent {
  listeningField: string | null = null;
  @Input() item?: any;
  @Input() showAvailabilityFields = false;
  @Output() save = new EventEmitter<any>();
  @Output() cancelForm = new EventEmitter<void>();
  @Output() showWarehouseDetails = new EventEmitter<any>();
  units = ['kg','liters','pieces','grams','ml','dozen','tons','boxes'];
  warehouseItem: any = null;

  form = this.fb.group({
    name: ['', Validators.required],
    unit: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    image: [''],
    vendor: [''],
    grade: [''],
    purchaseDate: [this.getTodayDate()],
    paid: [false],
    paymentProofImage: [''],
    availableInWarehouse: [false],
    availableQuantity: [0, [Validators.min(0)]]
  });

  ngOnInit() {
    if (this.item) {
      this.patchForm();
    }

    // For edit mode only, keep warehouse info synced with current item name.
    if (this.isEditMode()) {
      this.form.get('name')?.valueChanges.subscribe((name: string | null) => {
        if (name && name.trim().length > 0) {
          this.checkWarehouseAvailability(name);
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item'] && this.item) {
      this.patchForm();
    }
  }

  private patchForm() {
    const firstPurchase = this.item?.purchaseHistory?.[0];
    const buyMoreMode = this.showAvailabilityFields;

    this.form.patchValue({
      name: this.item?.name || '',
      unit: this.item?.unit || '',
      price: buyMoreMode ? null : (this.item?.price ?? 0),
      quantity: this.item?.quantity || 0,
      image: this.item?.image || '',
      vendor: buyMoreMode ? '' : (this.item?.vendor || firstPurchase?.supplierName || ''),
      grade: buyMoreMode ? '' : (firstPurchase?.grade || ''),
      purchaseDate: this.item?.purchaseDate || firstPurchase?.purchaseDate || this.getTodayDate(),
      paid: this.item?.paid || firstPurchase?.paid || false,
      paymentProofImage: this.item?.paymentProofImage || firstPurchase?.paymentProofImage || '',
      availableInWarehouse: this.item?.availableInWarehouse || false,
      availableQuantity: this.item?.availableQuantity || firstPurchase?.availableQuantity || 0
    });
    if (this.item?.image) {
      this.imagePreview = this.item.image;
    }
    if (this.form.get('paymentProofImage')?.value) {
      this.paymentProofPreview = String(this.form.get('paymentProofImage')?.value);
    }

    this.warehouseItem = this.item || null;
  }

  isEditMode(): boolean {
    return !!this.item?.id;
  }

  canViewWarehouseDetails(): boolean {
    if (!this.isEditMode()) {
      return false;
    }

    const qty = this.form.get('quantity')?.value || 0;
    return qty > 0;
  }

  /**
   * start speech recognition for specified field
   */
  startVoice(field: 'name' | 'unit' | 'price' | 'quantity') {
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
    recog.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      if (field === 'price' || field === 'quantity') {
        // try parse number
        const num = parseFloat(text.replace(/[^0-9\.]/g, ''));
        if (!isNaN(num)) {
          this.form.get(field)?.setValue(num);
        }
      } else {
        this.form.get(field)?.setValue(text);
      }
    };
    recog.onerror = () => {
      this.toast.error('Voice recognition failed');
    };
    recog.start();
  }
  loading = false;
  imagePreview: string | null = null;
  paymentProofPreview: string | null = null;


  constructor(
    private fb: FormBuilder,
    private itemSvc: ItemService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  submit() {
    if (this.form.invalid) {
      this.toast.error('Please fill all fields');
      return;
    }
    const { name, unit, price, quantity, image, vendor, grade, purchaseDate, paid, paymentProofImage } = this.form.value;
    if (paid && !paymentProofImage) {
      this.toast.error('Please upload payment proof image');
      return;
    }

    const ownerId = this.auth.currentUserValue?.id || '';
    const boughtQuantity = Number(quantity || 0);
    const previousStock = Number(this.item?.quantity || 0);
    const currentAvailableQty = this.showAvailabilityFields
      ? previousStock + boughtQuantity
      : Number(quantity || 0);
    const entryAvailableQty = this.showAvailabilityFields ? boughtQuantity : currentAvailableQty;
    const primaryEntry = this.buildPrimaryPurchaseEntry({
      vendor: vendor || '',
      grade: grade || '',
      price: Number(price || 0),
      paid: !!paid,
      purchaseDate: purchaseDate || this.getTodayDate(),
      boughtQuantity,
      availableQuantity: entryAvailableQty,
      paymentProofImage: paymentProofImage || undefined
    });

    const existingHistory: PurchaseEntry[] = Array.isArray(this.item?.purchaseHistory)
      ? this.item.purchaseHistory
      : [];

    const purchaseHistory = primaryEntry
      ? this.mergePrimaryEntry(existingHistory, primaryEntry)
      : existingHistory;

    const itemData: any = {
      name: name || '',
      unit: unit || '',
      price: price || 0,
      quantity: currentAvailableQty,
      vendor: vendor || '',
      grade: grade || '',
      purchaseDate: purchaseDate || this.getTodayDate(),
      paid: paid || false,
      paymentProofImage: paymentProofImage || undefined,
      availableInWarehouse: currentAvailableQty > 0,
      availableQuantity: currentAvailableQty,
      purchaseHistory,
      ownerId
    };
    if (image) {
      itemData.image = image;
    }
    if (this.item && this.item.id) {
      itemData.id = this.item.id;
    }
    this.save.emit(itemData);
  }

  cancel() {
    this.cancelForm.emit();
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.form.get('image')?.setValue(result);
        this.imagePreview = result;
      };
      reader.readAsDataURL(file);
    }
  }

  onPaymentProofChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.form.get('paymentProofImage')?.setValue(result);
        this.paymentProofPreview = result;
      };
      reader.readAsDataURL(file);
    }
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private checkWarehouseAvailability(name: string) {
    this.itemSvc.searchByName(name).subscribe((items: any[]) => {
      if (items.length > 0) {
        const foundItem = items.find(i => i.id === this.item?.id) || items[0];
        this.warehouseItem = foundItem;
        // Auto-populate warehouse fields if item has warehouse data
        if (foundItem.availableInWarehouse) {
          this.form.patchValue({
            availableInWarehouse: true,
            availableQuantity: foundItem.availableQuantity || 0
          });
        }
      } else {
        this.warehouseItem = null;
        this.form.patchValue({
          availableInWarehouse: false,
          availableQuantity: 0
        });
      }
    });
  }

  navigateToWarehouseDetails() {
    if (!this.canViewWarehouseDetails()) {
      this.toast.error('Stock not available for this item');
      return;
    }

    const detailsItem = {
      ...(this.item || {}),
      ...this.form.value,
      id: this.item?.id,
      quantity: this.form.get('quantity')?.value || 0,
      grade: this.form.get('grade')?.value || '',
      purchaseHistory: this.item?.purchaseHistory || []
    };

    this.showWarehouseDetails.emit(detailsItem);
  }

  private buildPrimaryPurchaseEntry(input: {
    vendor: string;
    grade: string;
    price: number;
    paid: boolean;
    purchaseDate: string;
    boughtQuantity: number;
    availableQuantity: number;
    paymentProofImage?: string;
  }): PurchaseEntry | null {
    const supplierName = input.vendor.trim();
    if (!supplierName) {
      return null;
    }

    return {
      id: `ph-${Date.now()}`,
      supplierName,
      grade: input.grade,
      boughtQuantity: input.boughtQuantity,
      availableQuantity: input.availableQuantity,
      purchaseRate: input.price,
      paid: input.paid,
      purchaseDate: input.purchaseDate,
      paymentProofImage: input.paymentProofImage
    };
  }

  private mergePrimaryEntry(existing: PurchaseEntry[], primary: PurchaseEntry): PurchaseEntry[] {
    const matchIndex = existing.findIndex(entry =>
      entry.supplierName.toLowerCase() === primary.supplierName.toLowerCase() &&
      entry.purchaseDate === primary.purchaseDate
    );

    if (matchIndex === -1) {
      return [...existing, primary];
    }

    return existing.map((entry, index) => {
      if (index !== matchIndex) {
        return entry;
      }

      return {
        ...entry,
        boughtQuantity: primary.boughtQuantity,
        availableQuantity: primary.availableQuantity,
        purchaseRate: primary.purchaseRate,
        paid: primary.paid,
        paymentProofImage: primary.paymentProofImage
      };
    });
  }
  
}
