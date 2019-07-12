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
  private singleProgressBars: any[];
  private groupedProgressBar: any[];
  private testStartingDate: DateTime;
  private testStartingDateSub: Subject<DateTime> = new Subject();
  $testStartingDate = this.testStartingDateSub.asObservable();
  private testEndingDate: DateTime;
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
    this.groupedProgressBar = [];
    this.singleProgressBars = [];
  }

  private subscriptions() {
    this.testResultsService.$rawUptimeResults.subscribe(data => {
      if (data.api && (!this.selectedApi || this.selectedApi.id !== data.api.id)) {
        this.uptimeTestConfig = data.api.testConfig.uptime;
        this.rawUptimeResults = data.rawUptimeResults;
        this.selectedApi = data.api;
        this.testHasStarted = this.hasUptimeTestStarted();
        this.initializeAllResultData();
      } else if (!data.api) {
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
      this.singleProgressBars = [];
      this.groupedProgressBar = [];
      this.testEndingDate = null;
      this.testStartingDate = null;
      this.uptimeTestConfig = null;
    }
    this.multipartProgressBarDataSub.next({
      api: this.selectedApi,
      singleProgressBars: this.singleProgressBars,
      groupedProgressBar: this.groupedProgressBar,
      testEndingDate: this.testEndingDate,
      testStartingDate: this.testStartingDate,
      uptimeTestConfig: this.uptimeTestConfig
    });
  }

  private initializeProgressBars() {
    this.singleProgressBars = [];
    this.groupedProgressBar = [];
    this.nbTotalTests = this.selectedApi.testConfig.uptime.repetitions;
    let nbServers = this.selectedApi.testConfig.uptime.zones.length;
    this.testDuration = new ISO8601Duration(this.selectedApi.testConfig.uptime.interval.iso8601format).durationString();
    // this.totalTestDuration = new ISO8601Duration(Duration.fromMillis(Duration.fromISO(this.selectedApi.testConfig.uptime.interval.iso8601format).valueOf() * this.nbTotalTests).normalize().toISO()).durationString();
    if (this.testHasStarted) {
      for (let i = 0; i < nbServers; i++) {
        let serverRegion = this.selectedApi.testConfig.uptime.zones[i];
        let server = this.selectedApi.servers.filter(server => (server.region === serverRegion) && (server.testType === 'uptime'))[0];
        let serverLocation = server.location;
        let serverName = server.name;
        if (this.selectedApi.servers.find(server => server.name === serverName).status !== 'Creating VM...') {
          // let serverName = Object.keys(this.uptimeResults)[i];
          let availability = (this.selectedApi.uptimeResults[serverName].filter((record) => record.state).length / this.selectedApi.uptimeResults[serverName].length * 100).toFixed(2);
          let progressBarServer = {
            location: serverLocation,
            name: serverName,
            availability,
            records: []
          };
          if (this.rawUptimeResults[serverName]) {
            let records = this.rawUptimeResults[serverName];
            let state = records[0].state;
            let startDate = records[0].date;
            let stateLength = 0;
            for (let j = 0; j < records.length; j++) {
              if (Object.keys(records[j]).length > 0) {
                if (records[j].state === state) {
                  stateLength++;
                } else {
                  let endDate = records[j].date;
                  progressBarServer.records.push({
                    state,
                    stateLength,
                    startDate,
                    endDate
                  });
                  state = !state;
                  startDate = records[j].date;
                  stateLength = 1;
                }
                if (j === records.length - 1) {
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
          }
          this.singleProgressBars.push(progressBarServer);
        } else {
          this.singleProgressBars.push({location: serverLocation, name: serverName, availability: 'Test hasn\'t started yet', records: []});
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
      serverResult.map(result => result.state ? up.push(result.state) : down.push(!result.state));
    });
    this.donutChartData = [['Available', ...up], ['Down', ...down]];
  }

  private updateAllResultData(newTest) {
    this.updateDonutData(newTest);
    this.donutChartDataSub.next({api: this.selectedApi, chartData: this.donutChartData});
    this.updateProgressBars(newTest);
    this.multipartProgressBarDataSub.next({
      api: this.selectedApi,
      groupedProgressBar: this.groupedProgressBar,
      singleProgressBars: this.singleProgressBars,
      testEndingDate: this.testEndingDate,
      testStartingDate: this.testStartingDate,
      uptimeTestConfig: this.uptimeTestConfig
    });
  }

  private updateDonutData(newTest) {
    this.donutChartData[newTest.isApiUp ? 0 : 1].push(true);
  }

  private updateProgressBars(newTest: NewUptimeResult) {
    if (this.singleProgressBars.length > 0) {
      this.singleProgressBars.forEach(singleProgressBar => {
        if (singleProgressBar.name === newTest.serverName) {
          if (singleProgressBar.records.length > 0) {
            let lastRecord = singleProgressBar.records[singleProgressBar.records.length - 1];
            lastRecord.endDate = newTest.date;
            if (lastRecord.state === newTest.isApiUp) {
              lastRecord.stateLength++;
            } else {
              singleProgressBar.records.push({
                state: newTest.isApiUp,
                startDate: newTest.date,
                endDate: newTest.date,
                stateLength: 1
              });
            }
          } else {
            singleProgressBar.records.push({
              state: newTest.isApiUp,
              startDate: newTest.date,
              endDate: newTest.date,
              stateLength: 1
            });
          }
        }
        singleProgressBar.availability = (singleProgressBar.records.filter((record) => record.state).length / singleProgressBar.records.length * 100).toFixed(2);
      });
    } else {
      this.singleProgressBars.push({
        name: newTest.serverName,
        records: [{
          state: newTest.isApiUp,
          startDate: newTest.date,
          endDate: newTest.date,
          stateLength: 1
        }]
      });
    }
    this.setStartingAndEndingTestDate();
  }

  private hasUptimeTestStarted() {
    return (Object.keys(this.selectedApi.uptimeResults).length > 0);
  }

  private setStartingAndEndingTestDate() {
    this.testStartingDateSub.next(DateTime.min(...this.singleProgressBars.filter(server => server.availability !== 'Test hasn\'t started yet').map(pg => DateTime.fromISO(pg.records[0].startDate))));
    this.testEndingDateSub.next(DateTime.max(...this.singleProgressBars.filter(server => server.availability !== 'Test hasn\'t started yet').map(pg => DateTime.fromISO(pg.records[pg.records.length - 1].endDate))));
  }
}
