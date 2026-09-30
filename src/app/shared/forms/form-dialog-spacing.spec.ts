import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfigFormDialogComponent } from '../../features/channel-configs/components/config-form-dialog/config-form-dialog.component';
import { PolicyFormDialogComponent } from '../../features/fallback-policies/components/policy-form-dialog/policy-form-dialog.component';
import { UserFormDialogComponent } from '../../features/settings/admin-users/components/user-form-dialog/user-form-dialog.component';
import { ChannelConfigsService } from '../../features/channel-configs/channel-configs.service';
import { ChannelTemplatesService } from '../../features/channel-configs/channel-templates.service';
import { ConfirmService } from '../components/confirm-dialog/confirm.service';
import { NotificationService } from '../../core/services/notification.service';
import { ChannelType } from '../../core/models/enums';

/**
 * Measured in a real browser, not judged by eye: the vertical gap between one field and the next in
 * every form dialog. Fields with dynamic hint sizing carry no reserved space below them, so a form
 * without a uniform gap had fields sitting flush against each other (channel add/edit, hotfix batch 7).
 */
describe('Form dialog spacing', () => {
  const EXPECTED_GAP = 20;

  function render<T>(component: Type<T>, data: unknown) {
    TestBed.configureTestingModule({
      imports: [component],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        { provide: ChannelConfigsService, useValue: { getByChannel: () => of([]), update: () => of({}) } },
        { provide: ChannelTemplatesService, useValue: { list: () => of([]) } },
        { provide: ConfirmService, useValue: { confirm: () => of(true) } },
        { provide: NotificationService, useValue: { success: () => undefined, error: () => undefined, info: () => undefined } },
      ],
    });
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  /** Gaps between every pair of directly consecutive form fields inside the form. */
  function fieldGaps(root: HTMLElement): number[] {
    const form = root.querySelector('form.nzg-form') as HTMLElement;
    expect(form).withContext('the form should use the shared nzg-form layout').not.toBeNull();
    const children = Array.from(form.children) as HTMLElement[];
    const gaps: number[] = [];
    for (let i = 0; i + 1 < children.length; i++) {
      const a = children[i];
      const b = children[i + 1];
      if (a.tagName === 'MAT-FORM-FIELD' && b.tagName === 'MAT-FORM-FIELD') {
        gaps.push(Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom));
      }
    }
    return gaps;
  }

  const cases: { name: string; make: () => HTMLElement }[] = [
    {
      name: 'Add channel (SMS)',
      make: () => render(ConfigFormDialogComponent, { channelType: ChannelType.SMS }),
    },
    {
      name: 'Add channel (WhatsApp, with the delay field)',
      make: () => render(ConfigFormDialogComponent, { channelType: ChannelType.WP }),
    },
    { name: 'Add fallback rule', make: () => render(PolicyFormDialogComponent, {}) },
    { name: 'Add user', make: () => render(UserFormDialogComponent, {}) },
  ];

  for (const c of cases) {
    it(`${c.name}: every field is ${EXPECTED_GAP}px from the next`, () => {
      const gaps = fieldGaps(c.make());
      expect(gaps.length).withContext('should have consecutive fields to measure').toBeGreaterThan(1);
      for (const gap of gaps) expect(gap).toBe(EXPECTED_GAP);
    });
  }
});
