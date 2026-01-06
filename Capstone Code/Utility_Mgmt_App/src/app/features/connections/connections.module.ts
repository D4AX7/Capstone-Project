import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./connection-list/connection-list.component').then(m => m.ConnectionListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./connection-form/connection-form.component').then(m => m.ConnectionFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./connection-detail/connection-detail.component').then(m => m.ConnectionDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./connection-form/connection-form.component').then(m => m.ConnectionFormComponent)
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class ConnectionsModule {}
