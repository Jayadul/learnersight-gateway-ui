import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ConfigFormDialogComponent } from './config-form-dialog.component';
import { ChannelConfigsService } from '../../channel-configs.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ChannelConfigDto } from '../../../../core/models/channel-config.model';
import { ChannelType, Provider } from '../../../../core/models/enums';

/**
 * The Edit Channel dialog, exercised once per provider. Hotfix batch 6 fixed Nothing changed /
 * Changes saved on the Voice channel only: every other provider still had the hidden providers'
 * required fields (empty) making the form invalid, so Save did nothing at all. A single spot check
 * on one provider is exactly how that got through, so every provider is covered here.
 */
interface Case {
  name: string;
  channelType: ChannelType;
  provider: Provider;
  providerName: string;
  fields: Record<string, string>;
  edit: { key: string; value: string };
}

const CASES: Case[] = [
  {
    name: 'REVE SMS', channelType: ChannelType.SMS, provider: Provider.Reve, providerName: 'Reve SMS Provider',
    fields: {
      apikey: '***6eeae4', secretkey: '***0c8029', callerID: '123', baseUrl: 'http://smpp.revesms.com:7788',
      balanceBaseUrl: 'https://smpp.revesms.com', balanceClientId: 'net zero', balanceSessionCookie: '***940CE7',
    },
    edit: { key: 'callerID', value: '456' },
  },
  {
    name: 'Chithi SMS', channelType: ChannelType.SMS, provider: Provider.Chithi, providerName: 'Chithi SMS Provider',
    fields: { api_token: '***6YtSiy', sid: 'NetZerONonMask', baseUrl: 'https://sms.chithi.net' },
    edit: { key: 'sid', value: 'Other' },
  },
  {
    name: 'WaTrend', channelType: ChannelType.WP, provider: Provider.WaTrend, providerName: 'Watrend WhatsApp Provider',
    fields: { instance_id: '6A3BB82690474', access_token: '***46fa3e', baseUrl: 'https://app.watrend.com' },
    edit: { key: 'instance_id', value: 'NEWID' },
  },
  {
    name: 'NetZero Inbox v1', channelType: ChannelType.WP, provider: Provider.NetZeroInbox, providerName: 'NetZero Inbox WhatsApp (v1)',
    fields: { token: '***JYSv0c', baseUrl: 'https://inbox.netzero.com.bd' },
    edit: { key: 'baseUrl', value: 'https://inbox.example.com' },
  },
  {
    name: 'NetZero Inbox QR', channelType: ChannelType.WP, provider: Provider.NetZeroInboxQr, providerName: 'NetZero Inbox WhatsApp (QR)',
    fields: { token: '***JYSv0c', from: '8801942785200', baseUrl: 'https://inbox.netzero.com.bd' },
    edit: { key: 'from', value: '8801000000009' },
  },
  {
    name: 'NetZero Inbox Template', channelType: ChannelType.WP, provider: Provider.NetZeroInboxTemplate, providerName: 'NetZero Inbox Template',
    fields: { templateToken: '***Wyqhd4', baseUrl: 'https://inbox.netzero.com.bd' },
    edit: { key: 'baseUrl', value: 'https://inbox.example.com' },
  },
  {
    name: 'NetZero Voice', channelType: ChannelType.Voice, provider: Provider.NetZeroVoice, providerName: 'Netzero Voice Provider',
    fields: {
      authUserId: '***ero_IT', owner: 'NetZero_IT', password: '***$%#@56', campaignId: 'due-bill-api',
      lotNumber: '1', baseUrl: 'http://obd.netzero.com.bd:8000',
    },
    edit: { key: 'campaignId', value: 'other-campaign' },
  },
];

function configFor(c: Case): ChannelConfigDto {
  return {
    id: 'cfg-1', channelType: c.channelType, provider: c.provider, providerName: c.providerName,
    label: c.name, labelSlug: c.name.toLowerCase().replace(/[^a-z0-9]/g, ''), isActive: true, isDefault: false,
    delaySeconds: 0, configFields: c.fields, createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
  };
}

describe('ConfigFormDialogComponent (edit)', () => {
  function setup(c: Case, updateResult: 'ok' | 'error' = 'ok') {
    const close = jasmine.createSpy('close');
    const update = jasmine.createSpy('update').and.returnValue(
      updateResult === 'ok' ? of({}) : throwError(() => new Error('rejected')));
    const notify = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info', 'warning']);

    TestBed.configureTestingModule({
      imports: [ConfigFormDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { channelType: c.channelType, config: configFor(c) } },
        { provide: MatDialogRef, useValue: { close } },
        { provide: ChannelConfigsService, useValue: { update, revealField: () => of({ value: 'x' }) } },
        { provide: NotificationService, useValue: notify },
      ],
    });
    const fixture = TestBed.createComponent(ConfigFormDialogComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, close, update, notify };
  }

  for (const c of CASES) {
    describe(c.name, () => {
      it('starts as a valid form when nothing has been touched', () => {
        const { component } = setup(c);
        expect(component.form.invalid).withContext(`invalid controls: ${invalidKeys(component)}`).toBeFalse();
      });

      it('says Nothing changed and closes when saved untouched', () => {
        const { component, close, update, notify } = setup(c);
        component.save();
        expect(notify.info).toHaveBeenCalledWith('Nothing changed.');
        expect(close).toHaveBeenCalledWith({ mode: 'unchanged' });
        expect(update).not.toHaveBeenCalled();
      });

      it('saves a real change, says Changes saved, then closes', () => {
        const { component, close, update, notify } = setup(c);
        component.form.get(c.edit.key)!.setValue(c.edit.value);
        component.save();
        expect(update).toHaveBeenCalledTimes(1);
        const body = update.calls.mostRecent().args[1];
        expect(JSON.parse(body.configJson)[c.edit.key]).toBe(c.edit.value);
        expect(notify.success).toHaveBeenCalledWith('Changes saved.');
        expect(close).toHaveBeenCalledWith({ mode: 'saved' });
      });

      it('stays open and keeps the edit when the server rejects the save', () => {
        const { component, close, notify } = setup(c, 'error');
        component.form.get(c.edit.key)!.setValue(c.edit.value);
        component.save();
        expect(close).not.toHaveBeenCalled();
        expect(notify.success).not.toHaveBeenCalled();
        expect(component.saving()).toBeFalse();
        expect(component.form.get(c.edit.key)!.value).toBe(c.edit.value);
      });
    });
  }
});

describe('ConfigFormDialogComponent (create)', () => {
  function setupCreate(channelType: ChannelType) {
    const close = jasmine.createSpy('close');
    TestBed.configureTestingModule({
      imports: [ConfigFormDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { channelType } },
        { provide: MatDialogRef, useValue: { close } },
        { provide: ChannelConfigsService, useValue: {} },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']) },
      ],
    });
    const fixture = TestBed.createComponent(ConfigFormDialogComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, close };
  }

  it('creates a REVE channel without the hidden Chithi fields being required', () => {
    const { component, close } = setupCreate(ChannelType.SMS);
    component.form.patchValue({
      label: 'SMS Two', providerName: 'REVE SMS', apikey: 'k', secretkey: 's', callerID: 'c',
    });
    component.save();
    expect(close).toHaveBeenCalled();
    expect(close.calls.mostRecent().args[0].mode).toBe('create');
  });

  it('requires the new provider fields after switching provider, and not the old ones', () => {
    const { component } = setupCreate(ChannelType.WP);
    component.onProviderChange(Provider.NetZeroInboxTemplate);
    component.form.patchValue({ label: 'Tpl', providerName: 'NetZero Inbox Template' });
    expect(component.form.get('templateToken')!.hasError('required')).toBeTrue();
    expect(component.form.get('instance_id')!.hasError('required')).toBeFalse();
    component.form.patchValue({ templateToken: 't' });
    expect(component.form.invalid).withContext(invalidKeys(component)).toBeFalse();
  });
});

function invalidKeys(component: ConfigFormDialogComponent): string {
  return Object.entries(component.form.controls)
    .filter(([, control]) => control.invalid)
    .map(([key]) => key)
    .join(', ');
}
