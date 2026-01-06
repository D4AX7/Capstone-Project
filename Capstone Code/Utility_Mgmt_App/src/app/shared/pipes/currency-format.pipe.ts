import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyFormat', standalone: true })
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | string, currency: string = 'USD'): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num)
      ? ''
      : new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(num);
  }
}
