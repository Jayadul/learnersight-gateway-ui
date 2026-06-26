import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

/**
 * Config-driven filter row. Emits a plain object of non-empty values on Search.
 * Date ranges emit ISO strings under keyFrom/keyTo. Wire (search) to
 * ListState.setFilters and (reset) to reload defaults.
 */
export type FilterControl =
  | { kind: 'text'; key: string; label: string; placeholder?: string }
  | { kind: 'select'; key: string; label: string; options: { label: string; value: unknown }[] }
  | { kind: 'dateRange'; keyFrom: string; keyTo: string; label: string };

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly controls = input.required<FilterControl[]>();
  readonly search = output<Record<string, unknown>>();
  readonly reset = output<void>();

  form!: FormGroup;

  ngOnInit(): void {
    const group: Record<string, unknown> = {};
    for (const c of this.controls()) {
      if (c.kind === 'dateRange') {
        group[c.keyFrom] = [null];
        group[c.keyTo] = [null];
      } else {
        group[c.key] = [null];
      }
    }
    this.form = this.fb.group(group);
  }

  onSearch(): void {
    const raw = this.form.value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      out[key] = value instanceof Date ? value.toISOString() : value;
    }
    this.search.emit(out);
  }

  onClear(): void {
    this.form.reset();
    this.reset.emit();
    this.search.emit({});
  }
}
