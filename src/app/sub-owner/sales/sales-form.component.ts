import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { SaleService } from '../../services/sale.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { Item } from '../../models/item.model';
import { finalize, forkJoin } from 'rxjs';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { Sale } from '../../models/sale.model';

interface UnitOption {
  value: string;
  label: string;
  factorToCanonical: number;
}

interface QuickOption {
  label: string;
  value: number;
}

interface CustomerSummary {
  itemTypes: number;
  totalOrders: number;
  totalQuantity: number;
  totalCost: number;
  lastPurchaseDate: string | null;
}

interface ReceiptLine {
  itemName: string;
  quantity: number;
  unit: string;
  totalPrice: number;
}

interface CurrentReceipt {
  customerName: string;
  saleDate: string;
  lines: ReceiptLine[];
  grandTotal: number;
}

interface CalendarDay {
  isoDate: string;
  label: number;
  inCurrentMonth: boolean;
}

type UnitKind = 'mass' | 'volume' | 'count' | 'unknown';

const MASS_UNITS: UnitOption[] = [
  { value: 'kg', label: 'Kilogram (kg)', factorToCanonical: 1 },
  { value: 'half-kg', label: 'Half Kilogram', factorToCanonical: 0.5 },
  { value: 'g', label: 'Gram (g)', factorToCanonical: 0.001 },
  { value: 'mg', label: 'Milligram (mg)', factorToCanonical: 0.000001 }
];

const VOLUME_UNITS: UnitOption[] = [
  { value: 'liter', label: 'Liter (L)', factorToCanonical: 1 },
  { value: 'half-liter', label: 'Half Liter', factorToCanonical: 0.5 },
  { value: 'ml', label: 'Milliliter (ml)', factorToCanonical: 0.001 }
];

const COUNT_UNITS: UnitOption[] = [{ value: 'piece', label: 'Piece', factorToCanonical: 1 }];

@Component({
  selector: 'app-sales-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sales-form.component.html',
  styleUrls: ['./sales-form.component.scss']
})
export class SalesFormComponent implements OnInit {
  form = this.fb.group({
    customerId: ['', Validators.required],
    lines: this.fb.array<FormGroup>([])
  });
  items: Item[] = [];
  customers: Customer[] = [];
  salesHistory: Sale[] = [];
  customerSummary: CustomerSummary | null = null;
  dateFilter = '';
  isDatePickerOpen = false;
  datePickerAbove = false;
  calendarMonth = new Date();
  calendarDays: CalendarDay[] = [];
  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  selectedDateSalesForCustomer: Sale[] = [];
  lastWeekSalesForCustomer: Sale[] = [];
  currentReceipt: CurrentReceipt | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private itemSvc: ItemService,
    private saleSvc: SaleService,
    private customerSvc: CustomerService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  get lines(): FormArray<FormGroup> {
    return this.form.get('lines') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    const ownerId = this.auth.currentUserValue?.id || '';
    this.dateFilter = this.toDateInput(new Date());
    this.syncCalendarWithFilter();
    this.buildCalendarDays();
    this.itemSvc.getByOwner(ownerId).subscribe(items => {
      this.items = items;
      if (!this.lines.length) {
        this.addLine();
      }
    });

    // this.customerSvc.getByOwner(ownerId).subscribe(customers => {
    //   this.customers = customers;
    // });

    this.saleSvc.getByOwner(ownerId).subscribe(sales => {
      this.salesHistory = sales;
      this.updateCustomerSummary(String(this.form.get('customerId')?.value || ''));
    });

    this.form.get('customerId')?.valueChanges.subscribe(customerId => {
      this.updateCustomerSummary(String(customerId || ''));
      this.updateLastWeekSales(String(customerId || ''));
      this.updateSelectedDateSales(String(customerId || ''));
    });
  }

  onDateFilterChange(date: string) {
    this.dateFilter = date;
    this.syncCalendarWithFilter();
    this.buildCalendarDays();
    this.updateSelectedDateSales(String(this.form.get('customerId')?.value || ''));
  }

  toggleDatePicker(event?: Event) {
    this.isDatePickerOpen = !this.isDatePickerOpen;

    if (!this.isDatePickerOpen) {
      return;
    }

    const trigger = event?.currentTarget as HTMLElement | null;
    if (!trigger) {
      this.datePickerAbove = true;
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedCalendarHeight = 360;

    this.datePickerAbove = spaceBelow < estimatedCalendarHeight && spaceAbove > spaceBelow;
  }

  closeDatePicker() {
    this.isDatePickerOpen = false;
  }

  prevCalendarMonth() {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() - 1, 1);
    this.buildCalendarDays();
  }

  nextCalendarMonth() {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1, 1);
    this.buildCalendarDays();
  }

  getCalendarMonthLabel(): string {
    return this.calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  selectCalendarDate(isoDate: string) {
    this.onDateFilterChange(isoDate);
    this.isDatePickerOpen = false;
  }

  isSelectedCalendarDate(isoDate: string): boolean {
    return this.dateFilter === isoDate;
  }

  private syncCalendarWithFilter() {
    const parsed = this.parseIsoDate(this.dateFilter);
    if (parsed) {
      this.calendarMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
  }

  private buildCalendarDays() {
    const year = this.calendarMonth.getFullYear();
    const month = this.calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const firstGridDate = new Date(year, month, 1 - startWeekDay);

    this.calendarDays = Array.from({ length: 42 }).map((_, i) => {
      const dt = new Date(firstGridDate);
      dt.setDate(firstGridDate.getDate() + i);
      return {
        isoDate: this.toDateInput(dt),
        label: dt.getDate(),
        inCurrentMonth: dt.getMonth() === month
      };
    });
  }

  private parseIsoDate(iso: string): Date | null {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return null;
    }
    const parsed = new Date(`${iso}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  printSummary() {
    window.print();
  }

  get selectedCustomerName(): string {
    const customerId = String(this.form.get('customerId')?.value || '');
    if (!customerId) {
      return '';
    }
    // return this.customers.find(customer => customer.id === customerId)?.name || '';
    return '';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) {
      return '--';
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  addLine() {
    this.lines.push(
      this.fb.group({
        itemId: ['', Validators.required],
        calcMode: ['quantity'],
        unit: [''],
        rate: [0],
        quantity: [1],
        mixedInput: [''],
        amount: [10],
        computedQuantity: [0],
        lineTotal: [0]
      })
    );
  }

  removeLine(index: number) {
    if (this.lines.length === 1) {
      return;
    }
    this.lines.removeAt(index);
  }

  onItemChange(index: number) {
    const line = this.lines.at(index);
    const item = this.getItemById(line.get('itemId')?.value || '');
    if (!item) {
      line.patchValue({ unit: '', computedQuantity: 0, lineTotal: 0 }, { emitEvent: false });
      return;
    }

    const options = this.getUnitOptions(item);
    const defaultUnit = options[0]?.value || item.unit;
    const defaultRate = this.getDefaultRateForUnit(item, defaultUnit);
    const isMass = this.getUnitKind(defaultUnit) === 'mass';
    line.patchValue(
      {
        unit: defaultUnit,
        rate: defaultRate,
        quantity: isMass ? 0 : 1,
        mixedInput: '',
        amount: defaultRate || item.price || 10
      },
      { emitEvent: false }
    );
    this.recalculateLine(index);
  }

  onModeChange(index: number) {
    const line = this.lines.at(index);
    const item = this.getItemById(line.get('itemId')?.value || '');
    if (item && !line.get('unit')?.value) {
      const options = this.getUnitOptions(item);
      line.patchValue({ unit: options[0]?.value || item.unit }, { emitEvent: false });
    }
    this.recalculateLine(index);
  }

  onQuantityChange(index: number) {
    this.recalculateLine(index);
  }

  onAmountChange(index: number) {
    this.recalculateLine(index);
  }

  onRateChange(index: number) {
    this.recalculateLine(index);
  }

  onUnitChange(index: number) {
    const line = this.lines.at(index);
    const item = this.getItemById(String(line.get('itemId')?.value || ''));
    if (item) {
      const selectedUnit = String(line.get('unit')?.value || item.unit);
      line.patchValue({ rate: this.getDefaultRateForUnit(item, selectedUnit) }, { emitEvent: false });
    }

    const mixedInput = String(line.get('mixedInput')?.value || '').trim();
    if (mixedInput) {
      this.onMixedInputChange(index);
      return;
    }
    this.recalculateLine(index);
  }

  onMixedInputChange(index: number) {
    const line = this.lines.at(index);
    const mixedInput = String(line.get('mixedInput')?.value || '').trim();
    if (!mixedInput) {
      this.recalculateLine(index);
      return;
    }

    const selectedUnit = String(line.get('unit')?.value || 'kg');
    const selectedFactor = this.getUnitFactor(selectedUnit);
    const quantityInKg = this.parseMixedMassToKg(mixedInput);

    if (quantityInKg === null || selectedFactor <= 0) {
      return;
    }

    const quantityInSelectedUnit = quantityInKg / selectedFactor;
    line.patchValue(
      {
        calcMode: 'quantity',
        quantity: this.roundTo(quantityInSelectedUnit, 4)
      },
      { emitEvent: false }
    );
    this.recalculateLine(index);
  }

  getQuickQuantityOptions(index: number): QuickOption[] {
    const line = this.lines.at(index);
    const unit = this.normalizeUnit(String(line.get('unit')?.value || ''));

    if (unit === 'g' || unit === 'gram') {
      return [10, 50, 100, 200, 230].map(value => ({ label: `${value} g`, value }));
    }

    if (unit === 'mg') {
      return [100, 500, 1000, 5000].map(value => ({ label: `${value} mg`, value }));
    }

    if (unit === 'kg') {
      return [0.25, 0.5, 1, 2].map(value => ({ label: `${value} kg`, value }));
    }

    if (unit === 'half-kg') {
      return [1, 2, 3, 4].map(value => ({ label: `${value} x half kg`, value }));
    }

    if (unit === 'piece' || unit === 'pieces' || unit === 'pc') {
      return [1, 2, 3].map(value => ({ label: `${value} piece`, value }));
    }

    if (unit === 'liter' || unit === 'litre' || unit === 'l') {
      return [0.5, 1, 2, 5].map(value => ({ label: `${value} L`, value }));
    }

    if (unit === 'ml') {
      return [100, 250, 500, 1000].map(value => ({ label: `${value} ml`, value }));
    }

    return [1, 2, 5].map(value => ({ label: `${value} unit`, value }));
  }

  getSelectedUnitLabel(index: number): string {
    const line = this.lines.at(index);
    const unit = String(line.get('unit')?.value || '').trim();
    return unit || 'unit';
  }

  getQuickAmountOptions(): QuickOption[] {
    return [10, 15, 16, 20, 50].map(value => ({ label: `Rs ${value}`, value }));
  }

  setQuickQuantity(index: number, value: number) {
    const line = this.lines.at(index);
    line.patchValue({ calcMode: 'quantity', quantity: value, mixedInput: '' }, { emitEvent: false });
    this.recalculateLine(index);
  }

  setQuickAmount(index: number, value: number) {
    const line = this.lines.at(index);
    line.patchValue({ calcMode: 'amount', amount: value, mixedInput: '' }, { emitEvent: false });
    this.recalculateLine(index);
  }

  setMixedExample(index: number, value: string) {
    const line = this.lines.at(index);
    line.patchValue({ mixedInput: value }, { emitEvent: false });
    this.onMixedInputChange(index);
  }

  isMassLine(index: number): boolean {
    const line = this.lines.at(index);
    const unit = String(line.get('unit')?.value || '');
    const item = this.getItemById(String(line.get('itemId')?.value || ''));
    const referenceUnit = unit || item?.unit || '';
    return this.getUnitKind(referenceUnit) === 'mass';
  }

  getMixedMassExamples(): string[] {
    return ['1kg 50 gram', '1kg 20grm', '50grma', '50milgrma', '200g'];
  }

  recalculateLine(index: number) {
    const line = this.lines.at(index);
    const item = this.getItemById(line.get('itemId')?.value || '');
    if (!item) {
      line.patchValue({ computedQuantity: 0, lineTotal: 0 }, { emitEvent: false });
      return;
    }

    const selectedUnit = String(line.get('unit')?.value || item.unit);
    const selectedFactor = this.getUnitFactor(selectedUnit);
    const effectiveRate = this.getEffectiveRate(index, item, selectedUnit);

    let computedQuantity = 0;
    let lineTotal = 0;
    const calcMode = String(line.get('calcMode')?.value || 'quantity');

    if (calcMode === 'amount') {
      const amount = this.toNumber(line.get('amount')?.value);
      lineTotal = amount;
      computedQuantity = effectiveRate > 0 ? amount / effectiveRate : 0;
    } else {
      const mixedInput = String(line.get('mixedInput')?.value || '').trim();
      if (mixedInput && this.getUnitKind(selectedUnit) === 'mass') {
        const mixedInKg = this.parseMixedMassToKg(mixedInput);
        if (mixedInKg !== null && selectedFactor > 0) {
          computedQuantity = mixedInKg / selectedFactor;
          line.patchValue({ quantity: this.roundTo(computedQuantity, 4) }, { emitEvent: false });
        } else {
          computedQuantity = this.toNumber(line.get('quantity')?.value);
        }
      } else {
        computedQuantity = this.toNumber(line.get('quantity')?.value);
      }
      lineTotal = computedQuantity * effectiveRate;
    }

    line.patchValue(
      {
        computedQuantity: this.roundTo(computedQuantity, 6),
        lineTotal: this.roundTo(lineTotal, 4)
      },
      { emitEvent: false }
    );
  }

  getUnitOptionsForLine(index: number): UnitOption[] {
    const line = this.lines.at(index);
    const item = this.getItemById(line.get('itemId')?.value || '');
    return item ? this.getUnitOptions(item) : [];
  }

  getGrandTotal(): number {
    return this.lines.controls.reduce((sum, control) => {
      return sum + this.toNumber(control.get('lineTotal')?.value);
    }, 0);
  }

  private updateCustomerSummary(customerId: string) {
    if (!customerId) {
      this.customerSummary = null;
      return;
    }

    const customerSales = this.salesHistory.filter(sale => sale.customerId === customerId);
    if (!customerSales.length) {
      this.customerSummary = {
        itemTypes: 0,
        totalOrders: 0,
        totalQuantity: 0,
        totalCost: 0,
        lastPurchaseDate: null
      };
      return;
    }

    const uniqueItemIds = new Set(customerSales.map(sale => sale.itemId));
    const totalOrders = customerSales.length;
    const totalQuantity = customerSales.reduce((sum, sale) => sum + this.toNumber(sale.quantity), 0);
    const totalCost = customerSales.reduce((sum, sale) => sum + this.toNumber(sale.totalPrice), 0);
    const lastPurchase = customerSales
      .map(sale => sale.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

    this.customerSummary = {
      itemTypes: uniqueItemIds.size,
      totalOrders,
      totalQuantity: this.roundTo(totalQuantity, 3),
      totalCost: this.roundTo(totalCost, 2),
      lastPurchaseDate: lastPurchase
    };

    this.updateLastWeekSales(customerId);
    this.updateSelectedDateSales(customerId);
  }

  private updateSelectedDateSales(customerId: string) {
    if (!customerId || !this.dateFilter) {
      this.selectedDateSalesForCustomer = [];
      return;
    }

    this.selectedDateSalesForCustomer = this.salesHistory.filter(sale => {
      return sale.customerId === customerId && this.toDateInput(sale.date) === this.dateFilter;
    });
  }

  private updateLastWeekSales(customerId: string) {
    if (!customerId) {
      this.lastWeekSalesForCustomer = [];
      return;
    }

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    this.lastWeekSalesForCustomer = this.salesHistory.filter(sale => {
      const saleDate = new Date(sale.date);
      if (Number.isNaN(saleDate.getTime())) {
        return false;
      }
      return sale.customerId === customerId && saleDate >= weekAgo && saleDate <= now;
    });
  }

  private toDateInput(date: string | Date): string {
    const dt = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(dt.getTime())) {
      return '';
    }
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getLastWeekTotalCost(): number {
    return this.lastWeekSalesForCustomer.reduce((sum, sale) => sum + this.toNumber(sale.totalPrice), 0);
  }

  getLastWeekTotalQty(): number {
    return this.lastWeekSalesForCustomer.reduce((sum, sale) => sum + this.toNumber(sale.quantity), 0);
  }

  getSelectedDateTotalCost(): number {
    return this.selectedDateSalesForCustomer.reduce((sum, sale) => sum + this.toNumber(sale.totalPrice), 0);
  }

  getSelectedDateTotalQty(): number {
    return this.selectedDateSalesForCustomer.reduce((sum, sale) => sum + this.toNumber(sale.quantity), 0);
  }

  getItemName(itemId: string): string {
    return this.getItemById(itemId)?.name || 'Item';
  }

  private getItemById(itemId: string): Item | undefined {
    return this.items.find(item => item.id === itemId);
  }

  private getCustomerNameById(customerId: string): string {
    // return this.customers.find(customer => customer.id === customerId)?.name || 'Customer';
    return '';
  }

  private getUnitOptions(item: Item): UnitOption[] {
    const kind = this.getUnitKind(item.unit);
    if (kind === 'mass') {
      return MASS_UNITS;
    }
    if (kind === 'volume') {
      return VOLUME_UNITS;
    }
    if (kind === 'count') {
      return COUNT_UNITS;
    }
    return [{ value: item.unit, label: item.unit, factorToCanonical: 1 }];
  }

  private getDefaultRateForUnit(item: Item, unit: string): number {
    const itemFactor = this.getUnitFactor(item.unit);
    const selectedFactor = this.getUnitFactor(unit);
    const pricePerCanonical = itemFactor > 0 ? item.price / itemFactor : item.price;
    return this.roundTo(pricePerCanonical * selectedFactor, 4);
  }

  private getEffectiveRate(index: number, item: Item, selectedUnit: string): number {
    const line = this.lines.at(index);
    const enteredRate = this.toNumber(line.get('rate')?.value);
    if (enteredRate > 0) {
      return enteredRate;
    }

    const defaultRate = this.getDefaultRateForUnit(item, selectedUnit);
    line.patchValue({ rate: defaultRate }, { emitEvent: false });
    return defaultRate;
  }

  private getUnitKind(unit: string): UnitKind {
    const normalized = this.normalizeUnit(unit);
    if (['kg', 'half-kg', 'g', 'mg', 'gram', 'kilogram'].includes(normalized)) {
      return 'mass';
    }
    if (['liter', 'litre', 'l', 'ml', 'half-liter', 'half-litre'].includes(normalized)) {
      return 'volume';
    }
    if (['piece', 'pieces', 'pc'].includes(normalized)) {
      return 'count';
    }
    return 'unknown';
  }

  private getUnitFactor(unit: string): number {
    const normalized = this.normalizeUnit(unit);
    const factorMap: Record<string, number> = {
      kg: 1,
      'half-kg': 0.5,
      g: 0.001,
      gram: 0.001,
      mg: 0.000001,
      liter: 1,
      litre: 1,
      l: 1,
      'half-liter': 0.5,
      'half-litre': 0.5,
      ml: 0.001,
      piece: 1,
      pieces: 1,
      pc: 1
    };
    return factorMap[normalized] || 1;
  }

  private normalizeUnit(unit: string): string {
    return String(unit || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  private parseMixedMassToKg(input: string): number | null {
    const text = String(input || '')
      .toLowerCase()
      .replace(/,/g, ' ')
      // Support joined tokens like "1kg50g" by splitting alpha-number boundaries.
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) {
      return null;
    }

    const tokenRegex = /(\d+(?:\.\d+)?)\s*(kilogram|kilo|kg|grams|gram|grms|grm|grma|grama|gms|gm\.?|gr|g|milligram|milligrm|milligrma|miligram|milgram|milgrm|milgrma|mg)\b/g;
    let match: RegExpExecArray | null;
    let totalKg = 0;
    let found = false;

    while ((match = tokenRegex.exec(text)) !== null) {
      found = true;
      const value = Number(match[1]);
      const unitToken = match[2];
      if (!Number.isFinite(value) || value <= 0) {
        continue;
      }

      if (['kg', 'kilogram', 'kilo'].includes(unitToken)) {
        totalKg += value;
      } else if (['g', 'gr', 'gram', 'grams', 'grms', 'grm', 'grma', 'grama', 'gm', 'gm.', 'gms'].includes(unitToken)) {
        totalKg += value / 1000;
      } else if (
        ['mg', 'milligram', 'milligrm', 'milligrma', 'miligram', 'milgram', 'milgrm', 'milgrma'].includes(unitToken)
      ) {
        totalKg += value / 1000000;
      }
    }

    if (!found || totalKg <= 0) {
      return null;
    }
    return totalKg;
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private roundTo(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  submit() {
    if (this.form.invalid || !this.lines.length) {
      this.toast.error('Please select customer, item, and quantity/amount');
      return;
    }

    const ownerId = this.auth.currentUserValue?.id || '';
    const customerId = String(this.form.get('customerId')?.value || '');
    const customerName = this.getCustomerNameById(customerId);

    const payloads = this.lines.controls.map(control => {
      const itemId = String(control.get('itemId')?.value || '');
      const unit = String(control.get('unit')?.value || '');
      const quantity = this.toNumber(control.get('computedQuantity')?.value);
      const totalPrice = this.toNumber(control.get('lineTotal')?.value);

      return {
        itemId,
        ownerId,
        customerId,
        customerName,
        quantity,
        unit,
        totalPrice,
        date: new Date().toISOString()
      };
    });

    const validPayloads = payloads.filter(line => line.itemId && line.unit && line.quantity > 0 && line.totalPrice > 0);
    if (!validPayloads.length) {
      this.toast.error('Add at least one valid item line to record sale');
      return;
    }

    if (validPayloads.length < payloads.length) {
      this.toast.error('Some incomplete lines were skipped');
    }

    this.loading = true;
    forkJoin(validPayloads.map(payload => this.saleSvc.create(payload)))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
      next: (createdSales) => {
        this.salesHistory = [...this.salesHistory, ...createdSales];
        this.updateCustomerSummary(customerId);

        this.currentReceipt = {
          customerName,
          saleDate: this.toDateInput(new Date()),
          lines: validPayloads.map(line => ({
            itemName: this.getItemName(line.itemId),
            quantity: line.quantity,
            unit: line.unit,
            totalPrice: line.totalPrice
          })),
          grandTotal: validPayloads.reduce((sum, line) => sum + line.totalPrice, 0)
        };

        this.toast.success('Sale recorded successfully');
      },
      error: (err) => {
        this.toast.error('Failed to record sale');
        console.error(err);
      }
    });
  }

  cancel() {
    this.router.navigate(['/sub-owner/items']);
  }
}
