import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {APIStatusService} from '../../services/api-status.service';
import {OpenAPI} from '../../models/OpenAPI';
import {LatencyResultsService} from '../../services/latency-results.service';

@Component({
  selector: 'app-latency-chart',
  templateUrl: './latency-chart.component.pug',
  styleUrls: ['./latency-chart.component.css']
})
export class LatencyChartComponent implements OnInit {

  @ViewChild('latencyCanvas') chart: ElementRef;
  private api: OpenAPI;

  constructor(
    private apiStatusService: APIStatusService,
    private latencyResultsService: LatencyResultsService
  ) {

  }

  ngOnInit() {
    this.subscribe();
    // this.chart =
  }

  getDatasets() {
    let datasets = [];
    this.api.servers.map(server => {
      let label = server.regional;
      let data = [];
      this.api.httpRequests.map(httpRequest => {
        // httpRequest.testResults[server.name];
      });

    });
  }

  private subscribe() {
    this.apiStatusService.selectedApi$.subscribe(api => this.api = api);
  }
}
