import {Component, Input, OnInit} from '@angular/core';
import {APIStatusService} from '../../../api-status.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CreateTestModalComponent} from '../../../modals/create-test-modal/create-test-modal.component';

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

  deleteApi() {
    this.apiService.deleteApi(this.apiId);
  }

  openCreateTestModal() {
    this.modalService.open(CreateTestModalComponent, {size: 'lg'});
  }
}
