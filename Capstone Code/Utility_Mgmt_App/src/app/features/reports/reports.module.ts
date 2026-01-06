import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RevenueReportComponent } from './revenue-report/revenue-report.component';
import { OutstandingReportComponent } from './outstanding-report/outstanding-report.component';
import { ConsumptionReportComponent } from './consumption-report/consumption-report.component';
import { DashboardReportComponent } from './dashboard-report/dashboard-report.component';
import { ConsumerBillingComponent } from './consumer-billing/consumer-billing.component';
import { MyConsumptionComponent } from './my-consumption/my-consumption.component';

const routes: Routes = [
	{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
	{ path: 'dashboard', component: DashboardReportComponent },
	{ path: 'revenue-report', component: RevenueReportComponent },
	{ path: 'outstanding-report', component: OutstandingReportComponent },
	{ path: 'consumption-report', component: ConsumptionReportComponent },
	{ path: 'my-consumption', component: MyConsumptionComponent },
	{ path: 'consumer-billing/:consumerId', component: ConsumerBillingComponent }
];

@NgModule({
	imports: [
		RouterModule.forChild(routes),
		RevenueReportComponent,
		OutstandingReportComponent,
		ConsumptionReportComponent,
		DashboardReportComponent,
		ConsumerBillingComponent,
		MyConsumptionComponent
	]
})
export class ReportsModule {}
