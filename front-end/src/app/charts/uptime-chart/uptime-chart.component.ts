import {AfterViewInit, Component} from '@angular/core';
import {APIStatusService} from '../../services/api-status.service';
import {OpenAPI} from '../../models/OpenAPI';
import {UptimeResultsService} from '../../services/uptime-results.service';
import {DateTime, Duration} from 'luxon';

@Component({
  selector: 'app-uptime-chart',
  templateUrl: './uptime-chart.component.pug',
  styleUrls: ['./uptime-chart.component.css']
})
export class UptimeChartComponent implements AfterViewInit {

  private selectedApi: OpenAPI;
  private testStartingDate: DateTime;
  private testEndingDate: DateTime;
  private totalTestDuration: string;

  constructor(
    private apiStatusService: APIStatusService,
    private uptimeResultsService: UptimeResultsService
  ) {
    this.selectedApi = null;
    this.apiStatusService.selectedApi$.subscribe(api => {
      this.selectedApi = api;
      if (this.selectedApi) {
        this.totalTestDuration = Duration.fromMillis(this.selectedApi.testConfig.uptime.repetitions * Duration.fromISO(this.selectedApi.testConfig.uptime.interval.iso8601format).valueOf()).toISO();
      }
    });
    this.uptimeResultsService.$testStartingDate.subscribe(val => this.testStartingDate = val);
    this.uptimeResultsService.$testEndingDate.subscribe(val => this.testEndingDate = val);
  }

  ngAfterViewInit() {
  }


}
