import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { GameStore } from './core/game.store';
import { EventOverlayComponent } from './shared/event-overlay.component';
import { registerIcons } from './shared/icons';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonApp, IonRouterOutlet, EventOverlayComponent],
  template: `
    <ion-app [class.penalty]="store.inPenalty()">
      <ion-router-outlet />
      <aw-event-overlay />
    </ion-app>
  `,
  styles: `
    ion-app.penalty::after { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 20000;
      box-shadow: inset 0 0 80px rgba(255, 59, 92, .45); background: rgba(255, 59, 92, .05); }
  `,
})
export class App {
  protected readonly store = inject(GameStore);

  constructor() {
    registerIcons();
    effect(() => {
      const s = this.store.state().settings;
      document.body.classList.toggle('reduce-motion', s.reduceMotion);
      document.body.classList.toggle('no-glow', !s.glow);
    });
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#05070D' }).catch(() => {});
    }
  }
}
