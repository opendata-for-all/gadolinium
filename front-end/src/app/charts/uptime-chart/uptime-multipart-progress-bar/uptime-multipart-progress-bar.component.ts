import {Component, OnDestroy, OnInit} from '@angular/core';
import {TestResultsService} from '../../../services/test-results.service';
import {OpenAPI, UpTimeConfig} from '../../../models/OpenAPI';
import {Subscription} from 'rxjs';
import {APIStatusService} from '../../../services/api-status.service';
import {UptimeResultsService} from '../../../services/uptime-results.service';
import {ProgressBarData} from '../../../models/TestResult';
import {DateTime, Duration} from 'luxon';

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
  private testStartingDate: DateTime;
  private testEndingDate: DateTime;
  private hasTestStarted: boolean;
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
      this.selectedApi = data.api;
      if (this.selectedApi) {
        console.log(data);
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
  }

  private setProgressBars(data: ProgressBarData) {
    this.singleProgressBars = data.singleProgressBars;
    this.groupedProgressBar = data.groupedProgressBar;
  }

  private setTestInformations(data: ProgressBarData) {
    this.uptimeTestConfig = data.uptimeTestConfig;
    this.testStartingDate = data.testStartingDate;
    this.testEndingDate = data.testEndingDate;
    this.totalTestDuration = Duration.fromMillis(this.uptimeTestConfig.repetitions * Duration.fromISO(this.uptimeTestConfig.interval.iso8601format).valueOf()).toISO();
    this.progressPartWidth = 100 / data.api.testConfig.uptime.repetitions;
    this.hasTestStarted = (Object.keys(data.api.uptimeResults).length > 0);
  }
}
