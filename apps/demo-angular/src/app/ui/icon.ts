import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

const CIRCLE = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z';

/** Inline SVG icons (no icon library), drawn with the current text colour. */
const PATHS = {
  dashboard: ['M4 4h7v9H4z', 'M13 4h7v5h-7z', 'M13 11h7v9h-7z', 'M4 15h7v5H4z'],
  people: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  calendar: [
    'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
    'M4 10h16',
    'M8 2v4',
    'M16 2v4',
  ],
  checkCircle: [CIRCLE, 'M8 12l3 3 5-6'],
  clock: [CIRCLE, 'M12 7v5l3 3'],
  userPlus: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    'M19 8v6',
    'M22 11h-6',
  ],
  gift: [
    'M3 8h18v4H3z',
    'M5 12v9h14v-9',
    'M12 8v13',
    'M12 8S10 3 7.5 4.5 9 8 12 8z',
    'M12 8s2-5 4.5-3.5S15 8 12 8z',
  ],
  award: [
    CIRCLE,
    'M12 8l1.2 2.5 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z',
  ],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M21 21l-4.3-4.3'],
  check: ['M5 12l5 5 9-11'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  plus: ['M12 5v14', 'M5 12h14'],
  arrowLeft: ['M19 12H5', 'M11 6l-6 6 6 6'],
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  chevronLeft: ['M15 6l-6 6 6 6'],
  chevronRight: ['M9 6l6 6-6 6'],
  mail: [
    'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
    'M3 7l9 6 9-6',
  ],
  phone: [
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
  ],
  mapPin: [
    'M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z',
    'M12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  ],
  briefcase: [
    'M3 7h18v13H3z',
    'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M3 13h18',
  ],
  leave: [
    'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
    'M4 10h16',
    'M9 15l2 2 4-4',
  ],
} as const;

export type IconName = keyof typeof PATHS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hr-icon', 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  protected readonly paths = computed(() => PATHS[this.name()]);
}
