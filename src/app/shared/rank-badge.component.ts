import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Rank } from '../core/models';

const RANK_COLOR: Record<Rank, string> = {
  E: '#9AA5B8',
  D: '#3DDC97',
  C: '#2F8BFF',
  B: '#5CC8FF',
  A: '#F5C451',
  S: '#7B3FE4',
};

@Component({
  selector: 'aw-rank-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': '"Rank " + rank()', '[style.--rc]': 'color()' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 100 100">
      <polygon points="50,4 91,27 91,73 50,96 9,73 9,27" [attr.fill]="color() + '22'" [attr.stroke]="color()" stroke-width="5" />
      <text x="50" y="52" text-anchor="middle" dominant-baseline="central" [attr.fill]="color()"
        font-family="Rajdhani, sans-serif" font-weight="700" font-size="52">{{ rank() }}</text>
    </svg>
  `,
  styles: `:host { display: inline-flex; filter: drop-shadow(0 0 6px var(--rc)); } svg { display: block; }`,
})
export class RankBadgeComponent {
  readonly rank = input.required<Rank>();
  readonly size = input(44);
  readonly color = computed(() => RANK_COLOR[this.rank()]);
}
