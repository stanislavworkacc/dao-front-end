import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatAddress',
    standalone: true,
})
export class FormatAddressPipe implements PipeTransform {

  transform(address: string): unknown {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

}
