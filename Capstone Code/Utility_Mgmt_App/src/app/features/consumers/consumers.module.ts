import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsumerListComponent } from './consumer-list/consumer-list.component';
import { ConsumerFormComponent } from './consumer-form/consumer-form.component';
import { ConsumerDetailComponent } from './consumer-detail/consumer-detail.component';

const routes: Routes = [
	{ path: '', component: ConsumerListComponent },
	{ path: 'new', component: ConsumerFormComponent },
	{ path: ':id/edit', component: ConsumerFormComponent },
	{ path: ':id', component: ConsumerDetailComponent }
];

@NgModule({
	imports: [RouterModule.forChild(routes), ConsumerListComponent, ConsumerFormComponent, ConsumerDetailComponent]
})
export class ConsumersModule {}
