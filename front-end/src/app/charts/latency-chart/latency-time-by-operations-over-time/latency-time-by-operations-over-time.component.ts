import {Component, OnDestroy} from '@angular/core';
import {OpenAPI} from '../../../models/OpenAPI';
import {Subscription} from 'rxjs';
import * as c3 from 'c3';
import {APIStatusService} from '../../../services/api-status.service';
import {LatencyResultsService} from '../../../services/latency-results.service';

@Component({
  selector: 'app-latency-time-by-operations-over-time',
  templateUrl: './latency-time-by-operations-over-time.component.pug',
  styleUrls: ['./latency-time-by-operations-over-time.component.css']
})
export class LatencyTimeByOperationsOverTimeComponent implements OnDestroy {

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
    this.latencyResultsSub = this.latencyResultsService.$timeOperationOverTime.subscribe(data => {
      if (this.selectedApi && (this.selectedApi.id === data.api.id)) {
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
    this.testHaveStarted = false;
    this.dataDisplayingIntervalOptions = [];
  }

  private initializeChart(data) {
    console.log(data);
    this.chart = c3.generate({
      bindto: '#latencyTimeByOperationsOverTimeChart',
      data: {
        // xs: this.getDataAxisRelationObject(),
        xs: data.xs,
        xFormat: '%Y %m %d %H %M %S',
        // columns: this.getOperationAndTimeData(),
        columns: data.columns,
        type: 'line',
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            rotate: -60,
            multiline: false,
            // format: this.getAxisFormatFromSelectedDataDisplayingInterval()
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
      },
      // regions : [{
      //   axis : 'x', start: '2019 07 02 16 47 00', end: '2019 07 02 16 57 00', class: 'testRegion', opacity: 0.1
      // }]
    });

    // d3.selectAll(".testRegion")
    //   .append("text")
    //   .text("Some Text")
    //   .style("fill-opacity", 1)
    //   .attr("text-anchor", "start")
  }

  private updateChart(data) {
    this.chart.load({
      xs: data.xs,
      columns: data.columns,
      axis: {
        x: {
          tick: {
            format: data.axis,
          }
        }
      }
    });
  }
}
