import {HTTPRequest, OpenAPI, UpTimeConfig} from './OpenAPI';
import {DateTime} from 'luxon';

export interface DonutData {
  api: OpenAPI;
  chartData: any[][]
}

export interface ProgressBarData {
  uptimeTestConfig: UpTimeConfig;
  api: OpenAPI;
  singleProgressBars: any[];
  groupedProgressBar: any[];
  testStartingDate: DateTime;
  testEndingDate: DateTime;
}

export interface RawUptimeResult {
  api: OpenAPI;
  rawUptimeResults: any
}

export interface NewUptimeResult {
  date: string;
  serverName: string;
  isApiUp: boolean
}

export interface NewLatencyResult {
  serverName: string;
  httpRequestIndex: number;
  testResults: any;
  operationId: string;
  newRecord: {
    error: boolean;
    date: string;
    code: string;
    latencyMs: number
  }
}

export interface RawLatencyResult {
  api: OpenAPI,
  rawLatencyResults: HTTPRequest[]
}

export interface OperationTimeByZoneData {
  api: OpenAPI;
  columns: any[];
  categories: any[];
}

export interface TimeOperationOverTimeData {
  api: OpenAPI;
  xs: any;
  columns: any;
  axis: any;
  dataDisplayingIntervalOptions: string[]
}
