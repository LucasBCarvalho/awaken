import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { EXERCISES, Level, LibraryTemplate, resolveTemplate, stepName } from '../core/library';

/** Guia "como fazer": passo a passo, etapas/exercícios (com execução expansível) e dicas. */
@Component({
  selector: 'aw-guide-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  template: `
    @if (steps()?.length) {
      <div class="label">{{ hasExercises() ? 'Treino' : 'Etapas' }}</div>
      <ol class="steps">
        @for (s of steps(); track $index) {
          <li class="step" [class.done]="checks()?.[$index]">
            <div class="row">
              @if (checks()) {
                <button type="button" class="box" (click)="toggle.emit($index)" [disabled]="readonly()"
                  [attr.aria-pressed]="!!checks()?.[$index]" [attr.aria-label]="'Marcar ' + name(s)">
                  @if (checks()?.[$index]) { <ion-icon name="checkmark" /> }
                </button>
              } @else {
                <span class="idx num">{{ $index + 1 }}</span>
              }
              <button type="button" class="info" (click)="s.exercise && open.set(open() === $index ? -1 : $index)" [class.expandable]="!!s.exercise">
                <span class="nm">{{ name(s) }}</span>
                @if (s.rx) { <span class="rx num">{{ s.rx }}</span> }
                @if (s.exercise) { <span class="more">{{ open() === $index ? 'ocultar' : 'como fazer' }}</span> }
              </button>
            </div>
            @if (s.exercise && open() === $index) {
              <div class="ex">
                <div class="mus">{{ ex(s.exercise).muscles }}</div>
                <ol>
                  @for (h of ex(s.exercise).how; track $index) { <li>{{ h }}</li> }
                </ol>
              </div>
            }
          </li>
        }
      </ol>
    }

    <div class="label">Como fazer</div>
    <ul class="how">
      @for (h of template().how; track $index) { <li>{{ h }}</li> }
    </ul>

    @if (template().tips?.length) {
      <div class="label">Dicas do Sistema</div>
      <ul class="tips">
        @for (t of template().tips; track $index) { <li><ion-icon name="sparkles" /> {{ t }}</li> }
      </ul>
    }
  `,
  styles: `
    :host { display: block; }
    .label { font-family: var(--font-display); font-weight: 700; font-size: .78rem; letter-spacing: .12em; text-transform: uppercase; color: var(--system-cyan); margin: 18px 0 8px; }
    .steps { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    .step { border-radius: 12px; background: var(--bg-abyss); border: 1px solid rgba(47,139,255,.18); }
    .step.done { opacity: .55; }
    .step.done .nm { text-decoration: line-through; }
    .row { display: flex; align-items: center; gap: 4px; padding: 4px 6px 4px 4px; }
    .box { flex: none; width: 44px; height: 44px; display: grid; place-items: center; border: 0; background: transparent; color: var(--success); font-size: 1.2rem; position: relative; }
    .box::before { content: ''; position: absolute; width: 24px; height: 24px; border-radius: 7px; border: 2px solid var(--system-blue); }
    .step.done .box::before { border-color: var(--success); background: rgba(61,220,151,.15); }
    .box ion-icon { position: relative; }
    .idx { flex: none; width: 44px; text-align: center; color: var(--system-blue); font-weight: 600; }
    .info { flex: 1; min-height: 44px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; border: 0; background: transparent; color: var(--text-primary); font: inherit; text-align: left; padding: 6px 4px; }
    .nm { font-weight: 600; font-size: .95rem; }
    .rx { font-size: .8rem; color: var(--system-cyan); background: rgba(47,139,255,.12); padding: 2px 8px; border-radius: 99px; }
    .more { margin-left: auto; font-size: .72rem; color: var(--system-blue); text-transform: uppercase; letter-spacing: .06em; font-family: var(--font-display); font-weight: 700; }
    .ex { padding: 0 14px 12px 52px; font-size: .88rem; line-height: 1.5; color: #c8d6ec; }
    .ex ol { margin: 6px 0 0; padding-left: 18px; }
    .mus { font-size: .75rem; color: var(--gold); }
    .how, .tips { margin: 0; padding-left: 20px; line-height: 1.55; color: #c8d6ec; font-size: .92rem; }
    .how li { margin-bottom: 4px; }
    .tips { list-style: none; padding: 0; }
    .tips li { display: flex; gap: 8px; margin-bottom: 6px; }
    .tips ion-icon { flex: none; color: #b48cff; margin-top: 4px; }
  `,
})
export class GuideViewComponent {
  readonly template = input.required<LibraryTemplate>();
  readonly level = input<Level>(1);
  readonly checks = input<boolean[] | null>(null);
  readonly readonly = input(false);
  readonly toggle = output<number>();

  readonly open = signal(-1);
  readonly steps = computed(() => resolveTemplate(this.template(), this.level()).steps);
  readonly hasExercises = computed(() => !!this.steps()?.some((s) => s.exercise));

  name = stepName;
  ex(id: string) {
    return EXERCISES[id];
  }
}
