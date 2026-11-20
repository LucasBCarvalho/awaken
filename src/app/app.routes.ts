import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { GameStore } from './core/game.store';

const onboarded = () => inject(GameStore).state().onboarded || inject(Router).parseUrl('/despertar');
const notOnboarded = () => !inject(GameStore).state().onboarded || inject(Router).parseUrl('/missoes');

export const routes: Routes = [
  {
    path: 'despertar',
    canActivate: [notOnboarded],
    loadComponent: () => import('./pages/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: '',
    canActivate: [onboarded],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: 'missoes', loadComponent: () => import('./pages/missions/missions.page').then((m) => m.MissionsPage) },
      { path: 'portais', loadComponent: () => import('./pages/portals/portals.page').then((m) => m.PortalsPage) },
      { path: 'inventario', loadComponent: () => import('./pages/inventory/inventory.page').then((m) => m.InventoryPage) },
      { path: 'perfil', loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage) },
      { path: '', pathMatch: 'full', redirectTo: 'missoes' },
    ],
  },
  { path: '**', redirectTo: '' },
];
