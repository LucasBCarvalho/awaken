import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, IonModal } from '@ionic/angular';
import { GameStore } from '../../core/game.store';
import { Equipment, InventoryEntry, ItemDef, ItemType } from '../../core/models';
import { ITEM_MAP, ITEM_TYPE_LABEL } from '../../core/catalog';
import { RARITY, RARITY_ORDER, nextResetAt } from '../../core/rules';

type Tab = 'equip' | 'items' | 'shop';
type Filter = 'all' | ItemType | 'other';

@Component({
  selector: 'aw-inventory',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon, IonModal],
  template: `
    <ion-content>
      <div class="page top">
        <div class="titlebar">
          <h1 class="page-title">Inventário</h1>
          <div class="wallet">
            <span class="w gold"><ion-icon name="ellipse" /><span class="num">{{ s().gold }}</span></span>
            <span class="w crys"><ion-icon name="diamond" /><span class="num">{{ s().crystals }}</span></span>
            <span class="w ess"><ion-icon name="sparkles" /><span class="num">{{ s().essence }}</span></span>
          </div>
        </div>

        <div class="seg" role="tablist">
          @for (t of tabs; track t.key) {
            <button role="tab" type="button" class="seg-btn" [class.on]="tab() === t.key" (click)="tab.set(t.key)">{{ t.label }}</button>
          }
        </div>

        @switch (tab()) {
          @case ('equip') {
            <div class="silhouette">
              <div class="body glow-fx" aria-hidden="true"><ion-icon name="person" /></div>
              @for (slot of slots; track slot.key) {
                <button type="button" class="slot" [class]="'slot ' + slot.key" (click)="slotTap(slot.key)" [attr.aria-label]="slot.label + ': ' + (slotItem(slot.key)?.name ?? 'vazio')">
                  @if (slotItem(slot.key); as it) {
                    <span class="sicon" [style.--rc]="rc(it)"><ion-icon [name]="it.icon" /></span>
                    <span class="sname">{{ it.name }}</span>
                  } @else {
                    <span class="sicon empty"><ion-icon name="add" /></span>
                    <span class="sname muted">{{ slot.label }}</span>
                  }
                </button>
              }
            </div>
            <div class="section-label">Bônus ativos</div>
            <div class="card bonuses">
              @for (b of bonusList(); track b.label) {
                <div class="brow"><span>{{ b.label }}</span><span class="num up">{{ b.value }}</span></div>
              } @empty {
                <p class="muted c">Nenhum bônus. Equipe itens tocando nos slots.</p>
              }
            </div>
          }

          @case ('items') {
            <div class="filters">
              @for (f of filters; track f.key) {
                <button type="button" class="choice" [class.on]="filter() === f.key" (click)="filter.set(f.key)">{{ f.label }}</button>
              }
            </div>
            <div class="grid">
              @for (e of filtered(); track e.uid) {
                <button type="button" class="cell" [style.--rc]="rc(def(e))" [class.eq]="store.isEquipped(e.uid)" [class]="'cell r-' + def(e).rarity" (click)="selected.set(e)"
                  [attr.aria-label]="def(e).name + ', ' + rarityLabel(def(e)) + (e.qty > 1 ? ', quantidade ' + e.qty : '')">
                  <ion-icon [name]="def(e).icon" />
                  @if (e.qty > 1) { <span class="qty num">×{{ e.qty }}</span> }
                  @if (e.upgrade > 0) { <span class="up num">+{{ e.upgrade }}</span> }
                  @if (store.isEquipped(e.uid)) { <span class="eqb">E</span> }
                  <span class="cname">{{ def(e).name }}</span>
                </button>
              } @empty {
                <p class="muted c full">Nada por aqui. Itens caem ao concluir missões e abrir baús.</p>
              }
            </div>
          }

          @case ('shop') {
            <div class="section-label">Loja do Sistema <span class="muted renew num">renova em {{ renew() }}</span></div>
            <div class="shop">
              @for (p of store.dailyShop(); track p.item.id) {
                <div class="sitem" [style.--rc]="rc(p.item)">
                  <span class="sicon"><ion-icon [name]="p.item.icon" /></span>
                  <div class="sinfo">
                    <b>{{ p.item.name }}</b>
                    <small>{{ rarityLabel(p.item) }} · {{ p.item.description }}</small>
                  </div>
                  <button class="btn sm gold" type="button" (click)="store.buyItem(p.item.id, p.price)" [disabled]="s().gold < store.price(p.price) || p.item.minLevel > s().level">
                    {{ store.price(p.price) }}
                  </button>
                </div>
              }
            </div>

            <div class="section-label">Loja fixa</div>
            <div class="shop">
              @for (it of store.fixedShop; track it.id) {
                <div class="sitem" [style.--rc]="rc(it)">
                  <span class="sicon"><ion-icon [name]="it.icon" /></span>
                  <div class="sinfo"><b>{{ it.name }}</b><small>{{ it.description }}</small></div>
                  <button class="btn sm gold" type="button" (click)="store.buyItem(it.id, it.price!)" [disabled]="s().gold < store.price(it.price!)">{{ store.price(it.price!) }}</button>
                </div>
              }
            </div>

            <div class="section-label">Recompensas da vida real</div>
            <p class="muted small">Cadastre prêmios seus e compre com o ouro das missões.</p>
            <div class="shop">
              @for (r of s().customRewards; track r.id) {
                <div class="sitem real">
                  <span class="sicon"><ion-icon name="gift" /></span>
                  <div class="sinfo"><b>{{ r.name }}</b><small>Resgatado {{ r.redeemed }}×</small></div>
                  <button class="icon-btn" type="button" (click)="store.deleteCustomReward(r.id)" aria-label="Excluir recompensa"><ion-icon name="trash" /></button>
                  <button class="btn sm gold" type="button" (click)="store.redeemCustomReward(r.id)" [disabled]="s().gold < r.price">{{ r.price }}</button>
                </div>
              }
            </div>
            <div class="newreward card">
              <label class="field"><span>Prêmio</span>
                <input #rn type="text" maxlength="40" placeholder="ex.: 1 episódio de anime" [value]="rName()" (input)="rName.set(rn.value)" />
              </label>
              <div class="nr-row">
                <label class="field"><span>Preço (ouro)</span>
                  <input #rp type="number" inputmode="numeric" min="1" [value]="rPrice()" (input)="rPrice.set(+rp.value)" />
                </label>
                <button class="btn" type="button" (click)="addReward()" [disabled]="!rName().trim() || rPrice() < 1">Adicionar</button>
              </div>
            </div>

            <div class="section-label">Taxas dos baús</div>
            <div class="card odds">
              @for (k of chestKinds; track k.kind) {
                <div class="okind"><b>{{ k.label }}</b>
                  <div class="orow">
                    @for (o of store.chestOdds(k.kind); track o.rarity) {
                      <span class="chip" [style.color]="rarityColor(o.rarity)">{{ rarityName(o.rarity) }} {{ o.pct.toFixed(1) }}%</span>
                    }
                  </div>
                </div>
              }
              <p class="muted small">Garantia: após 29 baús sem Épico, o próximo traz um Épico ou melhor. Baú Mensal: 30% de chance extra de Épico.</p>
            </div>
          }
        }
      </div>

      <ion-modal [isOpen]="!!selected()" (didDismiss)="selected.set(null)" [breakpoints]="[0, 0.6]" [initialBreakpoint]="0.6" class="sheet">
        <ng-template>
          @if (selected(); as e) {
            <div class="detail" [style.--rc]="rc(def(e))">
              <div class="dicon"><ion-icon [name]="def(e).icon" /></div>
              <h2>{{ def(e).name }}@if (e.upgrade) { <span class="num"> +{{ e.upgrade }}</span> }</h2>
              <div class="dmeta">{{ rarityLabel(def(e)) }} · {{ typeLabel(def(e).type) }} · Nível mín. {{ def(e).minLevel }}</div>
              <p>{{ def(e).description }}</p>
              <div class="dactions">
                @if (def(e).use) {
                  <button class="btn block" type="button" (click)="store.useItem(e.uid); selected.set(null)">Usar</button>
                }
                @if (equipable(def(e))) {
                  @if (store.isEquipped(e.uid)) {
                    <button class="btn ghost block" type="button" (click)="unequipEntry(e)">Desequipar</button>
                  } @else {
                    <button class="btn block" type="button" (click)="store.equip(e.uid); selected.set(null)" [disabled]="def(e).minLevel > s().level">
                      {{ def(e).minLevel > s().level ? 'Requer nível ' + def(e).minLevel : 'Equipar' }}
                    </button>
                  }
                  <button class="btn ghost block" type="button" (click)="store.upgrade(e.uid)" [disabled]="e.upgrade >= 10 || s().essence < store.upgradeCost(e.uid)">
                    Aprimorar +{{ e.upgrade + 1 }} ({{ store.upgradeCost(e.uid) }} essência)
                  </button>
                }
                @if (!store.isEquipped(e.uid)) {
                  <button class="btn ghost block" type="button" (click)="store.dismantle(e.uid); selected.set(null)">Desmontar (gera Essência)</button>
                }
              </div>
            </div>
          }
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: `
    .top { padding-top: calc(env(safe-area-inset-top) + 12px); }
    .titlebar { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .wallet { display: flex; gap: 10px; font-size: .85rem; }
    .w { display: inline-flex; align-items: center; gap: 3px; }
    .w.gold ion-icon { color: var(--gold); } .w.crys ion-icon { color: #b48cff; } .w.ess ion-icon { color: var(--system-cyan); }
    .seg { display: flex; gap: 4px; padding: 4px; margin-bottom: 14px; background: var(--bg-surface); border-radius: 12px; border: 1px solid rgba(47,139,255,.14); }
    .seg-btn { flex: 1; min-height: 40px; border: 0; border-radius: 9px; background: transparent; color: var(--text-muted); font-family: var(--font-display); font-weight: 700; font-size: .85rem; letter-spacing: .04em; text-transform: uppercase; }
    .seg-btn.on { background: rgba(47,139,255,.2); color: var(--system-cyan); box-shadow: inset 0 0 0 1px rgba(92,200,255,.45); }
    .small { font-size: .8rem; } .c { text-align: center; } .full { grid-column: 1 / -1; padding: 30px 0; }

    .silhouette { position: relative; height: 300px; margin: 6px 0; }
    .body { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 9rem; color: rgba(47,139,255,.22); filter: drop-shadow(0 0 20px rgba(47,139,255,.35)); }
    .slot { position: absolute; width: 46%; min-height: 64px; display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 12px;
      border: 1px solid var(--line); background: rgba(11,18,32,.88); color: var(--text-primary); font: inherit; text-align: left; }
    .slot.weapon { left: 0; top: 20px; } .slot.armor { right: 0; top: 20px; } .slot.acc1 { left: 0; bottom: 20px; } .slot.acc2 { right: 0; bottom: 20px; }
    .sicon { width: 44px; height: 44px; flex: none; display: grid; place-items: center; border-radius: 10px; font-size: 1.4rem; color: var(--rc, var(--text-muted));
      border: 1.5px solid var(--rc, var(--line)); background: color-mix(in srgb, var(--rc, #000) 12%, transparent); }
    .sicon.empty { border-style: dashed; }
    .sname { font-size: .82rem; font-weight: 600; line-height: 1.2; }
    .bonuses .brow { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(47,139,255,.1); }
    .brow:last-child { border: 0; } .up { color: var(--success); }

    .filters { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 8px; scrollbar-width: none; }
    .filters .choice { flex: none; min-height: 36px; font-size: .8rem; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .cell { position: relative; aspect-ratio: 1 / 1.15; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 6px 4px;
      border-radius: 12px; border: 1.5px solid var(--rc); background: color-mix(in srgb, var(--rc) 10%, var(--bg-surface)); color: var(--rc); font: inherit; }
    .cell ion-icon { font-size: 1.7rem; }
    .cell.r-rare { box-shadow: 0 0 10px color-mix(in srgb, var(--rc) 45%, transparent); }
    .cell.r-epic, .cell.r-legendary { animation: rpulse 2s ease-in-out infinite; }
    @keyframes rpulse { 50% { box-shadow: 0 0 16px color-mix(in srgb, var(--rc) 70%, transparent); } }
    .cname { font-size: .62rem; line-height: 1.1; color: var(--text-primary); text-align: center; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .qty { position: absolute; right: 5px; top: 3px; font-size: .65rem; color: var(--text-primary); }
    .up { position: absolute; left: 5px; top: 3px; font-size: .65rem; }
    .eqb { position: absolute; left: 4px; top: 4px; width: 16px; height: 16px; border-radius: 4px; background: var(--system-blue); color: #fff; font-size: .6rem; font-weight: 700; display: grid; place-items: center; }

    .renew { font-family: var(--font-mono); font-size: .7rem; letter-spacing: 0; text-transform: none; }
    .shop { display: flex; flex-direction: column; gap: 8px; }
    .sitem { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; background: var(--bg-surface); border: 1px solid rgba(47,139,255,.14); }
    .sitem.real .sicon { --rc: var(--gold); }
    .sinfo { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .sinfo b { font-size: .92rem; } .sinfo small { color: var(--text-muted); font-size: .75rem; }
    .icon-btn { width: 40px; height: 40px; border: 0; background: transparent; color: var(--text-muted); font-size: 1.1rem; }
    .newreward { margin-top: 10px; }
    .nr-row { display: flex; gap: 10px; align-items: flex-end; } .nr-row .field { flex: 1; } .nr-row .btn { margin-bottom: 14px; }
    .odds .okind { margin-bottom: 10px; } .orow { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }

    .detail { padding: 24px 20px calc(24px + env(safe-area-inset-bottom)); text-align: center; }
    .dicon { width: 80px; height: 80px; margin: 0 auto 10px; border-radius: 16px; display: grid; place-items: center; font-size: 2.4rem; color: var(--rc);
      border: 2px solid var(--rc); background: color-mix(in srgb, var(--rc) 14%, transparent); box-shadow: 0 0 20px color-mix(in srgb, var(--rc) 40%, transparent); }
    .detail h2 { font-family: var(--font-display); font-weight: 700; color: var(--rc); margin: 0; letter-spacing: .03em; }
    .dmeta { font-size: .78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; margin-top: 4px; }
    .dactions { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
  `,
})
export class InventoryPage {
  protected readonly store = inject(GameStore);
  readonly s = this.store.state;
  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'equip', label: 'Equipamento' },
    { key: 'items', label: 'Itens' },
    { key: 'shop', label: 'Loja' },
  ];
  readonly tab = signal<Tab>('equip');
  readonly filter = signal<Filter>('all');
  readonly selected = signal<InventoryEntry | null>(null);
  readonly rName = signal('');
  readonly rPrice = signal(150);
  readonly filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'weapon', label: 'Armas' },
    { key: 'armor', label: 'Armaduras' },
    { key: 'accessory', label: 'Acessórios' },
    { key: 'consumable', label: 'Consumíveis' },
    { key: 'other', label: 'Outros' },
  ];
  readonly slots: { key: keyof Equipment; label: string }[] = [
    { key: 'weapon', label: 'Arma' },
    { key: 'armor', label: 'Armadura' },
    { key: 'acc1', label: 'Acessório' },
    { key: 'acc2', label: 'Acessório' },
  ];
  readonly chestKinds = [
    { kind: 'daily' as const, label: 'Baú Diário' },
    { kind: 'weekly' as const, label: 'Baú Semanal' },
  ];

  readonly filtered = computed(() => {
    const f = this.filter();
    return this.s()
      .inventory.filter((e) => {
        const t = ITEM_MAP[e.itemId].type;
        return f === 'all' || t === f || (f === 'other' && (t === 'key' || t === 'cosmetic'));
      })
      .sort((a, b) => RARITY_ORDER.indexOf(ITEM_MAP[b.itemId].rarity) - RARITY_ORDER.indexOf(ITEM_MAP[a.itemId].rarity));
  });

  readonly bonusList = computed(() => {
    const items = this.store.equippedItems();
    const out: { label: string; value: string }[] = [];
    for (const it of items) {
      if (it.xpBonus) out.push({ label: `XP ${it.xpAttribute ?? 'geral'} (${it.name})`, value: `+${Math.round(it.xpBonus * 100)}%` });
      if (it.goldBonus) out.push({ label: `Ouro (${it.name})`, value: `+${Math.round(it.goldBonus * 100)}%` });
      if (it.dropBonus) out.push({ label: `Drop (${it.name})`, value: `+${Math.round(it.dropBonus * 100)}%` });
      if (it.hpShield) out.push({ label: `Proteção de HP (${it.name})`, value: `−${Math.round(it.hpShield * 100)}% dano` });
    }
    return out;
  });

  readonly renew = computed(() => {
    const now = new Date(this.store.now());
    const ms = nextResetAt(now, this.s().settings.resetHour).getTime() - now.getTime();
    return `${Math.floor(ms / 3600_000)}h ${Math.floor((ms % 3600_000) / 60_000)}min`;
  });

  def(e: InventoryEntry): ItemDef {
    return ITEM_MAP[e.itemId];
  }
  rc(it: ItemDef): string {
    return RARITY[it.rarity].color;
  }
  rarityLabel(it: ItemDef): string {
    return RARITY[it.rarity].label;
  }
  rarityName(r: keyof typeof RARITY): string {
    return RARITY[r].label;
  }
  rarityColor(r: keyof typeof RARITY): string {
    return RARITY[r].color;
  }
  typeLabel(t: ItemType): string {
    return ITEM_TYPE_LABEL[t];
  }
  equipable(it: ItemDef): boolean {
    return it.type === 'weapon' || it.type === 'armor' || it.type === 'accessory';
  }

  slotItem(slot: keyof Equipment): ItemDef | null {
    const u = this.s().equipment[slot];
    const e = u ? this.s().inventory.find((x) => x.uid === u) : null;
    return e ? ITEM_MAP[e.itemId] : null;
  }

  slotTap(slot: keyof Equipment): void {
    if (this.s().equipment[slot]) this.store.unequip(slot);
    else {
      this.filter.set(slot === 'weapon' ? 'weapon' : slot === 'armor' ? 'armor' : 'accessory');
      this.tab.set('items');
    }
  }

  unequipEntry(e: InventoryEntry): void {
    const eq = this.s().equipment;
    const slot = (Object.keys(eq) as (keyof Equipment)[]).find((k) => eq[k] === e.uid);
    if (slot) this.store.unequip(slot);
    this.selected.set(null);
  }

  addReward(): void {
    this.store.addCustomReward(this.rName(), this.rPrice());
    this.rName.set('');
  }
}
