import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {APIStatusService} from '../../services/api-status.service';
import {OpenAPI} from '../../models/OpenAPI';
import {LatencyResultsService} from '../../services/latency-results.service';
import {DateTime, Duration} from 'luxon';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-latency-chart',
  templateUrl: './latency-chart.component.pug',
  styleUrls: ['./latency-chart.component.css']
})
export class LatencyChartComponent implements OnInit, OnDestroy {

  @ViewChild('latencyCanvas') chart: ElementRef;
  private selectedApi: OpenAPI;
  private selectedApiSub: Subscription;
  private testStartingDate: DateTime;
  private testEndingDate: DateTime;
  private totalTestDuration: string;
  private selectedDataDisplayingInterval: string;
  private selectedDataDisplayingIntervalSub: Subscription;
  private dataDisplayingIntervalOptionsSub: Subscription;
  private dataDisplayingIntervalOptions: string[];

  constructor(
    private apiStatusService: APIStatusService,
    private latencyResultsService: LatencyResultsService
  ) {
    this.selectedApi = null;
    this.apiStatusService.selectedApi$.subscribe(api => {
      this.selectedApi = api;
      if (this.selectedApi) {
        this.totalTestDuration = Duration.fromMillis(this.selectedApi.testConfig.latency.repetitions * Duration.fromISO(this.selectedApi.testConfig.latency.interval.iso8601format).valueOf()).toISO();
      }
    });
    this.latencyResultsService.$testStartingDate.subscribe(val => this.testStartingDate = val);
    this.latencyResultsService.$testEndingDate.subscribe(val => this.testEndingDate = val);
  }

  ngOnInit() {
    this.subscribe();
  }

  private subscribe() {
    this.selectedApiSub = this.apiStatusService.selectedApi$.subscribe(api => this.selectedApi = api);
    this.selectedDataDisplayingIntervalSub = this.latencyResultsService.$dataDisplayingSelection.subscribe(data => this.selectedDataDisplayingInterval = data);
    this.dataDisplayingIntervalOptionsSub = this.latencyResultsService.$dataDisplayingIntervalOptions.subscribe(data => this.dataDisplayingIntervalOptions = data)
  }

  selectedDataDisplayingIntervalChanged(option: string) {
    this.latencyResultsService.dataDisplayingSelectionSub.next(option);
  }

  ngOnDestroy(): void {
    this.selectedApiSub.unsubscribe();
  }
}
