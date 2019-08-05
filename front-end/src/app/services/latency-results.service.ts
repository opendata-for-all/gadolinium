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

  private selectedApi: OpenAPI;
  private rawLatencyResults: HTTPRequest[];
  private latencyTestConfig: LatencyConfig;

  /**
   * Intermediate variables
   */
  private meanOfAllRecords: any;
  private meanOfZoneLatencyByOperations: any;
  private meanOfOperationLatencyByZones: any;

  // regionOfRequestsError stores all errors happened during a test process, for now it is useless but it would be possible to add a tab
  // listing all the errors
  private regionOfRequestsError: any;

  /**
   * Chart formatted data
   */
    // Contains the data for the OperationTimeByZones chart
  private operationTimeByZoneSub: Subject<OperationTimeByZoneData> = new Subject();
  $operationTimeByZone = this.operationTimeByZoneSub.asObservable();
  private operationTimeByZoneData: any[];
  private operationTimeByZoneCategories: any[];
  // Contains the data for the TimeOperationOverTime chart
  private timeOperationOverTimeSub: Subject<TimeOperationOverTimeData> = new Subject();
  $timeOperationOverTime = this.timeOperationOverTimeSub.asObservable();
  private timeOperationOverTimeData: any[];
  private timeOperationOverTimeXs: any;
  private timeOperationOverTimeAxis: string;
  // Contains the data for the TimeZonesOverTime chart
  private timeZonesOverTimeSub: Subject<any> = new Subject();
  $timeZonesOverTime = this.timeZonesOverTimeSub.asObservable();
  private timeZoneOverTimeData: any[];
  private timeZoneOverTimeXs: any;
  private timeZoneOverTimeAxis: string;

  /**
   * Data display selection
   * Allow display of data in charts by minutes, hours, ...
   */
    // Contains the list of data displaying option
  private dataDisplayingIntervalOptions: string[];
  private selectedDataDisplayingInterval: string;
  private minimumDataDisplayingInterval: string;
  private maximumDataDisplayingInterval: string;
  private dataDisplayingIntervalOptionsSub: Subject<string[]> = new Subject();
  $dataDisplayingIntervalOptions = this.dataDisplayingIntervalOptionsSub.asObservable();
  // Contains the selected data display option
  dataDisplayingSelectionSub: Subject<string> = new Subject();
  $dataDisplayingSelection = this.dataDisplayingSelectionSub.asObservable();

  // Contains the date of start of the test process
  private testStartingDateSub: Subject<DateTime> = new Subject();
  $testStartingDate = this.testStartingDateSub.asObservable();
  // Contains the date of ending of the test process
  private testEndingDateSub: Subject<DateTime> = new Subject();
  $testEndingDate = this.testEndingDateSub.asObservable();

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
        // If the data received contains an API, and if the API is different from the selected one
        // Then the data is not initialized every time an API is clicked on
        this.latencyTestConfig = data.api.testConfig.latency;
        this.rawLatencyResults = data.rawLatencyResults;
        this.selectedApi = data.api;
        this.testHasStarted = this.hasLatencyTestStarted();
        this.initializeAllResultData();
      } else if (!data.api) {
        // If there is no API, reset all charts
        this.selectedApi = data.api;
        this.testHasStarted = false;
        this.resetAllResultData();
      }
    });
    this.testResultsService.$newLatencyTestResultSub.subscribe(newTest => {
      if (this.testHasStarted) {
        // If the test is currently in progress, then update all the charts
        this.updateAllResultData(newTest);
      } else {
        // If the record is the first one, and the test hasn't begun before it, then initialize all the chart data and update is with the new record
        this.testHasStarted = true;
        this.initializeAllResultData();
        this.updateAllResultData(newTest);
      }
    });
    this.$dataDisplayingSelection.subscribe(newOption => {
      if (this.selectedDataDisplayingInterval !== newOption) {
        this.selectedDataDisplayingInterval = newOption;
        this.initializeMeanOfOperationLatencyByZonesAndMeanOfAllRecords();
        this.initializeMeanOfZoneLatencyByOperations();

        this.setTimeOperationOverTimeData();
        this.setTimeZoneOverTimeData();

        this.emitTimeOperationOverTimeToSub();
        this.emitTimeZonesOverTimeToSub();
      }
    });
  }

  /***********************************
   * Emit functions to the Subscribers
   ***********************************/

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
      dataDisplayingIntervalOptions: this.dataDisplayingIntervalOptions
    });
  }

  private emitOperationTimeByZoneToSub() {
    this.operationTimeByZoneSub.next({
      api: this.selectedApi,
      columns: this.operationTimeByZoneData,
      categories: this.operationTimeByZoneCategories
    });
  }

  /**********************************************************
   * Initialization of intermediate variables and charts data
   **********************************************************/

  private initializeAllResultData() {
    this.minimumDataDisplayingInterval = this.getMinimumDataDisplayingInterval();
    this.maximumDataDisplayingInterval = this.getMaximumDataDisplayingInterval();
    this.selectedDataDisplayingInterval = this.minimumDataDisplayingInterval;
    this.setDataDisplayingIntervalOptions();
    this.setStartingAndEndingTestDate();

    this.initializeIntermediateVariables();
    this.initializeChartData();
  }

  /***************************************
   * Intermediate variable initializations
   ***************************************/

  private initializeIntermediateVariables() {
    this.initializeMeanOfOperationLatencyByZonesAndMeanOfAllRecords();
    this.initializeMeanOfZoneLatencyByOperations();
  }

  private resetAllResultData() {
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

  private initializeMeanOfOperationLatencyByZonesAndMeanOfAllRecords() {
    this.meanOfOperationLatencyByZones = {};
    this.meanOfAllRecords = {};
    this.regionOfRequestsError = {};
    this.rawLatencyResults.map(httpRequest => {
      // For each operation in HTTP Request List
      if (httpRequest.testResults) {
        // The operation has been tested at least one time
        let aggregatedResults = {};
        Object.values(httpRequest.testResults).forEach(serverResults => {
          // For each server which tested the operation
          // @ts-ignore
          serverResults.latencyRecords.forEach(record => {
            // For each record in the record list
            // The transformed date depends on the data displaying selection
            // If it is 'hour' it will convert "2019-07-23T15:32:05.541+02:00" into "2019 07 23 15 00 00"
            let transformedDate = this.transformDateToSelectedDataDisplayingInterval(record.date);
            if (!record.error) {
              if (aggregatedResults[transformedDate]) {
                // If a value has already been set at the desired date, update it
                aggregatedResults[transformedDate].value = (((aggregatedResults[transformedDate].value * aggregatedResults[transformedDate].count) + record.latencyMs) / ++aggregatedResults[transformedDate].count).toFixed(2);
              } else {
                // No value at the desired date, set the value as initial
                aggregatedResults[transformedDate] = {
                  value: record.latencyMs,
                  count: 1
                };
              }
              if (this.meanOfAllRecords[transformedDate]) {
                // If a value has already been set at the desired date, update it
                this.meanOfAllRecords[transformedDate].value = (((this.meanOfAllRecords[transformedDate].value * this.meanOfAllRecords[transformedDate].count) + record.latencyMs) / ++this.meanOfAllRecords[transformedDate].count).toFixed(2);
              } else {
                // No value at the desired date, set the value as initial
                this.meanOfAllRecords[transformedDate] = {
                  value: record.latencyMs,
                  count: 1
                };
              }
            } else {
              // If the record lead to an error, store it in the list of errors
              this.regionOfRequestsError[transformedDate] = {
                errorType: record.errorType,
                code: record.code
              };
            }
          });
        });
        // Store all the operation records in its own attribute
        this.meanOfOperationLatencyByZones[httpRequest.operationId] = aggregatedResults;
      } else {
        // If an operation doesn't have a record, assign an empty object to it
        this.meanOfOperationLatencyByZones[httpRequest.operationId] = {};
      }
    });
  }

  private initializeMeanOfZoneLatencyByOperations() {
    this.meanOfZoneLatencyByOperations = {};
    this.selectedApi.servers.filter(server => server.name).forEach(server => {
      // For each server testing the API
      let aggregatedResults = {};
      this.rawLatencyResults.forEach(httpRequest => {
        // For each operation in the HTTP Request list
        if (httpRequest.testResults) {
          // If the operation has been tested at least one time
          if (httpRequest.testResults[server.name]) {
            // And tested by the desired server
            httpRequest.testResults[server.name].latencyRecords.forEach(record => {
              // Run through the list of records
              if (!record.error) {
                // The transformed date depends on the data displaying selection
                // If it is 'hour' it will convert "2019-07-23T15:32:05.541+02:00" into "2019 07 23 15 00 00"
                let transformedDate = this.transformDateToSelectedDataDisplayingInterval(record.date);
                if (aggregatedResults[transformedDate]) {
                  // If a value has already been set at the desired date, update it
                  aggregatedResults[transformedDate].value = (((aggregatedResults[transformedDate].value * aggregatedResults[transformedDate].count) + record.latencyMs) / ++aggregatedResults[transformedDate].count).toFixed(2);
                } else {
                  // No value at the desired date, set the value as initial
                  aggregatedResults[transformedDate] = {
                    value: record.latencyMs,
                    count: 1
                  };
                }
              }
            });
          }
        }
      });
      // Store all the server records in its own attribute
      this.meanOfZoneLatencyByOperations[server.region] = aggregatedResults;
    });
  }

  /****************************
   * Chart data initialization
   ****************************/

  private initializeChartData() {
    this.initializeOperationTimeByZoneResults();
    this.initializeTimeOperationOverTimeResults();
    this.initializeTimeZoneOverTimeResults();
    this.initializeTimeOperationAndZoneOverTimeAxis();
  }

  /**
   * OperationTimeByZone chart data initialization
   */

  private initializeOperationTimeByZoneResults() {
    this.initializeOperationTimeByZoneData();
    this.initializeOperationTimeByZoneCategories();

    this.emitOperationTimeByZoneToSub();
  }

  private initializeOperationTimeByZoneData() {
    this.operationTimeByZoneData = [];
    this.selectedApi.servers.map(server => {
      if (server.testType === 'latency') {
        // For each latency server that tested the API
        return this.operationTimeByZoneData.push([server.region,
            // Get the list of mean latency of each operation tested by the server
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
      // Get the list of operation id's
      ...this.selectedApi.httpRequests
        .filter(httpRequest => httpRequest.testResults)
        .map(httpRequest => httpRequest.operationId));
  }

  /**
   * TimeOperationOverTime chart data initialization
   */

  private initializeTimeOperationOverTimeResults() {
    this.setTimeOperationOverTimeData();
    this.initializeTimeOperationOverTimeXs();

    this.emitTimeOperationOverTimeToSub();
  }

  private setTimeOperationOverTimeData() {
    this.timeOperationOverTimeData = [];
    if (this.testHasStarted) {
      this.rawLatencyResults.forEach(httpRequest => {
        // For each operation
        if (this.meanOfOperationLatencyByZones[httpRequest.operationId]) {
          // If the operation has been tested and listed
          // TODO SEE LINK TO DOCUMENTATION
          // Set the list of dates for this operation
          this.timeOperationOverTimeData.push([`date${httpRequest.operationId}`, ...Object.keys(this.meanOfOperationLatencyByZones[httpRequest.operationId])]);
          // Set the list of values linked to the date
          // @ts-ignore
          this.timeOperationOverTimeData.push([`${httpRequest.operationId}`, ...Object.values(this.meanOfOperationLatencyByZones[httpRequest.operationId]).map(record => record.value)]);
        }
      });
      // Set the list of date of all the records
      this.timeOperationOverTimeData.push(['dateMean', ...Object.keys(this.meanOfAllRecords)]);
      // Set the list of values linked to the date
      // @ts-ignore
      this.timeOperationOverTimeData.push(['mean', ...Object.values(this.meanOfAllRecords).map(record => record.value)]);
    }
  }

  private initializeTimeOperationOverTimeXs() {
    this.timeOperationOverTimeXs = {};
    this.rawLatencyResults.forEach(httpRequest => {
      // Link each 'operation' with 'dateoperation'
      this.timeOperationOverTimeXs[httpRequest.operationId] = `date${httpRequest.operationId}`;
    });
    this.timeOperationOverTimeXs['mean'] = 'dateMean';
  }

  /**
   * TimeZoneOverTime chart data initialization
   */

  private initializeTimeZoneOverTimeResults() {
    this.setTimeZoneOverTimeData();
    this.initializeTimeZonesOverTimeXs();

    this.emitTimeZonesOverTimeToSub();
  }

  private initializeTimeOperationAndZoneOverTimeAxis() {
    // Depending on the data displaying selection, display the timeline axis a certain format
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
        // For each server configured in the Latency OpenAPITestConfig
        if (this.meanOfZoneLatencyByOperations[serverRegion]) {
          // If this server tested the API
          // Set the list of dates for this server
          this.timeZoneOverTimeData.push([`date${serverRegion}`, ...Object.keys(this.meanOfZoneLatencyByOperations[serverRegion])]);
          // Set the list of values linked to the date
          // @ts-ignore
          this.timeZoneOverTimeData.push([`${serverRegion}`, ...Object.values(this.meanOfZoneLatencyByOperations[serverRegion]).map(record => record.value)]);
        }
      });
      // Set the list of all the records
      this.timeZoneOverTimeData.push(['dateMean', ...Object.keys(this.meanOfAllRecords)]);
      // Set the list of values linked to the date
      // @ts-ignore
      this.timeZoneOverTimeData.push(['mean', ...Object.values(this.meanOfAllRecords).map(record => record.value)]);
    }
  }

  private initializeTimeZonesOverTimeXs() {
    this.timeZoneOverTimeXs = {};
    this.latencyTestConfig.zones.forEach(serverRegion => {
      // Link each 'server' with 'dateserver'
      this.timeZoneOverTimeXs[`${serverRegion}`] = `date${serverRegion}`;
    });
    this.timeZoneOverTimeXs['mean'] = 'dateMean';
  }

  /***********************************************
   * Intermediate variables and chart data update
   ***********************************************/

  private updateAllResultData(newTest: any) {
    this.updateIntermediateVariables(newTest);
    this.updateChartData(newTest);
  }

  /**
   * Intermediate variables update
   */

  private updateIntermediateVariables(newTest: any) {
    this.updateMeanOfRequestsByZones(newTest);
    this.updateMeanOfZoneLatencyByOperations(newTest);
  }

  private updateMeanOfRequestsByZones(newTest: NewLatencyResult) {
    let transformedDate = this.transformDateToSelectedDataDisplayingInterval(newTest.newRecord.date);
    if (!newTest.newRecord.error) {
      if (this.meanOfOperationLatencyByZones[newTest.operationId]) {
        // If the record's operation has already been tested
        let previousValue = this.meanOfOperationLatencyByZones[newTest.operationId][transformedDate];
        if (previousValue) {
          // If the operation has been tested at the same date time
          let recalculatedMean = (previousValue.value * previousValue.count + newTest.newRecord.latencyMs) / ++previousValue.count;
          // Update the value by calculating the new mean
          this.meanOfOperationLatencyByZones[newTest.operationId][transformedDate] = {
            value: recalculatedMean.toFixed(2),
            count: previousValue.count
          };
        } else {
          // The operation hasn't been tested at this date time
          this.meanOfOperationLatencyByZones[newTest.operationId][transformedDate] = {value: newTest.newRecord.latencyMs, count: 1};
        }
      } else {
        // The operation hasn't been tested yet
        this.meanOfOperationLatencyByZones[newTest.operationId][transformedDate] = {value: newTest.newRecord.latencyMs, count: 1};
      }
      this.updateMeanOfAllOperationsFor(transformedDate, newTest);
    }
  }

  private updateMeanOfZoneLatencyByOperations(newTest: NewLatencyResult) {
    let serverRegion = this.selectedApi.servers.find(server => server.name === newTest.serverName).region;
    let transformedDate = this.transformDateToSelectedDataDisplayingInterval(newTest.newRecord.date);
    if (!newTest.newRecord.error) {
      if (this.meanOfZoneLatencyByOperations[serverRegion]) {
        // If the server has already tested the operation
        // let previousValue = Object.keys(this.meanOfZoneLatencyByOperations[serverRegion]).findIndex(time => time === transformedDate) + 1;
        let previousValue = this.meanOfZoneLatencyByOperations[serverRegion][transformedDate];
        if (previousValue) {
          // If the server has already tested the operation at the same date time
          let previousValue = this.meanOfZoneLatencyByOperations[serverRegion][transformedDate];
          let recalculatedMean = (previousValue.value * previousValue.count + newTest.newRecord.latencyMs) / ++previousValue.count;
          // Update the value by calculating the new mean
          this.meanOfZoneLatencyByOperations[serverRegion][transformedDate] = {
            value: recalculatedMean.toFixed(2),
            count: previousValue.count
          };
        } else {
          // The server hasn't tested the operation at this date time
          this.meanOfZoneLatencyByOperations[serverRegion][transformedDate] = {value: newTest.newRecord.latencyMs, count: 1};
        }
      } else {
        // The server hasn't tested the operation yet
        this.meanOfZoneLatencyByOperations[serverRegion][transformedDate] = {value: newTest.newRecord.latencyMs, count: 1};
      }
    }
  }

  private updateChartData(newTest: any) {
    this.updateOperationTimeByZoneResults(newTest);
    this.updateTimeOperationOverTimeResults();
    this.updateTimeZoneOverTimeResults();
    this.setStartingAndEndingTestDate();
  }

  /**
   * OperationTimeByZones chart data update
   */

  private updateOperationTimeByZoneResults(newTest) {
    this.updateOperationTimeByZoneData(newTest);
    this.updateOperationTimeByZoneCategories(newTest);
    this.emitOperationTimeByZoneToSub();
  }

  private updateOperationTimeByZoneCategories(newTest) {
    if (this.operationTimeByZoneCategories.indexOf(newTest.operationId) < 0) {
      // If the operation wasn't tested before, add it to the list of tested operation
      this.operationTimeByZoneCategories.push(newTest.operationId);
    }
  }

  private updateOperationTimeByZoneData(newTest: NewLatencyResult) {
    if (!newTest.newRecord.error) {
      let region = this.selectedApi.servers.filter(server => server.name === newTest.serverName)[0].region;
      if (this.operationTimeByZoneData.some(serverResults => serverResults[0] === region)) {
        // If the operation has already been tested by the server
        this.operationTimeByZoneData = this.operationTimeByZoneData.map(serverResults => {
          if (serverResults[0] === region) {
            // If the server is the same as the desired one, add the new mean latency to the list
            serverResults[newTest.httpRequestIndex + 1] = newTest.testResults[newTest.serverName].meanLatency;
          }
          return serverResults;
        });
      } else {
        // If the server hasn't tested the API yet, create a new array with its name in head and the mean latency in tail
        let serverResult = [region];
        serverResult[newTest.httpRequestIndex + 1] = newTest.testResults[newTest.serverName].meanLatency;
        this.operationTimeByZoneData.push(serverResult);
      }
    }
  }

  private updateMeanOfAllOperationsFor(transformedDate: string, newTest: NewLatencyResult) {
    if (this.meanOfAllRecords[transformedDate]) {
      let previousValue = this.meanOfAllRecords[transformedDate];
      // Recalculate and update the value
      let recalculatedMean = ((previousValue.value * previousValue.count + newTest.newRecord.latencyMs) / ++previousValue.count).toFixed(2);
      this.meanOfAllRecords[transformedDate] = {value: recalculatedMean, count: previousValue.count};
    } else {
      // Any server tested an operation at the desired date
      this.meanOfAllRecords[transformedDate] = {value: newTest.newRecord.latencyMs, count: 1};
    }
  }

  /**
   * TimeOperationOverTime chart data update
   */

  private updateTimeOperationOverTimeResults() {
    this.setTimeOperationOverTimeData();
    this.emitTimeOperationOverTimeToSub();
  }

  /**
   * TimeZoneOverTime chart data update
   */

  private updateTimeZoneOverTimeResults() {
    this.setTimeZoneOverTimeData();
    this.emitTimeZonesOverTimeToSub();
  }

  /***************************
   * Data displaying functions
   ***************************/

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
    // Set all option possibles between the minimum and the maximum
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

  private setStartingAndEndingTestDate() {
    if (this.testHasStarted) {
      console.log(this.selectedApi);
      let allDates = [];
      this.selectedApi.httpRequests.filter(httpRequest => httpRequest.testResults).forEach(httpRequest => {
        // For each operation that has been tested at least once
        // Get all the date time possible
        // @ts-ignore
        Object.values(httpRequest.testResults).forEach(serverResult => serverResult.latencyRecords.forEach(record => allDates.push(DateTime.fromISO(record.date))));
      });
      this.testEndingDateSub.next(DateTime.max(...allDates));
      this.testStartingDateSub.next(DateTime.min(...allDates));
    }
    // this.testStartingDateSub.next(DateTime.min(...this.singleProgressBars.filter(server => server.availability !== 'Test hasn\'t started yet').map(pg => DateTime.fromISO(pg.records[0].startDate))));
    // this.testEndingDateSub.next(DateTime.max(...this.singleProgressBars.filter(server => server.availability !== 'Test hasn\'t started yet').map(pg => DateTime.fromISO(pg.records[pg.records.length - 1].endDate))));
  }

  private hasLatencyTestStarted() {
    return this.selectedApi.servers.filter(server => server.testType === 'latency').some(server => server.status !== 'Creating VM...');
  }


}
