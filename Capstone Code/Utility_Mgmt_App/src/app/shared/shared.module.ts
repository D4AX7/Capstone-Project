import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyFormatPipe } from './pipes/currency-format.pipe';
import { HasRoleDirective } from './directives/has-role.directive';

@NgModule({
  imports: [CommonModule, CurrencyFormatPipe, HasRoleDirective],
  exports: [CurrencyFormatPipe, HasRoleDirective]
})
export class SharedModule {}
