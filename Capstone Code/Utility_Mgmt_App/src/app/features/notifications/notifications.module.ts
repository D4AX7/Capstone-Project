import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NotificationsComponent } from './notifications.component';

const routes: Routes = [{ path: '', component: NotificationsComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NotificationsComponent
  ]
})
export class NotificationsModule {}
