import {Pipe, PipeTransform} from '@angular/core';
import {Duration} from 'luxon';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {

  transform(value: string): string {
    const leftPad = x => String(x).length >= 2 ? x : leftPad(`0${x}`);
    let duration = Duration.fromISO(value).shiftTo('years', 'months', 'days', 'hours', 'minutes', 'seconds');
    let baseString = '';
    if (duration.years > 0) {
      baseString = baseString.concat(duration.years + ' years ');
    }
    if (duration.months > 0) {
      baseString = baseString.concat(duration.months + ' months ');
    }
    if (duration.days > 0) {
      baseString = baseString.concat(duration.days + ' days ');
    }
    if (duration.hours > 0) {
      baseString = baseString.concat(duration.hours + ' hours ');
    }
    if (duration.minutes > 0) {
      baseString = baseString.concat(duration.minutes + ' minutes ');
    }
    if (duration.seconds > 0) {
      baseString = baseString.concat(duration.seconds + ' seconds ');
    }
    return baseString;
  }

}
