import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import { FailureDrilldownDialogComponent } from './failure-drilldown-dialog.component';
import { MessageLogsService } from '../../../message-logs/message-logs.service';
import { DispatchJobRecipientDto } from '../../../../core/models/dispatch-job-recipient.model';
import { ChannelType, DeliveryStatus } from '../../../../core/models/enums';

/**
 * The rows behind a failure-reasons bar (hotfix batch 8). Every row here is a failure by
 * definition, so a Status column says nothing; what the reader needs is when each attempt happened.
 */
describe('FailureDrilldownDialogComponent', () => {
  const row = (id: string, sentAt: string | null): DispatchJobRecipientDto => ({
    id, dispatchJobId: 'j', recipient: `88017000000${id}`, providerReferenceId: null,
    deliveryStatus: DeliveryStatus.Failed, lastCheckedAt: null, createdAt: '2026-09-25T10:00:00Z',
    channelType: ChannelType.WP, channelLabel: 'WhatsApp Text Default', messageContent: 'hi',
    campaignId: null, sentAt, isFallback: false, resentFromRecipientId: null, rawProviderResponse: null,
  });

  function open(items: DispatchJobRecipientDto[], total = items.length) {
    const getPaged = jasmine.createSpy('getPaged').and.returnValue(of({ items, totalCount: total, page: 1, pageSize: 25 }));
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        { provide: MessageLogsService, useValue: { getPaged } },
        { provide: MAT_DIALOG_DATA, useValue: { reason: 'Instance ID Invalidated', channelConfigId: 'cfg-1' } },
      ],
    });
    const fixture = TestBed.createComponent(FailureDrilldownDialogComponent);
    fixture.detectChanges();
    return { el: fixture.nativeElement as HTMLElement, getPaged };
  }

  it('lists Recipient, Channel and Sent At, with no Status column', () => {
    const { el } = open([row('1', '2026-09-25T10:00:00Z')]);
    const headers = Array.from(el.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers).toEqual(['Recipient', 'Channel', 'Sent At']);
    expect(el.querySelector('app-status-badge')).toBeNull();
  });

  it('shows a date for every row', () => {
    const { el } = open([row('1', '2026-09-25T10:00:00Z'), row('2', '2026-09-25T11:00:00Z')]);
    const cells = Array.from(el.querySelectorAll('tbody tr')).map((tr) => tr.lastElementChild?.textContent?.trim());
    expect(cells.length).toBe(2);
    cells.forEach((c) => expect(c).not.toBe('—'));
  });

  it('asks for exactly the clicked reason and gateway', () => {
    const { getPaged } = open([row('1', null)]);
    const args = getPaged.calls.mostRecent().args[0];
    expect(args.failureReason).toBe('Instance ID Invalidated');
    expect(args.channelConfigId).toBe('cfg-1');
  });
});
