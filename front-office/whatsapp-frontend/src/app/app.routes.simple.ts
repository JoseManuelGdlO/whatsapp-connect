import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'sessions',
    loadComponent: () => import('./components/sessions/sessions').then(m => m.SessionsComponent)
  },
  {
    path: 'messages/:sessionId',
    loadComponent: () => import('./components/messages/messages').then(m => m.MessagesComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
