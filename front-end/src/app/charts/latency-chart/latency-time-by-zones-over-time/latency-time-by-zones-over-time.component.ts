import {Component, OnDestroy, OnInit} from '@angular/core';
import {OpenAPI} from '../../../models/OpenAPI';
import {Subscription} from 'rxjs';
import * as c3 from 'c3';
import {APIStatusService} from '../../../services/api-status.service';
import {LatencyResultsService} from '../../../services/latency-results.service';

@Component({
  selector: 'app-latency-time-by-zones-over-time',
  templateUrl: './latency-time-by-zones-over-time.component.pug',
  styleUrls: ['./latency-time-by-zones-over-time.component.css']
})
export class LatencyTimeByZonesOverTimeComponent implements OnDestroy{

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

  selectedDataDisplayingIntervalChanged(option: string) {
    this.latencyResultsService.dataDisplayingSelectionSub.next(option);
  }

  ngOnDestroy(): void {
    this.latencyResultsSub.unsubscribe();
    this.selectedApiSub.unsubscribe();
  }

  private subscriptions() {
    this.latencyResultsSub = this.latencyResultsService.$timeZonesOverTime.subscribe(data => {
      if (data.api && (this.selectedApi && (this.selectedApi.id === data.api.id))) {
        this.updateChart(data);
      } else {
        this.selectedApi = data.api;
        this.dataDisplayingIntervalOptions = data.dataDisplayingIntervalOptions;
        this.initializeChart(data);
      }
    });
  }

  private initializations() {
    this.selectedApi = this.apiStatusService.getSelectedApi();
  }

  private initializeChart(data) {
    this.chart = c3.generate({
      bindto: '#latencyTimeByZonesOverTimeChart',
      data: {
        xs: data.xs,
        xFormat: '%Y %m %d %H %M %S',
        columns: data.columns,
        type: 'line',
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            rotate: -60,
            multiline: false,
            format: data.axis
          }
        },
        y: {
          label: 'Latency in ms',
          tick: {
            format: function(d) {
              return d + ' ms';
            }
          }
        }
      },
      grid: {
        y: {
          lines: [{value: 0}]
        }
      },
      point: {
        show: false
      }
    });
  }

  private updateChart(data) {
    this.chart.load({
      columns: data.columns,
      categories: data.categories
    });
  }
}
