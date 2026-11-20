import { ActionSheetController, ModalController } from '@ionic/angular';
import { QuestType } from '../../core/models';
import { openQuestEditor } from '../quest-editor/open-editor';
import { LibraryComponent } from './library.component';
import { RecommendComponent } from './recommend.component';
import { QuestDetailComponent } from './quest-detail.component';

const SHEET = { breakpoints: [0, 0.94], initialBreakpoint: 0.94, cssClass: 'sheet', handle: true };

export async function openLibrary(modals: ModalController): Promise<void> {
  const m = await modals.create({ component: LibraryComponent, ...SHEET, breakpoints: [0, 1], initialBreakpoint: 1 });
  await m.present();
  const { data } = await m.onWillDismiss();
  if (data === 'system') await openRecommend(modals);
}

export async function openRecommend(modals: ModalController): Promise<void> {
  const m = await modals.create({ component: RecommendComponent, ...SHEET });
  await m.present();
}

export async function openQuestDetail(modals: ModalController, questId: string): Promise<void> {
  const m = await modals.create({ component: QuestDetailComponent, componentProps: { questId }, ...SHEET, breakpoints: [0, 0.6, 0.94], initialBreakpoint: 0.94 });
  await m.present();
}

/** Menu do botão "+": três caminhos para criar missões. */
export async function openCreateMenu(sheets: ActionSheetController, modals: ModalController, initialType: QuestType = 'daily'): Promise<void> {
  const a = await sheets.create({
    header: 'Nova missão',
    cssClass: 'sys-sheet',
    buttons: [
      { text: 'Biblioteca de missões', icon: 'book', handler: () => void openLibrary(modals) },
      { text: 'Sistema, escolha por mim', icon: 'sparkles', handler: () => void openRecommend(modals) },
      { text: 'Criar do zero', icon: 'create', handler: () => void openQuestEditor(modals, null, initialType) },
      { text: 'Cancelar', role: 'cancel', icon: 'close' },
    ],
  });
  await a.present();
}
