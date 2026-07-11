import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MediaLibraryService } from './media-library.service';
import { MediaFileDto } from '../../core/models/media-file.model';
import { MediaStatus } from '../../core/models/enums';
import { ListState } from '../../core/state/list-state';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FilterBarComponent, FilterControl } from '../../shared/components/filter-bar/filter-bar.component';
import { ColumnDef, DataTableComponent, RowAction } from '../../shared/components/data-table/data-table.component';
import { FormFieldErrorsComponent } from '../../shared/components/form-field-errors/form-field-errors.component';

type Row = MediaFileDto;

@Component({
  selector: 'app-media-library',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule,
    MatInputModule, PageHeaderComponent, FilterBarComponent, DataTableComponent,
    FormFieldErrorsComponent,
  ],
  templateUrl: './media-library.component.html',
  styleUrl: './media-library.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaLibraryComponent implements OnInit {
  private readonly service = inject(MediaLibraryService);
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  readonly state = new ListState<Row>((p) => this.service.getPaged(p), 'uploadedAt');
  readonly uploading = signal(false);
  readonly selectedFile = signal<File | null>(null);

  readonly form = this.fb.nonNullable.group({
    customName: [''],
    expiryDays: [90, [Validators.required, Validators.min(1), Validators.max(3650)]],
  });

  private readonly customName = signal('');

  /** The URL-friendly name the file will be published under, shown live under the form. */
  readonly linkNamePreview = computed(() => {
    const file = this.selectedFile();
    if (!file) {
      return '';
    }
    const dot = file.name.lastIndexOf('.');
    const extension = dot >= 0 ? file.name.slice(dot) : '';
    const base = this.customName().trim() || (dot >= 0 ? file.name.slice(0, dot) : file.name);
    const slug = base
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
    return (slug || 'file') + extension.toLowerCase();
  });

  readonly filters: FilterControl[] = [
    { kind: 'text', key: 'search', label: 'File Name', placeholder: 'company-logo' },
  ];

  readonly columns: ColumnDef<Row>[] = [
    { key: 'storedFileName', header: 'File Name', truncate: 40 },
    { key: 'extension', header: 'Type', type: 'chip', value: (r) => r.extension.toUpperCase() },
    { key: 'sizeBytes', header: 'Size', value: (r) => this.formatSize(r.sizeBytes) },
    { key: 'uploadedAt', header: 'Uploaded', type: 'datetime' },
    { key: 'expiresAt', header: 'Expires', type: 'date' },
    { key: 'status', header: 'Status', type: 'badge', value: (r) => this.statusLabel(r) },
    { key: 'publicUrl', header: 'Public Link', truncate: 45 },
  ];

  readonly rowActions: RowAction<Row>[] = [
    { action: 'copy', icon: 'content_copy', tooltip: 'Copy link', color: 'primary' },
    { action: 'preview', icon: 'visibility', tooltip: 'Preview', color: 'primary' },
    { action: 'download', icon: 'download', tooltip: 'Download', color: 'primary' },
    { action: 'delete', icon: 'delete', tooltip: 'Delete', color: 'warn', show: (r) => r.status !== MediaStatus.Deleted },
  ];

  ngOnInit(): void {
    this.state.load();
  }

  onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
    input.value = ''; // allow re-choosing the same file
  }

  onNameInput(value: string): void {
    this.customName.set(value);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.notify.error('Please choose a file to upload.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.uploading.set(true);
    this.service.upload(file, v.customName.trim() || null, v.expiryDays).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.notify.success(`File uploaded. Its link name is ${res.storedFileName}.`);
        this.resetForm();
        this.state.load();
      },
      error: () => this.uploading.set(false),
    });
  }

  onAction(e: { action: string; row: Row }): void {
    if (e.action === 'delete') {
      this.onDelete(e.row);
      return;
    }
    if (!this.isAvailable(e.row)) {
      this.notify.error('This file is no longer available because it has been deleted or has expired.');
      return;
    }
    switch (e.action) {
      case 'copy':
        void navigator.clipboard.writeText(e.row.publicUrl).then(() => {
          this.notify.success('Link copied.');
        });
        break;
      case 'preview':
        if (this.isPreviewable(e.row)) {
          window.open(e.row.publicUrl, '_blank', 'noopener');
        } else {
          this.download(e.row); // no in-browser preview for this type
        }
        break;
      case 'download':
        this.download(e.row);
        break;
    }
  }

  private onDelete(row: Row): void {
    this.confirm
      .confirm({
        title: 'Delete File',
        message: `Delete "${row.storedFileName}"? Anyone using its link will no longer be able to open it. This cannot be undone.`,
        confirmLabel: 'Delete',
      })
      .subscribe((ok) => {
        if (ok) {
          this.service.remove(row.id).subscribe(() => {
            this.notify.success('File deleted.');
            this.state.load();
          });
        }
      });
  }

  private download(row: Row): void {
    const a = document.createElement('a');
    a.href = `${row.publicUrl}?download=true`;
    a.download = row.originalFileName;
    a.click();
  }

  /** Types browsers can render in a tab; everything else falls back to download. */
  private isPreviewable(row: Row): boolean {
    const type = row.contentType.toLowerCase();
    return type.startsWith('image/') || type.startsWith('video/')
      || type.startsWith('audio/') || type.startsWith('text/')
      || type === 'application/pdf';
  }

  private resetForm(): void {
    this.selectedFile.set(null);
    this.customName.set('');
    this.form.reset({ customName: '', expiryDays: 90 });
  }

  private isAvailable(row: Row): boolean {
    return row.status === MediaStatus.Active && new Date(row.expiresAt) > new Date();
  }

  private statusLabel(row: Row): string {
    if (row.status === MediaStatus.Deleted) {
      return 'Deleted';
    }
    return new Date(row.expiresAt) <= new Date() ? 'Expired' : 'Active';
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
