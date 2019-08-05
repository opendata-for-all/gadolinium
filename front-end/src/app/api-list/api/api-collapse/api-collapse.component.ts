import {Component, Input, OnInit} from '@angular/core';
import {APIStatusService} from '../../../services/api-status.service';

@Component({
  selector: 'app-api-collapse',
  templateUrl: './api-collapse.component.pug',
  styleUrls: ['./api-collapse.component.css']
})
export class ApiCollapseComponent implements OnInit {

  @Input() apiId: string;
  @Input() apiTestIsFinished: boolean;
  @Input() show: boolean;

  constructor(
    private apiService: APIStatusService,
  ) {
  }

  ngOnInit() {
  }

  deleteApi($event: MouseEvent) {
    $event.stopPropagation();
    this.apiService.deleteApi(this.apiId);
  }
}
