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
    { label: 'WhatsApp', channelType: ChannelType.WP },
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
    // Activating no longer switches anything else off — several channels of a type can
    // now be active at once, and only the default decides where untagged sends go.
    this.confirm
      .confirm({ title: 'Activate Channel Settings', message: `Activate "${config.label}"? It becomes available for messages that name it by its channel label.`, confirmLabel: 'Activate' })
      .subscribe((ok) => {
        if (ok) {
          this.service.activate(config.id).subscribe(() => {
            this.notify.success('Channel activated.');
            this.loadTab(this.activeTab());
          });
        }
      });
  }

  onDeactivate(config: ChannelConfigDto): void {
    this.confirm
      .confirm({ title: 'Deactivate Channel Settings', message: `Deactivate "${config.label}"? Messages naming this channel will stop being delivered through it.`, confirmLabel: 'Deactivate' })
      .subscribe((ok) => {
        if (ok) {
          this.service.deactivate(config.id).subscribe(() => {
            this.notify.success('Channel deactivated.');
            this.loadTab(this.activeTab());
          });
        }
      });
  }

  onSetDefault(config: ChannelConfigDto): void {
    this.confirm
      .confirm({ title: 'Make Default Channel', message: `Make "${config.label}" the default? Messages that do not name a channel will be sent through it, and the current default will stop being used for them.`, confirmLabel: 'Make Default' })
      .subscribe((ok) => {
        if (ok) {
          this.service.setDefault(config.id).subscribe(() => {
            this.notify.success('Default channel updated.');
            this.loadTab(this.activeTab());
          });
        }
      });
  }

  onDelete(config: ChannelConfigDto): void {
    if (config.isDefault) {
      this.notify.error('This is the default channel for its type. Make another channel the default first, then delete this one.');
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
