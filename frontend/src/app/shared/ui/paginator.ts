import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  template: `
    <div class="flex items-center justify-between gap-4 px-4 py-3 text-sm text-slate-600">
      <span>
        {{ total() === 0 ? 0 : from() }}–{{ to() }} de {{ total() }}
      </span>
      <div class="flex items-center gap-1">
        <button
          class="btn-ghost btn-icon rounded-lg disabled:opacity-40"
          [disabled]="page() <= 1"
          (click)="go(page() - 1)"
        >
          <span class="material-icons text-[20px]">chevron_left</span>
        </button>
        <span class="px-2 font-medium">{{ page() }} / {{ totalPages() }}</span>
        <button
          class="btn-ghost btn-icon rounded-lg disabled:opacity-40"
          [disabled]="page() >= totalPages()"
          (click)="go(page() + 1)"
        >
          <span class="material-icons text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  `,
})
export class Paginator {
  readonly page = input(1); // 1-based
  readonly limit = input(10);
  readonly total = input(0);
  readonly pageChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
  readonly from = computed(() => (this.page() - 1) * this.limit() + 1);
  readonly to = computed(() => Math.min(this.page() * this.limit(), this.total()));

  go(p: number) {
    if (p >= 1 && p <= this.totalPages()) this.pageChange.emit(p);
  }
}
