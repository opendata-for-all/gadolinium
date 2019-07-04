import {AfterViewInit, Component} from '@angular/core';
import {APIStatusService} from '../../services/api-status.service';
import {OpenAPI} from '../../models/OpenAPI';
import {UptimeResultsService} from '../../services/uptime-results.service';

@Component({
  selector: 'app-uptime-chart',
  templateUrl: './uptime-chart.component.pug',
  styleUrls: ['./uptime-chart.component.css']
})
export class UptimeChartComponent implements AfterViewInit {

  private api: OpenAPI;

  constructor(
    private apiStatusService: APIStatusService,
    private uptimeResultsService: UptimeResultsService
  ) {
    this.apiStatusService.selectedApi$.subscribe(api => this.api = api);
  }

  ngAfterViewInit() {
  }


}
