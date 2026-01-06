import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillingCyclesListComponent } from './billing-cycles.list.component';

const routes: Routes = [
  { path: '', component: BillingCyclesListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes), BillingCyclesListComponent]
})
export class BillingCyclesModule {}
