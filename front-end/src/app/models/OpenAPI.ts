import {Server} from './server';
import {parse, toSeconds} from 'iso8601-duration';

export class HTTPRequest {
  operationId: string;
  method: string;
  url: string;
  data: any;
  testResults: any;
}

export class OpenAPI {
  id: string;
  name: string;
  progress: number;
  totalProgress: number;
  httpRequests: HTTPRequest[];
  servers: Server[];
  testConfig: OpenAPITestConfig;
  uptimeResults: any;
}

export class OpenAPITestConfig {
  latency: LatencyConfig;
  uptime: UpTimeConfig;
}

export class LatencyConfig {
  repetitions: number;
  interval: ISO8601Duration;
  zones: string[];
  timeoutThreshold: number;

  constructor(repetition = null, interval = null) {
    this.repetitions = repetition;
    this.interval = interval;
  }

}

export class UpTimeConfig {
  repetitions: number;
  interval: ISO8601Duration;
  zones: string[];

  constructor(repetition = null, interval = null) {
    this.repetitions = repetition;
    this.interval = interval;
  }
}

export class ISO8601Duration {
  iso8601format: string;

  constructor(string = null) {
    this.iso8601format = string;
  }

  get toSeconds(): number {
    return toSeconds(parse(this.iso8601format));
  }

  get seconds(): number {
    return parse(this.iso8601format).seconds;
  }

  get minutes(): number {
    return parse(this.iso8601format).minutes;
  }

  get hours(): number {
    return parse(this.iso8601format).hours;
  }

  get days(): number {
    return parse(this.iso8601format).days;
  }

  get weeks(): number {
    return parse(this.iso8601format).weeks;
  }

  get months(): number {
    return parse(this.iso8601format).months;
  }

  get years(): number {
    return parse(this.iso8601format).years;
  }

  static toSeconds(string: string) {
    return toSeconds(parse(string));
  }

  static durationString(param: string) {
    let isoObj = new ISO8601Duration(param);
    return isoObj.durationString();
  }

  durationString(): string {
    let string = '';
    if (this.years > 0) {
      if (this.years > 1) {
        string += this.years + ' years';
      } else {
        string += '1 year';
      }
    }
    if (this.months > 0) {
      if (string !== '') {
        string += ', ';
      }
      if (this.months > 1) {
        string += this.months + ' months';
      } else {
        string += '1 month';
      }
    }
    if (this.weeks > 0) {
      if (string !== '') {
        string += ', ';
      }
      if (this.weeks > 1) {
        string += this.weeks + ' weeks';
      } else {
        string += '1 week';
      }
    }
    if (this.days > 0) {
      if (string !== '') {
        string += ', ';
      }
      if (this.days > 1) {
        string += this.days + ' days';
      } else {
        string += '1 day';
      }
    }
    if (this.hours > 0) {
      if (string !== '') {
        string += ', ';
      }
      if (this.hours > 1) {
        string += this.hours + ' hours';
      } else {
        string += '1 hour';
      }
    }
    if (this.minutes > 0) {
      if (string !== '') {
        string += ', ';
      }
      if (this.minutes > 1) {
        string += this.minutes + ' minutes';
      } else {
        string += '1 minute';
      }
    }
    if (this.seconds > 0) {
      if (string !== '') {
        string += ', ';
      }
      if (this.seconds > 1) {
        string += this.seconds + ' seconds';
      } else {
        string += '1 second';
      }
    }
    return string;
  }
}
