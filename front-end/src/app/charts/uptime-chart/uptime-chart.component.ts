import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {APIStatusService} from '../../services/api-status.service';
import {OpenAPI} from '../../models/OpenAPI';

@Component({
  selector: 'app-uptime-chart',
  templateUrl: './uptime-chart.component.pug',
  styleUrls: ['./uptime-chart.component.css']
})
export class UptimeChartComponent implements AfterViewInit {

  @ViewChild('uptimeCanvas') chart: ElementRef;
  private api: OpenAPI;

  constructor(private apiStatusService: APIStatusService) {
    this.apiStatusService.selectedApi$.subscribe(api => this.api = api);
  }

  ngAfterViewInit() {
  }


}
