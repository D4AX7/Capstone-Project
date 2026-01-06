import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management.component';
import { UtilityTypesComponent } from './utility-types/utility-types.component';
import { TariffPlansComponent } from './tariff-plans/tariff-plans.component';
import { BillingCyclesComponent } from './billing-cycles/billing-cycles.component';

const routes: Routes = [
	{ path: '', redirectTo: 'users', pathMatch: 'full' },
	{ path: 'users', component: UserManagementComponent },
	{ path: 'utility-types', component: UtilityTypesComponent },
	{ path: 'tariff-plans', component: TariffPlansComponent },
	{ path: 'billing-cycles', component: BillingCyclesComponent }
];

@NgModule({
	imports: [RouterModule.forChild(routes), UserManagementComponent, UtilityTypesComponent, TariffPlansComponent, BillingCyclesComponent]
})
export class AdminModule {}
