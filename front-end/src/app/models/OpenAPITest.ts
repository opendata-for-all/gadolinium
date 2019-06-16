import {Server} from './server';

export interface LatencyConfiguration {
  repetitions: number,
  start: Date,
  end: Date,
}

export interface UpTimeConfiguration {
  repetitionFreq: number,

}

export class OpenAPITestConfiguration {
  constructor(
    public file: File,
    public latency: LatencyConfiguration,
    public uptime: UpTimeConfiguration
  ) {
  }
}

export class OpenAPITest {

  public name: string;
  public servers: Server[];
  public results: object;

  constructor(
    public config: OpenAPITestConfiguration,
  ) {
  }
}
