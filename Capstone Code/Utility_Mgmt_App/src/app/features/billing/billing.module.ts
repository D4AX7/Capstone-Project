import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillListComponent } from './bill-list/bill-list.component';
import { BillDetailComponent } from './bill-detail/bill-detail.component';
import { GenerateBillComponent } from './generate-bill/generate-bill.component';
import { BillingDashboardComponent } from './billing-dashboard/billing-dashboard.component';

const routes: Routes = [
	{ path: '', component: BillListComponent },
	{ path: 'dashboard', component: BillingDashboardComponent },
	{ path: 'generate', component: GenerateBillComponent },
	{ path: ':id', component: BillDetailComponent }
];

@NgModule({
	imports: [RouterModule.forChild(routes), BillListComponent, BillDetailComponent, GenerateBillComponent, BillingDashboardComponent]
})
export class BillingModule {}
