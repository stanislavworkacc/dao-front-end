import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatHash',
    standalone: true,
})
export class FormatHashPipe implements PipeTransform {

  transform(hash: string): unknown {
      if (!hash) return '';
      return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  }
}
