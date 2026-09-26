import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { StatusSyncDialogComponent } from './status-sync-dialog.component';
import { StatusSyncService } from '../../../../core/services/status-sync.service';
import { ChannelConfigDto } from '../../../../core/models/channel-config.model';
import { ChannelType, Provider } from '../../../../core/models/enums';

describe('StatusSyncDialogComponent', () => {
  const config = {
    id: 'cfg-1', label: 'SMS Default', channelType: ChannelType.SMS, provider: Provider.Reve,
  } as ChannelConfigDto;

  function setup() {
    const sync = jasmine.createSpy('sync').and.returnValue(of({
      channelConfigId: 'cfg-1', label: 'SMS Default', success: true, updated: 4, stillWaiting: 0,
      markedUnknown: 0, unmatched: 0, moreWaiting: false, error: null, from: '', to: '',
    }));
    TestBed.configureTestingModule({
      imports: [StatusSyncDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: config },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        { provide: StatusSyncService, useValue: { sync } },
      ],
    });
    const fixture = TestBed.createComponent(StatusSyncDialogComponent);
    fixture.detectChanges();
    return { fixture, sync };
  }

  it('has no date inputs, a range toggle or a date picker', () => {
    const { fixture } = setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input')).toBeNull();
    expect(el.querySelector('mat-datepicker-toggle')).toBeNull();
    expect(el.querySelector('mat-button-toggle-group')).toBeNull();
  });

  it('offers exactly one action, Sync Now', () => {
    const { fixture } = setup();
    const labels = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('button'))
      .map((b) => b.textContent!.trim());
    expect(labels).toEqual(['Close', 'Sync Now']);
  });

  it('syncs with no dates at all, so nothing waiting is left outside the query', () => {
    const { fixture, sync } = setup();
    fixture.componentInstance.run();
    expect(sync).toHaveBeenCalledOnceWith('cfg-1');
  });

  it('shows how many were resolved', () => {
    const { fixture } = setup();
    fixture.componentInstance.run();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Resolved 4 recipient(s) as Delivered or Failed.');
  });

  it('says plainly when recipients are still in flight instead of calling them resolved', () => {
    const { fixture, sync } = setup();
    sync.and.returnValue(of({
      channelConfigId: 'cfg-1', label: 'SMS Default', success: true, updated: 0, stillWaiting: 27,
      markedUnknown: 0, unmatched: 0, moreWaiting: false, error: null, from: '', to: '',
    }));
    fixture.componentInstance.run();
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Resolved 0 recipient(s)');
    expect(text).toContain('27 still in flight');
    expect(text).toContain('6 hours');
  });
});
