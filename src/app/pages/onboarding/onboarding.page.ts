import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { OBJECTIVES, QuestTemplate } from '../../core/catalog';
import { ATTRIBUTES } from '../../core/rules';
import { SystemWindowComponent } from '../../shared/system-window.component';
import { FeedbackService } from '../../core/feedback.service';

const INTRO = 'Você foi escolhido como Jogador.';

@Component({
  selector: 'aw-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon, SystemWindowComponent],
  template: `
    <ion-content [fullscreen]="true">
      <div class="wrap">
        <div class="dots" aria-hidden="true">
          @for (i of [0, 1, 2, 3, 4]; track i) { <i [class.on]="step() >= i"></i> }
        </div>

        @switch (step()) {
          @case (0) {
            <div class="intro">
              <p class="typed display">{{ typed() }}<span class="caret">_</span></p>
              @if (typedDone()) {
                <aw-system-window header="NOTIFICAÇÃO" class="fadein">
                  <p class="c">Você adquiriu as qualificações para ser um <b>Jogador</b>.<br />Deseja aceitar?</p>
                  <button class="btn block" (click)="next()">Aceitar</button>
                </aw-system-window>
              }
            </div>
          }
          @case (1) {
            <aw-system-window header="REGISTRO DO CAÇADOR">
              <label class="field">
                <span>Nome de caçador</span>
                <input #n type="text" maxlength="20" autocomplete="nickname" placeholder="Como o Sistema deve chamá-lo?" [value]="name()" (input)="name.set(n.value)" (keydown.enter)="name().trim() && next()" />
              </label>
              <button class="btn block" [disabled]="!name().trim()" (click)="next()">Confirmar</button>
            </aw-system-window>
          }
          @case (2) {
            <h1 class="page-title">Escolha seus objetivos</h1>
            <p class="muted">Selecione quantas áreas quiser. O Sistema vai montar suas primeiras Diárias.</p>
            <div class="goals">
              @for (o of objectives; track o.key) {
                <button type="button" class="goal" [class.on]="picked().includes(o.key)" (click)="toggle(o.key)" [attr.aria-pressed]="picked().includes(o.key)">
                  <ion-icon [name]="o.icon" />
                  <b>{{ o.label }}</b>
                  <small>{{ o.description }}</small>
                </button>
              }
            </div>
            <button class="btn block" [disabled]="!picked().length" (click)="buildSuggestions(); next()">Continuar</button>
          }
          @case (3) {
            <h1 class="page-title">Missões Diárias</h1>
            <p class="muted">O Sistema sugere estas {{ suggestions().length }} Diárias de dificuldade Fácil. Desmarque as que não quiser — você pode editar tudo depois.</p>
            <div class="sugs">
              @for (q of suggestions(); track $index) {
                <button type="button" class="sug" [class.off]="!enabled()[$index]" (click)="toggleSug($index)" [attr.aria-pressed]="enabled()[$index]">
                  <span class="box">@if (enabled()[$index]) { <ion-icon name="checkmark" /> }</span>
                  <span class="t">{{ q.title }}@if (q.target > 1) { <span class="muted"> · {{ q.target }} {{ q.unit }}</span> }</span>
                  <span class="chip" [style.color]="attrColor(q)">{{ q.attribute }}</span>
                </button>
              }
            </div>
            <button class="btn block" [disabled]="!chosen().length" (click)="next()">Aceitar missões</button>
          }
          @case (4) {
            <aw-system-window header="CONFIGURAÇÃO">
              <p class="c">Que horas o seu dia "vira"? As Diárias renovam nesse horário.</p>
              <div class="choice-row hours">
                @for (h of hours; track h) {
                  <button type="button" class="choice" [class.on]="resetHour() === h" (click)="resetHour.set(h)">{{ h.toString().padStart(2, '0') }}:00</button>
                }
              </div>
              <p class="muted small">Dormiu tarde? Escolha 04:00 para que a madrugada ainda conte como "hoje".</p>
              <button class="btn block" (click)="finish()">Despertar</button>
            </aw-system-window>
          }
        }
      </div>
    </ion-content>
  `,
  styles: `
    ion-content { --background: #000; }
    .wrap { min-height: 100%; display: flex; flex-direction: column; justify-content: center; padding: calc(env(safe-area-inset-top) + 40px) 20px calc(env(safe-area-inset-bottom) + 30px); max-width: 520px; margin: 0 auto; }
    .dots { position: absolute; top: calc(env(safe-area-inset-top) + 18px); left: 0; right: 0; display: flex; justify-content: center; gap: 6px; }
    .dots i { width: 22px; height: 3px; border-radius: 2px; background: rgba(47,139,255,.2); transition: background .3s; }
    .dots i.on { background: var(--system-glow); box-shadow: 0 0 6px var(--system-glow); }
    .intro { display: flex; flex-direction: column; gap: 28px; }
    .typed { font-size: 1.6rem; color: var(--system-cyan); text-align: center; min-height: 4rem; text-shadow: 0 0 18px rgba(92,200,255,.6); }
    .caret { animation: blink 1s steps(1) infinite; color: var(--system-blue); }
    @keyframes blink { 50% { opacity: 0; } }
    .fadein { animation: fade .4s ease both; }
    @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .c { text-align: center; line-height: 1.55; margin: 0 0 16px; }
    .small { font-size: .82rem; margin: 10px 0 16px; text-align: center; }
    .goals { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 16px 0 20px; }
    .goal { min-height: 104px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 14px; text-align: left;
      border-radius: 14px; border: 1px solid var(--line); background: var(--bg-surface); color: var(--text-primary); font: inherit; }
    .goal ion-icon { font-size: 1.6rem; color: var(--system-blue); margin-bottom: 4px; }
    .goal b { font-family: var(--font-display); font-size: 1.1rem; letter-spacing: .04em; text-transform: uppercase; }
    .goal small { color: var(--text-muted); font-size: .78rem; }
    .goal.on { border-color: var(--system-glow); background: rgba(47,139,255,.14); box-shadow: 0 0 16px rgba(47,139,255,.3); }
    .goal.on ion-icon { color: var(--system-cyan); }
    .sugs { display: flex; flex-direction: column; gap: 8px; margin: 16px 0 20px; }
    .sug { min-height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--line);
      background: var(--bg-surface); color: var(--text-primary); font: inherit; text-align: left; }
    .sug.off { opacity: .45; }
    .box { width: 24px; height: 24px; border-radius: 6px; border: 2px solid var(--system-blue); display: grid; place-items: center; color: var(--system-cyan); flex: none; }
    .t { flex: 1; }
    .hours .choice { flex: 1; }
  `,
})
export class OnboardingPage {
  private readonly store = inject(GameStore);
  private readonly router = inject(Router);
  private readonly fx = inject(FeedbackService);

  readonly objectives = OBJECTIVES;
  readonly hours = [0, 3, 4, 5];
  readonly step = signal(0);
  readonly typed = signal('');
  readonly typedDone = computed(() => this.typed().length === INTRO.length);
  readonly name = signal('');
  readonly picked = signal<string[]>([]);
  readonly suggestions = signal<QuestTemplate[]>([]);
  readonly enabled = signal<boolean[]>([]);
  readonly chosen = computed(() => this.suggestions().filter((_, i) => this.enabled()[i]));
  readonly resetHour = signal(0);

  constructor() {
    let i = 0;
    const reduce = this.store.state().settings.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      this.typed.set(INTRO);
      return;
    }
    const timer = setInterval(() => {
      i++;
      this.typed.set(INTRO.slice(0, i));
      if (i >= INTRO.length) clearInterval(timer);
    }, 55);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  next(): void {
    this.fx.tap();
    this.step.update((s) => s + 1);
  }

  toggle(key: string): void {
    this.picked.update((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  }

  buildSuggestions(): void {
    const groups = this.picked().map((k) => OBJECTIVES.find((o) => o.key === k)!.quests);
    // 1 Diária por área (mínimo 4); com muitas áreas, fica 1 de cada para não sobrecarregar
    const count = Math.max(4, groups.length);
    const out: QuestTemplate[] = [];
    for (let round = 0; out.length < count && round < 2; round++) {
      for (const g of groups) if (g[round] && out.length < count) out.push(g[round]);
    }
    // completa com hábitos básicos se faltar
    const fill = [OBJECTIVES[1].quests[0], OBJECTIVES[3].quests[1], OBJECTIVES[0].quests[1]];
    for (const f of fill) if (out.length < count && !out.includes(f)) out.push(f);
    this.suggestions.set(out);
    this.enabled.set(out.map(() => true));
  }

  toggleSug(i: number): void {
    this.enabled.update((e) => e.map((v, j) => (j === i ? !v : v)));
  }

  attrColor(q: QuestTemplate): string {
    return ATTRIBUTES[q.attribute].color;
  }

  finish(): void {
    this.store.completeOnboarding(this.name(), this.picked(), this.chosen(), this.resetHour());
    this.router.navigateByUrl('/missoes', { replaceUrl: true });
  }
}
