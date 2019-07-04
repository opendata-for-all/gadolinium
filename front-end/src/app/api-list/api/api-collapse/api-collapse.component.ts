import {Component, Input, OnInit} from '@angular/core';
import {APIStatusService} from '../../../services/api-status.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-api-collapse',
  templateUrl: './api-collapse.component.pug',
  styleUrls: ['./api-collapse.component.css']
})
export class ApiCollapseComponent implements OnInit {

  @Input() apiId: string;
  @Input() show: boolean;

  constructor(private apiService: APIStatusService, private modalService: NgbModal) {
  }

  ngOnInit() {
  }

  deleteApi($event: MouseEvent) {
    $event.stopPropagation();
    this.apiService.deleteApi(this.apiId);
  }

  openCreateTestModal() {
  }
}
