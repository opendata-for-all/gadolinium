import {Component, OnDestroy, OnInit} from '@angular/core';
import {TestResultsService} from '../../../services/test-results.service';
import {OpenAPI, UpTimeConfig} from '../../../models/OpenAPI';
import {Subscription} from 'rxjs';
import {APIStatusService} from '../../../services/api-status.service';
import {UptimeResultsService} from '../../../services/uptime-results.service';
import {ProgressBarData} from '../../../models/TestResult';
import {DateTime} from 'luxon';

@Component({
  selector: 'app-uptime-multipart-progress-bar',
  templateUrl: './uptime-multipart-progress-bar.component.pug',
  styleUrls: ['./uptime-multipart-progress-bar.component.css']
})
export class UptimeMultipartProgressBarComponent implements OnInit, OnDestroy {

  uptimeTestConfig: UpTimeConfig;
  private selectedApi: OpenAPI;
  private nbTotalTests: number;
  private progressPartWidth: number;
  private singleProgressBars: any[];
  private groupedProgressBar: any[];
  private totalTestDuration: string;
  private testDuration: string;
  private testStartingDate: DateTime;
  private testEndingDate: DateTime;
  private hasTestStarted: boolean;
  private hasTestFinished: boolean;
  private multipartProgressBarDataSub: Subscription;

  constructor(
    private apiStatusService: APIStatusService,
    private testResultsService: TestResultsService,
    private uptimeResultsService: UptimeResultsService
  ) {
  }

  ngOnInit(): void {
    this.subscriptions();
    this.initializations();
  }

  ngOnDestroy(): void {
    this.multipartProgressBarDataSub.unsubscribe();
  }

  private subscriptions() {
    this.multipartProgressBarDataSub = this.uptimeResultsService.$multipartProgressBarData.subscribe((data: ProgressBarData) => {
      console.log(data);
      this.selectedApi = data.api;
      if (this.selectedApi) {
        this.setTestInformations(data);
        this.setProgressBars(data);
      }
    });
  }

  private initializations() {
    this.selectedApi = null;
    this.nbTotalTests = null;
    this.groupedProgressBar = [];
    this.singleProgressBars = [];
    this.singleProgressBars = [];
    this.hasTestStarted = false;
    this.hasTestFinished = false;
  }

  private setProgressBars(data: ProgressBarData) {
    this.singleProgressBars = data.singleProgressBars;
    this.groupedProgressBar = data.groupedProgressBar;
  }

  private setTestInformations(data: ProgressBarData) {
    this.uptimeTestConfig = data.uptimeTestConfig;
    this.testStartingDate = data.testStartingDate;
    this.testEndingDate = data.testEndingDate;
    this.progressPartWidth = 100 / data.api.testConfig.uptime.repetitions;
    this.hasTestStarted = (Object.keys(data.api.uptimeResults).length > 0);
    this.hasTestFinished = data.api.servers.filter(server => server.testType === 'uptime').every(server => server.progress === server.totalProgress);
  }
}
