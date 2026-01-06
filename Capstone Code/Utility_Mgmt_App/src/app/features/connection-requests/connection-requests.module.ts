import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RequestUtilityComponent, CreateRequestDialogComponent, RequestDetailsDialogComponent } from './request-utility/request-utility.component';
import { ManageRequestsComponent, AdminRequestDetailsDialogComponent, ProcessRequestDialogComponent } from './manage-requests/manage-requests.component';

const routes: Routes = [
  { path: '', redirectTo: 'request', pathMatch: 'full' },
  { path: 'request', component: RequestUtilityComponent },
  { path: 'manage', component: ManageRequestsComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    RequestUtilityComponent,
    CreateRequestDialogComponent,
    RequestDetailsDialogComponent,
    ManageRequestsComponent,
    AdminRequestDetailsDialogComponent,
    ProcessRequestDialogComponent
  ]
})
export class ConnectionRequestsModule {}
