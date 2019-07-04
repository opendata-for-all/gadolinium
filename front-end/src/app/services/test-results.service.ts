import {Injectable} from '@angular/core';
import {HTTPRequest, LatencyConfig, OpenAPI} from '../models/OpenAPI';
import {Subject} from 'rxjs';
import {Server} from '../models/server';
import {NewLatencyResult, NewUptimeResult, RawLatencyResult, RawUptimeResult} from '../models/TestResult';

@Injectable({
  providedIn: 'root'
})
export class TestResultsService {

  latencyTestHaveStarted: boolean;
  uptimeTestHaveStarted: boolean;
  private selectedApi: OpenAPI;
  private latencyResultsSub: Subject<RawLatencyResult> = new Subject();
  $rawLatencyResults = this.latencyResultsSub.asObservable();
  private newLatencyTestResultSub: Subject<NewLatencyResult> = new Subject();
  $newLatencyTestResultSub = this.newLatencyTestResultSub.asObservable();
  private rawUptimeResultsSub: Subject<RawUptimeResult> = new Subject();
  $rawUptimeResults = this.rawUptimeResultsSub.asObservable();
  private newUptimeTestResultSub: Subject<NewUptimeResult> = new Subject();
  $newUptimeTestResultSub = this.newUptimeTestResultSub.asObservable();
  private servers: Server[];
  private latencyTestConfig: LatencyConfig;

  private uptimeDonutResult: any[][];
  private uptimeProgressBarsResult: any[];

  constructor() {
    this.initializations();
    this.subscriptions();
  }

  private static extractLatencyResultsFromHTTPRequests(httpRequests: HTTPRequest[]) {
    return httpRequests.map(httpRequest => {
      return {name: httpRequest.operationId, results: httpRequest.testResults};
    });
  }

  apiSelected(api: OpenAPI) {
    if (api) {
      if (this.selectedApi === null || (this.selectedApi && (this.selectedApi.id !== api.id))) {
        this.selectedApi = api;
        this.initializeTestResults();
      }
    } else {
      this.eraseTestResults();
    }
  }

  newLatencyTestResult(latencyResults: NewLatencyResult) {
    this.newLatencyTestResultSub.next(latencyResults);
  }

  newUptimeTestResult(uptimeResults) {
    this.newUptimeTestResultSub.next(uptimeResults);
  }

  private initializations() {
    this.selectedApi = null;
    this.latencyTestHaveStarted = null;
    this.uptimeTestHaveStarted = null;
  }

  private subscriptions() {
    // this.$rawUptimeResults.subscribe(uptimeResults => this.uptimeResults = uptimeResults);
    // this.$latencyResults.subscribe(httpRequests => this.latencyResults = TestResultsService.extractLatencyResultsFromHTTPRequests(httpRequests));
    // this.apiStatusService.selectedApi$.subscribe(api => {
    //   if (api !== null) {
    //     if (this.selectedApi) {
    //       if (this.selectedApi.name !== api.name) {
    //         this.selectedApiSub.next(api);
    //       } else {
    //         this.latencyTestHaveStarted = api.httpRequests.some(httpRequest => httpRequest.testResults);
    //         this.uptimeTestHaveStarted = Object.keys(api.uptimeResults).length > 0;
    //         this.rawUptimeResultsSub.next(api.uptimeResults);
    //         this.latencyResultsSub.next(api.httpRequests);
    //       }
    //     } else {
    //       this.selectedApiSub.next(api);
    //       this.latencyTestHaveStarted = api.httpRequests.some(httpRequest => httpRequest.testResults);
    //       this.uptimeTestHaveStarted = Object.keys(api.uptimeResults).length > 0;
    //       this.rawUptimeResultsSub.next(api.uptimeResults);
    //       this.latencyResultsSub.next(api.httpRequests);
    //     }
    //   } else {
    //     this.selectedApiSub.next(api);
    //   }
    // });
  }

  private initializeTestResults() {
    this.latencyResultsSub.next({api: this.selectedApi, rawLatencyResults: this.selectedApi.httpRequests});
    this.rawUptimeResultsSub.next({api: this.selectedApi, rawUptimeResults: this.selectedApi.uptimeResults});
    this.latencyTestHaveStarted = this.hasLatencyTestStarted();
    this.uptimeTestHaveStarted = this.hasUptimeTestStarted();
  }

  private eraseTestResults() {
    console.log('Value set to null');
    this.latencyResultsSub.next({api: this.selectedApi, rawLatencyResults: null});
    this.rawUptimeResultsSub.next({api: this.selectedApi, rawUptimeResults: null});
    this.latencyTestHaveStarted = this.hasLatencyTestStarted();
    this.uptimeTestHaveStarted = this.hasUptimeTestStarted();
  }

  private hasUptimeTestStarted() {
    if (this.selectedApi) {
      return (Object.keys(this.selectedApi.uptimeResults).length > 0);
    } else {
      return false;
    }
  }

  private hasLatencyTestStarted() {
    if (this.selectedApi) {
      return this.selectedApi.servers.filter(server => server.testType === 'latency').some(server => server.status !== 'Creating VM...');
    } else {
      return false;
    }
  }


}
