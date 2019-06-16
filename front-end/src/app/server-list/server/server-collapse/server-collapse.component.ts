import {Component, Input, OnInit} from '@angular/core';
import {APIStatusService} from '../../../services/api-status.service';

@Component({
  selector: 'app-server-collapse',
  templateUrl: './server-collapse.component.pug',
  styleUrls: ['./server-collapse.component.css']
})
export class ServerCollapseComponent implements OnInit {

  @Input() show: boolean;
  @Input() serverId: string;

  constructor(private apiService: APIStatusService) {
  }

  ngOnInit() {
  }

  deleteServer() {
    this.apiService.deleteServer();
  }

}
