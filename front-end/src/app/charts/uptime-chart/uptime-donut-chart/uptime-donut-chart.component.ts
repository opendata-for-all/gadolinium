import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import * as c3 from 'c3';
import {OpenAPI} from '../../../models/OpenAPI';
import {APIStatusService} from '../../../services/api-status.service';
import {UptimeResultsService} from '../../../services/uptime-results.service';

@Component({
  selector: 'app-uptime-donut-chart',
  templateUrl: './uptime-donut-chart.component.pug',
  styleUrls: ['./uptime-donut-chart.component.css']
})
export class UptimeDonutChartComponent implements OnDestroy {

  chart: any;

  private selectedApi: OpenAPI;
  private selectedApiSub: Subscription;

  private uptimeResultsSub: Subscription;

  constructor(
    private apiStatusService: APIStatusService,
    private uptimeResultsService: UptimeResultsService,
  ) {
    this.subscriptions();
    this.initializations();
  }

  ngOnDestroy(): void {
    this.uptimeResultsSub.unsubscribe();
  }

  private subscriptions() {
    this.uptimeResultsSub = this.uptimeResultsService.$donutChartData.subscribe(data => {
      if (this.selectedApi && (this.selectedApi.id === data.api.id)) {
        this.updateChart(data.chartData);
      } else {
        this.selectedApi = data.api;
        this.initializeChart(data.chartData);
      }
    });
  }

  private initializations() {
    this.selectedApi = this.apiStatusService.getSelectedApi();
  }

  private initializeChart(data) {
    this.chart = c3.generate({
      bindto: '#uptimeDonutChart',
      data: {
        type: 'donut',
        columns: data,
      },
      donut: {
        title: 'Availability',
      }
    });
  }

  private updateChart(data) {
    this.chart.load({
      columns: data
    });
  }
}
