import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentListComponent } from './payment-list/payment-list.component';
import { RecordPaymentComponent } from './record-payment/record-payment.component';

const routes: Routes = [
  { path: '', component: PaymentListComponent },
  { path: 'new', component: RecordPaymentComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes), PaymentListComponent, RecordPaymentComponent]
})
export class PaymentsModule {}
