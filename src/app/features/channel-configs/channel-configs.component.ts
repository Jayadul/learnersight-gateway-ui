import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ChannelConfigsService } from './channel-configs.service';
import { ChannelConfigDto } from '../../core/models/channel-config.model';
import { ChannelType } from '../../core/models/enums';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ConfigCardComponent } from './components/config-card/config-card.component';
import { ConfigFormDialogComponent } from './components/config-form-dialog/config-form-dialog.component';

interface TabDef { label: string; channelType: ChannelType; }

@Component({
  selector: 'app-channel-configs',
  standalone: true,
  imports: [
    MatTabsModule, MatButtonModule, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent,
    EmptyStateComponent, ConfigCardComponent,
  ],
  templateUrl: './channel-configs.component.html',
  styleUrl: './channel-configs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelConfigsComponent implements OnInit {
  private readonly service = inject(ChannelConfigsService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);

  readonly tabs: TabDef[] = [
    { label: 'SMS', channelType: ChannelType.SMS },
    { label: 'WhatsApp Text', channelType: ChannelType.WP_Text },
    { label: 'WhatsApp Media', channelType: ChannelType.WP_Media },
    { label: 'Voice', channelType: ChannelType.Voice },
  ];

  readonly activeTab = signal(0);
  readonly loading = signal(false);
  readonly configs = signal<ChannelConfigDto[]>([]);

  ngOnInit(): void {
    this.loadTab(0);
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
    this.loadTab(index);
  }

  private loadTab(index: number): void {
    this.loading.set(true);
    this.service.getByChannel(this.tabs[index].channelType).subscribe({
      next: (list) => {
        this.configs.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(ConfigFormDialogComponent, {
      data: { channelType: this.tabs[this.activeTab()].channelType },
      width: '480px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.mode === 'create') {
        this.service.create(result.body).subscribe(() => {
          this.notify.success('Channel created.');
          this.loadTab(this.activeTab());
        });
      }
    });
  }

  onEdit(config: ChannelConfigDto): void {
    const ref = this.dialog.open(ConfigFormDialogComponent, {
      data: { channelType: config.channelType, config },
      width: '480px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.mode === 'update') {
        this.service.update(result.id, result.body).subscribe(() => {
          this.notify.success('Channel updated.');
          this.loadTab(this.activeTab());
        });
      }
    });
  }

  onActivate(config: ChannelConfigDto): void {
    this.confirm
      .confirm({ title: 'Activate Channel Settings', message: `Activate "${config.label}"? The currently active settings for this channel will be turned off.`, confirmLabel: 'Activate' })
      .subscribe((ok) => {
        if (ok) {
          this.service.activate(config.id).subscribe(() => {
            this.notify.success('Channel activated.');
            this.loadTab(this.activeTab());
          });
        }
      });
  }

  onDelete(config: ChannelConfigDto): void {
    if (config.isActive) {
      this.notify.error('This channel is currently active. Activate another configuration for this channel first, then delete this one.');
      return;
    }
    this.confirm
      .confirm({ title: 'Delete Channel Settings', message: `Delete "${config.label}"? This cannot be undone.`, confirmLabel: 'Delete' })
      .subscribe((ok) => {
        if (ok) {
          this.service.remove(config.id).subscribe(() => {
            this.notify.success('Channel deleted.');
            this.loadTab(this.activeTab());
          });
        }
      });
  }
}
