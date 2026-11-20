import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActionSheetController, IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs, ModalController } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { openCreateMenu } from '../library/open';

@Component({
  selector: 'aw-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom" id="aw-tabbar">
        <ion-tab-button tab="missoes">
          <ion-icon name="flame" />
          <ion-label>Missões</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="portais">
          <ion-icon name="planet" />
          <ion-label>Portais</ion-label>
          @if (examReady()) { <span class="dot" aria-label="Exame disponível"></span> }
        </ion-tab-button>
        <div class="center">
          <button type="button" class="plus" (click)="create()" aria-label="Criar missão">
            <ion-icon name="add" />
          </button>
        </div>
        <ion-tab-button tab="inventario">
          <ion-icon name="cube" />
          <ion-label>Inventário</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="perfil">
          <ion-icon name="person" />
          <ion-label>Perfil</ion-label>
          @if (store.state().freePoints > 0) { <span class="dot" aria-label="Pontos livres"></span> }
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: `
    ion-tab-bar { height: calc(64px + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom); }
    ion-tab-button { --padding-top: 6px; position: relative; }
    ion-label { font-family: var(--font-display); font-weight: 600; letter-spacing: .04em; font-size: .72rem; text-transform: uppercase; }
    .center { flex: 0 0 76px; display: grid; place-items: center; }
    .plus { width: 56px; height: 56px; margin-top: -26px; border-radius: 16px; border: 0; color: #fff; font-size: 2rem;
      display: grid; place-items: center; transform: rotate(45deg);
      background: linear-gradient(135deg, #3b95ff, #1f6fe0); box-shadow: 0 0 0 1px rgba(166,240,255,.5) inset, 0 6px 22px rgba(47,139,255,.55); }
    .plus ion-icon { transform: rotate(-45deg); }
    .plus:active { transform: rotate(45deg) scale(.92); }
    .dot { position: absolute; top: 8px; right: calc(50% - 18px); width: 8px; height: 8px; border-radius: 50%; background: var(--danger-red); box-shadow: 0 0 8px var(--danger-red); }
  `,
})
export class TabsPage {
  protected readonly store = inject(GameStore);
  private readonly modals = inject(ModalController);
  private readonly sheets = inject(ActionSheetController);

  examReady(): boolean {
    const s = this.store.state();
    const thresholds: Record<string, number> = { E: 10, D: 25, C: 40, B: 60, A: 80 };
    return !s.exam && s.level >= (thresholds[s.rank] ?? Infinity);
  }

  create(): void {
    openCreateMenu(this.sheets, this.modals);
  }
}
