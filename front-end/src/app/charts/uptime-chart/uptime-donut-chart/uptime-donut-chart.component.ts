import {Component, OnDestroy, OnInit} from '@angular/core';
import {TestResultsService} from '../../../services/test-results.service';
import {Subscription} from 'rxjs';
import * as c3 from 'c3';
import {OpenAPI} from '../../../models/OpenAPI';

@Component({
  selector: 'app-uptime-donut-chart',
  templateUrl: './uptime-donut-chart.component.pug',
  styleUrls: ['./uptime-donut-chart.component.css']
})
export class UptimeDonutChartComponent implements OnInit, OnDestroy {

  chart: any;

  private selectedApi: OpenAPI;
  private selectedApiSub: Subscription;

  private uptimeResults: any;
  private uptimeResultsSub: Subscription;

  constructor(
    private testResultsService: TestResultsService,
  ) {
    this.subscriptions();
    this.initializations();
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.uptimeResultsSub.unsubscribe();
    this.selectedApiSub.unsubscribe();
  }

  private subscriptions() {
    this.uptimeResultsSub = this.testResultsService.$uptimeResults.subscribe(uptimeResults => {
      if (this.uptimeResults === null) {
        this.uptimeResults = uptimeResults;
        console.log(this.uptimeResults);
        this.initializeChart();
      } else {
        this.uptimeResults = uptimeResults;
        this.updateChart();
      }
    });
    this.selectedApiSub = this.testResultsService.selectedApi$.subscribe(api => this.selectedApi = api);
  }

  private initializeChart() {
    this.chart = c3.generate({
      bindto: '#uptimeDonutChart',
      data: {
        type: 'donut',
        columns: this.aggregateUptimeResultsFromAllServers(),
      },
      donut: {
        title: 'Availability of ' + this.selectedApi.name
      }
    });
  }

  private updateChart() {
    this.chart.load({
      columns: this.aggregateUptimeResultsFromAllServers()
    });
  }

  private aggregateUptimeResultsFromAllServers() {
    let uptimeResults = Object.values(this.uptimeResults);
    let up = [];
    let down = [];
    // @ts-ignore
    uptimeResults.map(uptimeResult => uptimeResult.state ? up.push(uptimeResult.state) : down.push(!uptimeResult.state));
    return [['Available', ...up], ['Down', ...down]];
  }

  private initializations() {
    this.selectedApi = null;
    this.uptimeResults = null;
  }
}
