import {Component, OnDestroy} from '@angular/core';
import {OpenAPI} from '../../../models/OpenAPI';
import {Subscription} from 'rxjs';
import * as c3 from 'c3';
import {APIStatusService} from '../../../services/api-status.service';
import {LatencyResultsService} from '../../../services/latency-results.service';

@Component({
  selector: 'app-latency-operations-time-by-zones',
  templateUrl: './latency-operations-time-by-zones.component.pug',
  styleUrls: ['./latency-operations-time-by-zones.component.css']
})
export class LatencyOperationsTimeByZonesComponent implements OnDestroy {

  chart: any;

  private selectedApi: OpenAPI;
  private selectedApiSub: Subscription;

  private latencyResultsSub: Subscription;

  private selectedDataDisplayingInterval: string;

  private testHaveStarted: boolean;
  private dataDisplayingIntervalOptions: string[];

  constructor(
    private apiStatusService: APIStatusService,
    private latencyResultsService: LatencyResultsService,
  ) {
    this.subscriptions();
    this.initializations();
  }

  ngOnDestroy(): void {
    this.latencyResultsSub.unsubscribe();
  }

  private subscriptions() {
    this.latencyResultsSub = this.latencyResultsService.$operationTimeByZone.subscribe(data => {
      if (this.selectedApi && (this.selectedApi.id === data.api.id)) {
        this.updateChart(data);
      } else {
        this.selectedApi = data.api;
        this.initializeChart(data);
      }
    });
  }

  private initializations() {
    this.selectedApi = this.apiStatusService.getSelectedApi();
  }

  private initializeChart(data) {
    console.log(data);
    this.chart = c3.generate({
      bindto: '#latencyOperationsTimeByZonesChart',
      data: {
        columns: data.columns,
        type: 'bar',
      },
      axis: {
        x: {
          type: 'category',
          tick: {
            rotate: -60,
            multiline: false
          },
          categories: data.categories
        }
      },
      grid: {
        y: {
          lines: [{value: 0}]
        }
      }
    });
  }

  private updateChart(data) {
    console.log(data);
    this.chart.load({
      columns: data.columns,
      categories: data.categories
    });
  }
}
