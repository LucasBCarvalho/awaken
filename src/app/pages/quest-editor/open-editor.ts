import { ModalController } from '@ionic/angular';
import { Quest, QuestType } from '../../core/models';
import { QuestEditorComponent } from './quest-editor.component';

export async function openQuestEditor(modals: ModalController, quest: Quest | null = null, initialType: QuestType = 'daily'): Promise<void> {
  const m = await modals.create({
    component: QuestEditorComponent,
    componentProps: { quest, initialType },
    breakpoints: [0, 0.94],
    initialBreakpoint: 0.94,
    cssClass: 'sheet',
    handle: true,
  });
  await m.present();
}
