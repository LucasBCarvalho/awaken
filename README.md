# AWAKEN — App de Missões com Progressão RPG

App mobile (Android/iOS) feito com **Angular 21 + Ionic 9 + Capacitor 8**. Offline-first: todo o progresso fica salvo no aparelho.

## Rodar

```bash
npm install
npm start                # navegador em http://localhost:4200 (use o modo celular do DevTools)
npm run android          # build + abre no Android Studio (rode/gere o APK por lá)
npm run android:run      # build + instala direto num celular/emulador conectado
```

Para iOS: `npx cap add ios` (precisa de macOS + Xcode).

## Estrutura

```
src/app/
  core/
    models.ts          tipos (Quest, GameState, itens…)
    rules.ts           fórmulas: XP ⌈50·n^1,3⌉, multiplicadores, ranks, raridade, períodos
    catalog.ts         itens, classes, objetivos do onboarding, sugestões do Sistema
    game.store.ts      estado (signals) + persistência + resets diário/semanal/mensal
    quick-parse.ts     criação rápida em linguagem natural (offline)
    feedback.service   háptico + som curto
  shared/              janela do Sistema, barras, badge de rank, radar, cartão de missão, overlays
  pages/               despertar (onboarding), missões, portais, inventário, perfil, editor
```

## O que está implementado (MVP)

- Onboarding "Despertar" com primeiro level up imediato
- Diárias (dias ativos, dia de descanso), Semanais (2 sugeridas pelo Sistema), Mensais e Avulsas
- Contadores, gestos (deslizar → concluir; ← adiar/editar/excluir), Desfazer por 5 s
- XP com bônus de streak, itens, classe, Foco ×2, penalidade e anti-farm
- Level up em tela cheia, pontos de atributo, radar hexagonal, classes no nível 10
- HP/Mana, Zona de Penalidade com missão de recuperação, ajuste automático de dificuldade
- Drops, baús diário/semanal/mensal com taxas visíveis e sistema de piedade
- Inventário, equipamento, aprimoramento, desmontar (Essência), loja rotativa e fixa
- Recompensas da vida real compradas com ouro
- Missão oculta diária, Exame de Promoção (7 dias), modo férias, heatmap de consistência
- Reduzir movimento, desligar brilho, vibração e som opcionais
- **Biblioteca de missões** (48 modelos em 6 áreas) com guia "como fazer", treinos exercício a exercício e 3 níveis
- **"Sistema, me fortaleça"**: recomenda missões pelos atributos fracos, objetivos, limite de Diárias e taxa de conclusão
- **Conquistas** (22) em 5 níveis — Bronze, Prata, Ouro, Platina e Diamante — com recompensas e títulos

## Próximos passos

Notificações locais (`@capacitor/local-notifications`), Dungeons, Sombras, tema claro/alto contraste,
backend (Supabase) com validação de XP no servidor, widgets e integração com Health Connect/HealthKit.
