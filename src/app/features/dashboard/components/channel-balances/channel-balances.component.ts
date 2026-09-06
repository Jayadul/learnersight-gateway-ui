import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChannelBalanceDto } from '../../../../core/models/channel-balance.model';
import { ChannelBalancesService } from '../../../../core/services/channel-balances.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-channel-balances',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, MatCardModule, MatIconModule, MatButtonModule,
    MatTooltipModule, MatProgressSpinnerModule,
  ],
  templateUrl: './channel-balances.component.html',
  styleUrl: './channel-balances.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelBalancesComponent {
  private readonly service = inject(ChannelBalancesService);
  private readonly notify = inject(NotificationService);

  readonly balances = input.required<ChannelBalanceDto[]>();

  /** Locally applied refreshes, so one card updating does not refetch the dashboard. */
  private readonly overrides = signal<Record<string, ChannelBalanceDto>>({});
  readonly refreshing = signal<string | null>(null);

  readonly rows = computed<ChannelBalanceDto[]>(() => {
    const patched = this.overrides();
    return this.balances().map((b) => patched[b.channelConfigId] ?? b);
  });

  /** Nothing to show is a different state from "every provider failed". */
  readonly isEmpty = computed(() => this.rows().length === 0);

  refresh(row: ChannelBalanceDto): void {
    this.refreshing.set(row.channelConfigId);
    this.service.refresh(row.channelConfigId).subscribe({
      next: (updated) => {
        this.overrides.update((o) => ({ ...o, [updated.channelConfigId]: updated }));
        this.refreshing.set(null);
        if (updated.error) {
          this.notify.error(`${updated.label}: ${updated.error}`);
        } else {
          this.notify.success(`${updated.label} balance updated.`);
        }
      },
      error: () => {
        this.refreshing.set(null);
        this.notify.error(`Could not refresh the balance for ${row.label}.`);
      },
    });
  }
}
