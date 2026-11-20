import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { GameStore, Recommendation } from '../../core/game.store';
import { ATTRIBUTES, DIFFICULTY, TYPE_LABEL, TYPE_MULT } from '../../core/rules';
import { LEVEL_LABEL, hasLevels, resolveTemplate } from '../../core/library';
import { SystemWindowComponent } from '../../shared/system-window.component';
import { GuideViewComponent } from '../../shared/guide-view.component';

/** "Sistema, me fortaleça": análise do jogador + missões propostas com motivo. */
@Component({
  selector: 'aw-recommend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon, SystemWindowComponent, GuideViewComponent],
  template: `
    <ion-content>
      <div class="wrap">
        <header class="top">
          <h2 class="display">Sistema</h2>
          <button class="x" type="button" (click)="close()" aria-label="Fechar"><ion-icon name="close" /></button>
        </header>

        <aw-system-window header="ANÁLISE DO CAÇADOR" tone="violet">
          <ul class="analysis">
            @for (a of rec().analysis; track $index) { <li>{{ a }}</li> }
          </ul>
        </aw-system-window>

        <div class="section-label">Missões propostas</div>
        @for (p of rec().proposals; track p.template.id; let i = $index) {
          <div class="prop" [class.off]="!picked()[i]" [style.--ac]="info[p.template.attribute].color">
            <div class="prow">
              <button type="button" class="box" (click)="toggle(i)" [attr.aria-pressed]="picked()[i]" [attr.aria-label]="'Selecionar ' + p.template.title">
                @if (picked()[i]) { <ion-icon name="checkmark" /> }
              </button>
              <div class="pbody">
                <b>{{ p.template.title }}</b>
                <span class="reason"><ion-icon name="sparkles" /> {{ p.reason }}</span>
                <span class="chips">
                  <span class="chip attr">{{ p.template.attribute }}</span>
                  <span class="chip">{{ typeLabel[p.type] }}</span>
                  @if (multi(p.template)) { <span class="chip">{{ levelLabel[p.level] }}</span> }
                  <span class="chip">+{{ xp(i) }} XP</span>
                </span>
              </div>
            </div>
            <button type="button" class="guide-btn" (click)="expanded.set(expanded() === i ? -1 : i)">
              {{ expanded() === i ? 'Ocultar guia' : 'Ver como fazer' }}
            </button>
            @if (expanded() === i) {
              <div class="guide"><aw-guide-view [template]="p.template" [level]="p.level" /></div>
            }
          </div>
        } @empty {
          <p class="muted c">Você já tem missões de todas as áreas disponíveis na biblioteca. Impressionante, Caçador.</p>
        }

        <div class="cta">
          <button class="btn block" type="button" (click)="accept()" [disabled]="!count()">
            Aceitar {{ count() }} {{ count() === 1 ? 'missão' : 'missões' }}
          </button>
          <button class="btn ghost block" type="button" (click)="reroll()">Gerar outras sugestões</button>
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    .wrap { padding: 8px 16px calc(24px + env(safe-area-inset-bottom)); }
    .top { display: flex; justify-content: space-between; align-items: center; margin: 10px 0 12px; }
    h2.display { margin: 0; font-size: 1.3rem; color: #c3a6ff; }
    .x { width: 44px; height: 44px; border: 0; background: transparent; color: var(--text-muted); font-size: 1.5rem; }
    .analysis { margin: 0; padding-left: 18px; line-height: 1.55; font-size: .92rem; }
    .analysis li { margin-bottom: 4px; }
    .c { text-align: center; }
    .prop { border-radius: 14px; background: var(--bg-abyss); border: 1px solid rgba(47,139,255,.18); border-left: 3px solid var(--ac); margin-bottom: 10px; transition: opacity .2s; }
    .prop.off { opacity: .5; }
    .prow { display: flex; gap: 6px; padding: 8px 12px 0 4px; }
    .box { flex: none; width: 44px; height: 44px; display: grid; place-items: center; border: 0; background: transparent; color: var(--success); font-size: 1.2rem; position: relative; }
    .box::before { content: ''; position: absolute; width: 24px; height: 24px; border-radius: 7px; border: 2px solid var(--system-blue); }
    .prop:not(.off) .box::before { border-color: var(--success); background: rgba(61,220,151,.15); }
    .box ion-icon { position: relative; }
    .pbody { flex: 1; display: flex; flex-direction: column; gap: 5px; padding-top: 10px; }
    .pbody b { font-size: 1rem; }
    .reason { font-size: .82rem; color: #d2bcff; display: flex; gap: 6px; }
    .reason ion-icon { flex: none; margin-top: 3px; }
    .chips { display: flex; flex-wrap: wrap; gap: 5px; }
    .chip.attr { color: var(--ac); border-color: color-mix(in srgb, var(--ac) 40%, transparent); background: color-mix(in srgb, var(--ac) 12%, transparent); }
    .guide-btn { margin: 6px 12px 8px 54px; min-height: 36px; border: 0; background: transparent; color: var(--system-blue); font-family: var(--font-display); font-weight: 700; font-size: .78rem; letter-spacing: .08em; text-transform: uppercase; padding: 0; }
    .guide { padding: 0 14px 14px; }
    .cta { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  `,
})
export class RecommendComponent {
  private readonly store = inject(GameStore);
  private readonly modalCtrl = inject(ModalController);

  readonly info = ATTRIBUTES;
  readonly typeLabel = TYPE_LABEL;
  readonly levelLabel = LEVEL_LABEL;
  multi = hasLevels;

  readonly rec = signal<Recommendation>(this.store.recommend());
  readonly picked = signal<boolean[]>(this.rec().proposals.map(() => true));
  readonly expanded = signal(-1);
  readonly count = computed(() => this.picked().filter(Boolean).length);

  xp(i: number): number {
    const p = this.rec().proposals[i];
    return Math.round(DIFFICULTY[resolveTemplate(p.template, p.level).difficulty].xp * TYPE_MULT[p.type]);
  }

  toggle(i: number): void {
    this.picked.update((l) => l.map((v, j) => (j === i ? !v : v)));
  }

  reroll(): void {
    const r = this.store.recommend();
    this.rec.set(r);
    this.picked.set(r.proposals.map(() => true));
    this.expanded.set(-1);
  }

  accept(): void {
    const chosen = this.rec().proposals.filter((_, i) => this.picked()[i]);
    for (const p of chosen) this.store.addFromLibrary(p.template.id, p.level, p.type);
    this.store.emit({
      kind: 'system',
      tone: 'violet',
      title: 'MISSÕES ATRIBUÍDAS',
      message: `${chosen.length} nova(s) missão(ões) adicionada(s). Toque em uma missão para ver o guia de como fazer.`,
    });
    this.modalCtrl.dismiss(true);
  }

  close(): void {
    this.modalCtrl.dismiss();
  }
}
