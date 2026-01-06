import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ConsumerPortalComponent } from './consumer-portal.component';

const routes: Routes = [
  { path: '', component: ConsumerPortalComponent }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), ConsumerPortalComponent]
})
export class ConsumerPortalModule {}
