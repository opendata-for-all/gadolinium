import {Injectable} from '@angular/core';
import {ISO8601Duration, OpenAPI, UpTimeConfig} from '../models/OpenAPI';
import {TestResultsService} from './test-results.service';
import {Subject} from 'rxjs';
import {DateTime} from 'luxon';
import {DonutData, NewUptimeResult, ProgressBarData} from '../models/TestResult';

@Injectable({
  providedIn: 'root'
})
export class UptimeResultsService {
  testHasStarted: boolean;
  private selectedApi: OpenAPI;
  private rawUptimeResults: any;
  private uptimeTestConfig: UpTimeConfig;
  private donutChartDataSub: Subject<DonutData> = new Subject();
  $donutChartData = this.donutChartDataSub.asObservable();

  private multipartProgressBarDataSub: Subject<ProgressBarData> = new Subject();
  $multipartProgressBarData = this.multipartProgressBarDataSub.asObservable();

  private nbTotalTests: number;
  private testDuration: string;

  private donutChartData: any[][];
  private multipartProgressBars: any[];
  private testStartingDateSub: Subject<DateTime> = new Subject();
  $testStartingDate = this.testStartingDateSub.asObservable();
  private testEndingDateSub: Subject<DateTime> = new Subject();
  $testEndingDate = this.testEndingDateSub.asObservable();


  constructor(
    private testResultsService: TestResultsService,
  ) {
    this.initializations();
    this.subscriptions();
  }

  private initializations() {
    this.selectedApi = null;
    this.testHasStarted = false;
    this.multipartProgressBars = [];
  }

  private subscriptions() {
    this.testResultsService.$rawUptimeResults.subscribe(data => {
      if (data.api && (!this.selectedApi || this.selectedApi.id !== data.api.id)) {
        // If the data received contains an API, and if the API is different from the selected one
        // Then the data is not initialized every time an API is clicked on
        this.uptimeTestConfig = data.api.testConfig.uptime;
        this.rawUptimeResults = data.rawUptimeResults;
        this.selectedApi = data.api;
        this.testHasStarted = this.hasUptimeTestStarted();
        this.initializeAllResultData();
      } else if (!data.api) {
        // If there is no API, reset all charts
        this.selectedApi = data.api;
        this.testHasStarted = false;
        this.initializeAllResultData();
      }
      this.selectedApi = data.api;
    });
    this.testResultsService.$newUptimeTestResultSub.subscribe(newTest => {
      if (this.testHasStarted) {
        this.updateAllResultData(newTest);
      } else {
        this.testHasStarted = true;
        this.initializeAllResultData();
        this.updateAllResultData(newTest);
      }
    });
  }

  private initializeAllResultData() {
    if (this.selectedApi) {
      this.initializeDonutData();
      this.donutChartDataSub.next({api: this.selectedApi, chartData: this.donutChartData});
      this.initializeProgressBars();
    } else {
      this.multipartProgressBars = [];
      this.uptimeTestConfig = null;
    }
    this.multipartProgressBarDataSub.next({
      api: this.selectedApi,
      singleProgressBars: this.multipartProgressBars,
      uptimeTestConfig: this.uptimeTestConfig
    });
  }

  private initializeProgressBars() {

    let getRecordingServerInformation = (i) => {
      let serverRegion = this.selectedApi.testConfig.uptime.zones[i];
      return this.selectedApi.servers.filter(server => (server.region === serverRegion) && (server.testType === 'uptime'))[0];
    };

    let recordChecking = (serverName, progressBarServer) => {
      let records = this.rawUptimeResults[serverName];
      let state = records[0].state;
      let startDate = records[0].date;
      let stateLength = 0;
      // Gather the first test information
      for (let j = 0; j < records.length; j++) {
        // For each record
        if (Object.keys(records[j]).length > 0) {
          // If the record object is not an empty object such as " {} ", which means the number of keys is > 0
          if (records[j].state === state) {
            // If the current record state is the same as the last one
            stateLength++;
          } else {
            // If the current state is different from the previous one
            let endDate = records[j].date;
            progressBarServer.records.push({
              state,
              stateLength,
              startDate,
              endDate
            });
            // Gather the date of end of the previous state and push the state in the progress bar array
            state = !state;
            startDate = records[j].date;
            stateLength = 1;
            // Start state record checking again by reinitializing the length to 1, set date of start and the new state (in term of boolean)
          }
          if (j === records.length - 1) {
            // If it is the last record, set the end date and push the state in the progress bar array
            let endDate = records[j].date;
            progressBarServer.records.push({
              state,
              stateLength,
              startDate,
              endDate
            });
          }
        } else {
          progressBarServer.records = [];
        }
      }
    };

    this.multipartProgressBars = [];
    this.nbTotalTests = this.selectedApi.testConfig.uptime.repetitions;
    let nbServers = this.selectedApi.testConfig.uptime.zones.length;
    this.testDuration = new ISO8601Duration(this.selectedApi.testConfig.uptime.interval.iso8601format).durationString();
    if (this.testHasStarted) {
      // If the test has been executed by at least one server
      for (let i = 0; i < nbServers; i++) {
        // For each server testing the uptime of the API
        // Gather server informations
        let uptimeServer = getRecordingServerInformation(i);
        if (this.selectedApi.servers.find(server => server.name === uptimeServer.name).status !== 'Creating VM...') {
        // If the server is not currently being created, it means it is not in its creating state, thus is either in testing or completed state
          let availability = (this.selectedApi.uptimeResults[uptimeServer.name].filter((record) => record.state).length / this.selectedApi.uptimeResults[uptimeServer.name].length * 100).toFixed(2);
          // availability = number of time server being up / number of time the server tested the API * 100
          let progressBarServer = {
            location: uptimeServer.location,
            name: uptimeServer.name,
            availability,
            records: []
          };
          if (this.rawUptimeResults[uptimeServer.name]) {
            recordChecking(uptimeServer.name, progressBarServer);
          }
          this.multipartProgressBars.push(progressBarServer);
        } else {
          // If the server is currently being created, is in its creating state, then the test hasn't started and no record can be found
          this.multipartProgressBars.push({location: uptimeServer.location, name: uptimeServer.name, availability: 'Test hasn\'t started yet', records: []});
        }
      }
      this.setStartingAndEndingTestDate();
    }
  }

  private initializeDonutData() {
    let serverResults = Object.values(this.rawUptimeResults);
    let up = [];
    let down = [];
    serverResults.forEach(serverResult => {
      // @ts-ignore
      serverResult.forEach(record => record.state ? up.push(record.state) : down.push(!record.state));
      // For each record, if it is up, then push to the up array, otherwise push to the down array
    });
    this.donutChartData = [['Available', ...up], ['Down', ...down]];
  }

  private updateAllResultData(newTest) {
    this.updateDonutData(newTest);
    this.donutChartDataSub.next({api: this.selectedApi, chartData: this.donutChartData});
    this.updateProgressBars(newTest);
    this.multipartProgressBarDataSub.next({
      api: this.selectedApi,
      singleProgressBars: this.multipartProgressBars,
      uptimeTestConfig: this.uptimeTestConfig
    });
  }

  private updateDonutData(newTest) {
    this.donutChartData[newTest.isApiUp ? 0 : 1].push(true);
    // If the API was up, then push true in the first array, which is the 'Up' one, otherwise, push it to the second
  }

  private updateProgressBars(newTest: NewUptimeResult) {
    if (this.multipartProgressBars.length > 0) {
      this.multipartProgressBars.forEach(progressBar => {
        if (progressBar.name === newTest.serverName) {
          // If it is the proper progress bar
          if (progressBar.records.length > 0) {
            // If a record had been checked before
            let lastRecord = progressBar.records[progressBar.records.length - 1];
            lastRecord.endDate = newTest.date;
            // Gather the last record information and set its end date as the date of the new record
            if (lastRecord.state === newTest.isApiUp) {
              lastRecord.stateLength++;
              // If the last record state is the same as the new one, then just increment the length of it
            } else {
              progressBar.records.push({
                state: newTest.isApiUp,
                startDate: newTest.date,
                endDate: newTest.date,
                stateLength: 1
              });
              // If the last record state is not the same as the new one, then let the last record as it is and push a new state to the progress bar array with length at 1
            }
          } else {
            progressBar.records.push({
              state: newTest.isApiUp,
              startDate: newTest.date,
              endDate: newTest.date,
              stateLength: 1
            });
            // If there was no initial record, then create one and push it to the progress bar array
          }
        }
        progressBar.availability = (progressBar.records.filter((record) => record.state).length / progressBar.records.length * 100).toFixed(2);
        // Recalculate the availability
      });
    } else {
      this.multipartProgressBars.push({
        name: newTest.serverName,
        records: [{
          state: newTest.isApiUp,
          startDate: newTest.date,
          endDate: newTest.date,
          stateLength: 1
        }]
      });
      // If there was no server previously tested the API, then create a new multipart progress bar with server information and initialize the records with the single one we just received
    }
    this.setStartingAndEndingTestDate();
    // Recalculate the starting and ending date of testing
  }

  private hasUptimeTestStarted() {
    return (Object.keys(this.selectedApi.uptimeResults).length > 0);
  }

  private setStartingAndEndingTestDate() {
    this.testStartingDateSub.next(DateTime.min(...this.multipartProgressBars.filter(server => server.availability !== 'Test hasn\'t started yet').map(pg => DateTime.fromISO(pg.records[0].startDate))));
    // Set the starting date as the MINIMUM between all records dates which belong to a Testing or Completed state server
    this.testEndingDateSub.next(DateTime.max(...this.multipartProgressBars.filter(server => server.availability !== 'Test hasn\'t started yet').map(pg => DateTime.fromISO(pg.records[pg.records.length - 1].endDate))));
    // Set the ending date as the MAXIMUM between all records dates which belong to a Testing or Completed state server
  }
}
