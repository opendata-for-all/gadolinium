import {Injectable} from '@angular/core';
import {DateTime, Duration} from 'luxon';
import {HTTPRequest, LatencyConfig, OpenAPI} from '../models/OpenAPI';
import {TestResultsService} from './test-results.service';
import {Subject} from 'rxjs';
import {NewLatencyResult, OperationTimeByZoneData, TimeOperationOverTimeData} from '../models/TestResult';

@Injectable({
  providedIn: 'root'
})
export class LatencyResultsService {

  testHasStarted: boolean;
  dataDisplayingSelectionSub: Subject<string> = new Subject();
  $dataDisplayingSelection = this.dataDisplayingSelectionSub.asObservable();
  private selectedApi: OpenAPI;
  private rawLatencyResults: HTTPRequest[];
  private latencyTestConfig: LatencyConfig;
  private operationTimeByZoneSub: Subject<OperationTimeByZoneData> = new Subject();
  $operationTimeByZone = this.operationTimeByZoneSub.asObservable();
  private timeOperationOverTimeSub: Subject<TimeOperationOverTimeData> = new Subject();
  $timeOperationOverTime = this.timeOperationOverTimeSub.asObservable();
  private timeZonesOverTimeSub: Subject<any> = new Subject();
  $timeZonesOverTime = this.timeZonesOverTimeSub.asObservable();
  private operationTimeByZoneData: any[];
  private operationTimeByZoneCategories: any[];
  private timeOperationOverTimeData: any[];
  private timeOperationOverTimeXs: any;
  private timeOperationOverTimeAxis: string;
  private timeZoneOverTimeData: any[];
  private timeZoneOverTimeXs: any;
  private timeZoneOverTimeAxis: string;
  private minimumDataDisplayingInterval: string;
  private maximumDataDisplayingInterval: string;
  private selectedDataDisplayingInterval: string;
  private dataDisplayingIntervalOptions: string[];
  private meanOfAllRequests: any;
  private meanOfRequestsByOperations: any;
  private meanOfRequestsByZones: any;
  private regionOfRequestsError: any;

  private testStartingDate: DateTime;
  private testStartingDateSub: Subject<DateTime> = new Subject();
  $testStartingDate = this.testStartingDateSub.asObservable();
  private testEndingDate: DateTime;
  private testEndingDateSub: Subject<DateTime> = new Subject();
  $testEndingDate = this.testEndingDateSub.asObservable();
  private dataDisplayingIntervalOptionsSub: Subject<string[]> = new Subject();
  $dataDisplayingIntervalOptions = this.dataDisplayingIntervalOptionsSub.asObservable();

  constructor(
    private testResultsService: TestResultsService
  ) {
    this.initializations();
    this.subscriptions();
  }

  private initializations() {
    this.selectedApi = null;
    this.testHasStarted = false;
    //TODO each chart data variables;

  }

  private subscriptions() {
    this.testResultsService.$rawLatencyResults.subscribe(data => {
      if (data.api && (!this.selectedApi || this.selectedApi.id !== data.api.id)) {
        this.latencyTestConfig = data.api.testConfig.latency;
        this.rawLatencyResults = data.rawLatencyResults;
        this.selectedApi = data.api;
        this.testHasStarted = this.hasLatencyTestStarted();
        this.initializeAllResultData();
      } else if (!data.api) {
        this.selectedApi = data.api;
        this.testHasStarted = false;
        this.initializeAllResultData();
      }
    });
    this.testResultsService.$newLatencyTestResultSub.subscribe(newTest => {
      if (this.testHasStarted) {
        this.updateAllResultData(newTest);
      } else {
        this.testHasStarted = true;
        this.initializeAllResultData();
        this.updateAllResultData(newTest);
      }
    });
    this.$dataDisplayingSelection.subscribe(newOption => {
      if (this.selectedDataDisplayingInterval !== newOption) {
        this.selectedDataDisplayingInterval = newOption;
        this.initializeMeanOfRequestsByZonesAndMeanOfAllRequests();
        this.initializeMeanOfRequestsByOperations();

        this.setTimeOperationOverTimeData();
        this.setTimeZoneOverTimeData();

        this.emitTimeOperationOverTimeToSub();
        this.emitTimeZonesOverTimeToSub();
      }
    });
  }

  private initializeAllResultData() {
    if (this.selectedApi) {
      this.minimumDataDisplayingInterval = this.getMinimumDataDisplayingInterval();
      this.maximumDataDisplayingInterval = this.getMaximumDataDisplayingInterval();
      this.selectedDataDisplayingInterval = this.minimumDataDisplayingInterval;
      this.setDataDisplayingIntervalOptions();
      this.setStartingAndEndingTestDate();

      this.initializeMeanOfRequestsByZonesAndMeanOfAllRequests();
      this.initializeMeanOfRequestsByOperations();

      this.setTimeOperationOverTimeData();
      this.setTimeZoneOverTimeData();

      this.initializeTimeOperationAndZoneOverTimeAxis();
      this.initializeOperationTimeByZoneResults();
      this.initializeTimeOperationOverTimeResults();
      this.initializeTimeZoneOverTimeResults();

    } else {
      this.minimumDataDisplayingInterval = this.getMinimumDataDisplayingInterval();
      this.maximumDataDisplayingInterval = this.getMaximumDataDisplayingInterval();
      this.selectedDataDisplayingInterval = this.minimumDataDisplayingInterval;
      this.setDataDisplayingIntervalOptions();
      this.setStartingAndEndingTestDate();

      this.timeOperationOverTimeData = [];
      this.timeOperationOverTimeAxis = '';
      this.timeOperationOverTimeXs = [];

      this.operationTimeByZoneData = [];
      this.operationTimeByZoneCategories = [];

      this.timeZoneOverTimeData = [];
      this.timeZoneOverTimeAxis = '';
      this.timeZoneOverTimeXs = [];

      this.emitOperationTimeByZoneToSub();
      this.emitTimeOperationOverTimeToSub();
      this.emitTimeZonesOverTimeToSub();
    }
  }

  private emitTimeZonesOverTimeToSub() {
    this.timeZonesOverTimeSub.next({
      api: this.selectedApi,
      axis: this.timeZoneOverTimeAxis,
      columns: this.timeZoneOverTimeData,
      xs: this.timeZoneOverTimeXs,
      dataDisplayingIntervalOptions: this.dataDisplayingIntervalOptions
    });
  }

  private emitTimeOperationOverTimeToSub() {
    this.timeOperationOverTimeSub.next({
      api: this.selectedApi,
      axis: this.timeOperationOverTimeAxis,
      columns: this.timeOperationOverTimeData,
      xs: this.timeOperationOverTimeXs,
      dataDisplayingIntervalOptions: this.dataDisplayingIntervalOptions,

    });
  }

  private emitOperationTimeByZoneToSub() {
    this.operationTimeByZoneSub.next({
      api: this.selectedApi,
      columns: this.operationTimeByZoneData,
      categories: this.operationTimeByZoneCategories
    });

  }

  private initializeOperationTimeByZoneResults() {
    this.initializeOperationTimeByZoneData();
    this.initializeOperationTimeByZoneCategories();

    this.emitOperationTimeByZoneToSub();
  }

  private initializeTimeOperationOverTimeResults() {
    this.setTimeOperationOverTimeData();
    this.initializeTimeOperationOverTimeXs();

    this.emitTimeOperationOverTimeToSub();
  }

  private initializeTimeZoneOverTimeResults() {
    this.setTimeZoneOverTimeData();
    this.initializeTimeZonesOverTimeXs();

    this.emitTimeZonesOverTimeToSub();
  }

  private initializeOperationTimeByZoneData() {
    this.operationTimeByZoneData = [];
    this.selectedApi.servers.map(server => {
      if (server.testType === 'latency') {
        return this.operationTimeByZoneData.push([server.region,
            ...this.selectedApi.httpRequests
              .filter(httpRequest => httpRequest.testResults && httpRequest.testResults[server.name])
              .map(httpRequest => {
                return httpRequest.testResults[server.name].meanLatency;
              })
          ]
        );
      }
    });
  }

  private initializeOperationTimeByZoneCategories() {
    this.operationTimeByZoneCategories = [];
    this.operationTimeByZoneCategories.push(
      ...this.selectedApi.httpRequests
        .filter(httpRequest => httpRequest.testResults)
        .map(httpRequest => httpRequest.operationId));
  }

  private setTimeOperationOverTimeData() {
    this.timeOperationOverTimeData = [];
    if (this.testHasStarted) {
      this.rawLatencyResults.forEach(httpRequest => {
        if (this.meanOfRequestsByZones[httpRequest.operationId]) {
          this.timeOperationOverTimeData.push([`date${httpRequest.operationId}`, ...Object.keys(this.meanOfRequestsByZones[httpRequest.operationId])]);
          // @ts-ignore
          this.timeOperationOverTimeData.push([`${httpRequest.operationId}`, ...Object.values(this.meanOfRequestsByZones[httpRequest.operationId]).map(record => record.value)]);
        }
      });
      this.timeOperationOverTimeData.push(['dateMean', ...Object.keys(this.meanOfAllRequests)]);
      // @ts-ignore
      this.timeOperationOverTimeData.push(['mean', ...Object.values(this.meanOfAllRequests).map(record => record.value)]);
    }
  }

  private initializeTimeOperationOverTimeXs() {
    this.timeOperationOverTimeXs = {};
    this.rawLatencyResults.forEach(httpRequest => {
      this.timeOperationOverTimeXs[`${httpRequest.operationId}`] = `date${httpRequest.operationId}`;
    });
    this.timeOperationOverTimeXs['mean'] = 'dateMean';
  }

  private initializeTimeOperationAndZoneOverTimeAxis() {
    switch (this.selectedDataDisplayingInterval) {
      case 'year' :
        this.timeOperationOverTimeAxis = '%Y';
        this.timeZoneOverTimeAxis = '%Y';
        break;
      case 'month' :
        this.timeOperationOverTimeAxis = '%Y-%m';
        this.timeZoneOverTimeAxis = '%Y-%m';
        break;
      case 'day' :
        this.timeOperationOverTimeAxis = '%Y-%m-%d';
        this.timeZoneOverTimeAxis = '%Y-%m-%d';
        break;
      case 'hour' :
        this.timeOperationOverTimeAxis = '%m-%d %Hh';
        this.timeZoneOverTimeAxis = '%m-%d %Hh';
        break;
      case 'minute' :
        this.timeOperationOverTimeAxis = '%H:%M';
        this.timeZoneOverTimeAxis = '%H:%M';
        break;
    }
  }

  private setTimeZoneOverTimeData() {
    this.timeZoneOverTimeData = [];
    if (this.testHasStarted) {
      this.latencyTestConfig.zones.forEach(serverRegion => {
        if (this.meanOfRequestsByOperations[serverRegion]) {
          this.timeZoneOverTimeData.push([`date${serverRegion}`, ...Object.keys(this.meanOfRequestsByOperations[serverRegion])]);
          // @ts-ignore
          this.timeZoneOverTimeData.push([`${serverRegion}`, ...Object.values(this.meanOfRequestsByOperations[serverRegion]).map(record => record.value)]);
        }
      });
      this.timeZoneOverTimeData.push(['dateMean', ...Object.keys(this.meanOfAllRequests)]);
      // @ts-ignore
      this.timeZoneOverTimeData.push(['mean', ...Object.values(this.meanOfAllRequests).map(record => record.value)]);
    }
  }

  private initializeTimeZonesOverTimeXs() {
    this.timeZoneOverTimeXs = {};
    this.latencyTestConfig.zones.forEach(serverRegion => {
      this.timeZoneOverTimeXs[`${serverRegion}`] = `date${serverRegion}`;
    });
    this.timeZoneOverTimeXs['mean'] = 'dateMean';
  }


  private updateAllResultData(newTest: any) {
    this.updateOperationTimeByZoneResults(newTest);
    this.updateTimeOperationOverTimeResults(newTest);
    this.updateTimeZoneOverTimeResults(newTest);
    this.setStartingAndEndingTestDate();
  }

  private updateOperationTimeByZoneResults(newTest) {
    this.updateOperationTimeByZoneData(newTest);
    this.updateOperationTimeByZoneCategories(newTest);
    this.emitOperationTimeByZoneToSub();
  }

  private updateTimeOperationOverTimeResults(newTest) {
    this.updateMeanOfRequestsByZones(newTest);
    this.setTimeOperationOverTimeData();

    this.emitTimeOperationOverTimeToSub();
  }

  private updateOperationTimeByZoneData(newTest: NewLatencyResult) {
    if (!newTest.newRecord.error) {
      let region = this.selectedApi.servers.filter(server => server.name === newTest.serverName)[0].region;
      if (this.operationTimeByZoneData.some(serverResults => serverResults[0] === region)) {
        this.operationTimeByZoneData = this.operationTimeByZoneData.map(serverResults => {
          if (serverResults[0] === region) {
            serverResults[newTest.httpRequestIndex + 1] = newTest.testResults[newTest.serverName].meanLatency;
          }
          return serverResults;
        });
      } else {
        let serverResult = [region];
        serverResult[newTest.httpRequestIndex + 1] = newTest.testResults[newTest.serverName].meanLatency;
        this.operationTimeByZoneData.push(serverResult);
      }
    }
  }

  private updateOperationTimeByZoneCategories(newTest) {
    if (this.operationTimeByZoneCategories.indexOf(newTest.operationId) < 0) {
      this.operationTimeByZoneCategories.push(newTest.operationId);
    }
  }

  private hasLatencyTestStarted() {
    return this.selectedApi.servers.filter(server => server.testType === 'latency').some(server => server.status !== 'Creating VM...');
  }

  private updateMeanOfRequestsByZones(newTest: NewLatencyResult) {
    let transformedDate = this.transformDateToSelectedDataDisplayingInterval(newTest.newRecord.date);
    if (!newTest.newRecord.error) {
      if (this.meanOfRequestsByZones[newTest.operationId]) {
        let indexOfTransformedDate = Object.keys(this.meanOfRequestsByZones[newTest.operationId]).findIndex(time => time === transformedDate) + 1;
        if (indexOfTransformedDate > 0) {
          let previousValue = this.meanOfRequestsByZones[newTest.operationId][transformedDate];
          let recalculatedMean = (previousValue.value * previousValue.count + newTest.newRecord.latencyMs) / ++previousValue.count;
          this.meanOfRequestsByZones[newTest.operationId][transformedDate] = {
            value: recalculatedMean.toFixed(2),
            count: previousValue.count
          };
        } else {
          this.meanOfRequestsByZones[newTest.operationId][transformedDate] = {value: newTest.newRecord.latencyMs, count: 1};
        }
      } else {
        this.meanOfRequestsByZones[newTest.operationId][transformedDate] = {value: newTest.newRecord.latencyMs, count: 1};
      }
      this.updateMeanOfAllOperationsFor(transformedDate, newTest);
    }
  }

  private updateMeanOfRequestsByOperations(newTest: NewLatencyResult) {
    let serverRegion = this.selectedApi.servers.find(server => server.name === newTest.serverName).region;
    let transformedDate = this.transformDateToSelectedDataDisplayingInterval(newTest.newRecord.date);
    if (!newTest.newRecord.error) {
      if (this.meanOfRequestsByOperations[serverRegion]) {
        let indexOfTransformedDate = Object.keys(this.meanOfRequestsByOperations[serverRegion]).findIndex(time => time === transformedDate) + 1;
        if (indexOfTransformedDate > 0) {
          //IF A RECORD AT THIS DATETIME HAS ALREADY BEEN MEASURED
          let previousValue = this.meanOfRequestsByOperations[serverRegion][transformedDate];
          let recalculatedMean = (previousValue.value * previousValue.count + newTest.newRecord.latencyMs) / ++previousValue.count;
          this.meanOfRequestsByOperations[serverRegion][transformedDate] = {value: recalculatedMean.toFixed(2), count: previousValue.count};
        } else {
          this.meanOfRequestsByOperations[serverRegion][transformedDate] = {value: newTest.newRecord.latencyMs, count: 1};
        }
      } else {
        this.meanOfRequestsByOperations[serverRegion][transformedDate] = {value: newTest.newRecord.latencyMs, count: 1};
      }
    }
  }

  private updateTimeZoneOverTimeResults(newTest: NewLatencyResult) {
    this.updateMeanOfRequestsByOperations(newTest);
    this.setTimeZoneOverTimeData();

    this.emitTimeZonesOverTimeToSub();
  }

  private initializeMeanOfRequestsByZonesAndMeanOfAllRequests() {
    this.meanOfRequestsByZones = {};
    this.meanOfAllRequests = {};
    this.regionOfRequestsError = {};
    this.rawLatencyResults.map(httpRequest => {
      if (httpRequest.testResults) {
        let aggregatedResults = {};
        Object.values(httpRequest.testResults).forEach(serverResults => {
          // @ts-ignore
          serverResults.latencyRecords.forEach(record => {
            let transformedDate = this.transformDateToSelectedDataDisplayingInterval(record.date);
            if (!record.error) {
              if (aggregatedResults[transformedDate]) {
                aggregatedResults[transformedDate].value = (((aggregatedResults[transformedDate].value * aggregatedResults[transformedDate].count) + record.latencyMs) / ++aggregatedResults[transformedDate].count).toFixed(2);
              } else {
                aggregatedResults[transformedDate] = {
                  value: record.latencyMs,
                  count: 1
                };
              }
              if (this.meanOfAllRequests[transformedDate]) {
                this.meanOfAllRequests[transformedDate].value = (((this.meanOfAllRequests[transformedDate].value * this.meanOfAllRequests[transformedDate].count) + record.latencyMs) / ++this.meanOfAllRequests[transformedDate].count).toFixed(2);
              } else {
                this.meanOfAllRequests[transformedDate] = {
                  value: record.latencyMs,
                  count: 1
                };
              }
            } else {
              this.regionOfRequestsError[transformedDate] = {
                errorType: record.errorType,
                code: record.code
              };
            }
          });

        });
        this.meanOfRequestsByZones[httpRequest.operationId] = aggregatedResults;
      } else {
        this.meanOfRequestsByZones[httpRequest.operationId] = {};
      }
    });
  }

  private initializeMeanOfRequestsByOperations() {
    this.meanOfRequestsByOperations = {};
    this.selectedApi.servers.filter(server => server.name).forEach(server => {
      let aggregatedResults = {};
      this.rawLatencyResults.forEach(httpRequest => {
        if (httpRequest.testResults) {
          if (httpRequest.testResults[server.name]) {
            httpRequest.testResults[server.name].latencyRecords.forEach(record => {
              if (!record.error) {
                let transformedDate = this.transformDateToSelectedDataDisplayingInterval(record.date);
                if (aggregatedResults[`${transformedDate}`]) {
                  aggregatedResults[`${transformedDate}`].value = (((aggregatedResults[transformedDate].value * aggregatedResults[transformedDate].count) + record.latencyMs) / ++aggregatedResults[transformedDate].count).toFixed(2);
                } else {
                  aggregatedResults[`${transformedDate}`] = {
                    value: record.latencyMs,
                    count: 1
                  };
                }
              }
            });
          }
        }
      });
      this.meanOfRequestsByOperations[server.region] = aggregatedResults;
    });
  }

  private getMinimumDataDisplayingInterval() {
    let interval = Duration.fromISO(this.latencyTestConfig.interval.iso8601format).normalize();
    if (interval.as('years') > 1) {
      return 'year';
    } else if (interval.as('months') > 1) {
      return 'month';
    } else if (interval.as('days') > 1) {
      return 'day';
    } else {
      return 'minute';
    }
  }

  private getMaximumDataDisplayingInterval() {
    let interval = Duration.fromMillis(Duration.fromISO(this.latencyTestConfig.interval.iso8601format).valueOf() * this.latencyTestConfig.repetitions).normalize();
    if (interval.as('years') > 1) {
      return 'year';
    } else if (interval.as('months') > 1) {
      return 'month';
    } else if (interval.as('days') > 1) {
      return 'day';
    } else if (interval.as('hours') > 1) {
      return 'hour';
    } else {
      return 'minute';
    }
  }

  private setDataDisplayingIntervalOptions() {
    let options = ['minute', 'hour', 'day', 'month', 'year'];
    let takeItOrNot = false;
    let result = [];
    options.forEach(option => {
      if (option === this.minimumDataDisplayingInterval) {
        takeItOrNot = true;
      }
      if (takeItOrNot) {
        result.push(option);
      }
      if (option === this.maximumDataDisplayingInterval) {
        takeItOrNot = false;
      }
    });
    this.dataDisplayingIntervalOptions = result;
    this.dataDisplayingIntervalOptionsSub.next(this.dataDisplayingIntervalOptions);

  }

  private transformDateToSelectedDataDisplayingInterval(date: string) {
    let transformedDate;
    switch (this.selectedDataDisplayingInterval) {
      case 'minute' :
        transformedDate = DateTime.fromISO(date).set({millisecond: 0, second: 0}).toFormat('yyyy MM dd HH mm ss');
        break;
      case 'hour' :
        transformedDate = DateTime.fromISO(date).set({millisecond: 0, second: 0, minute: 0}).toFormat('yyyy MM dd HH mm ss');
        break;
      case 'day' :
        transformedDate = DateTime.fromISO(date).set({millisecond: 0, second: 0, minute: 0, hour: 0}).toFormat('yyyy MM dd HH mm ss');
        break;
      case 'month' :
        transformedDate = DateTime.fromISO(date).set({
          millisecond: 0,
          second: 0,
          minute: 0,
          hour: 0,
          day: 0
        }).toFormat('yyyy MM dd HH mm ss');
        break;
      case 'year' :
        transformedDate = DateTime.fromISO(date).set({
          millisecond: 0,
          second: 0,
          minute: 0,
          hour: 0,
          day: 0,
          month: 0
        }).toFormat('yyyy MM dd HH mm ss');
        break;
    }
    return transformedDate;
  }

  private updateMeanOfAllOperationsFor(transformedDate: string, newTest: NewLatencyResult) {
    if (this.meanOfAllRequests[transformedDate]) {
      let previousValue = this.meanOfAllRequests[transformedDate];
      let recalculatedMean = ((previousValue.value * previousValue.count + newTest.newRecord.latencyMs) / ++previousValue.count).toFixed(2);
      this.meanOfAllRequests[transformedDate] = {value: recalculatedMean, count: previousValue.count};
    } else {
      this.meanOfAllRequests[transformedDate] = {value: newTest.newRecord.latencyMs, count: 1};
    }
  }

  private setStartingAndEndingTestDate() {
    if (this.testHasStarted) {
      console.log(this.selectedApi);
      let allDates = [];
      this.selectedApi.httpRequests.filter(httpRequest => httpRequest.testResults).forEach(httpRequest => {
        // @ts-ignore
        Object.values(httpRequest.testResults).forEach(serverResult => serverResult.latencyRecords.forEach(record => allDates.push(DateTime.fromISO(record.date))));
      });
      this.testEndingDateSub.next(DateTime.max(...allDates));
      this.testStartingDateSub.next(DateTime.min(...allDates));
    }
    // this.testStartingDateSub.next(DateTime.min(...this.singleProgressBars.filter(server => server.availability !== 'Test hasn\'t started yet').map(pg => DateTime.fromISO(pg.records[0].startDate))));
    // this.testEndingDateSub.next(DateTime.max(...this.singleProgressBars.filter(server => server.availability !== 'Test hasn\'t started yet').map(pg => DateTime.fromISO(pg.records[pg.records.length - 1].endDate))));
  }
}
