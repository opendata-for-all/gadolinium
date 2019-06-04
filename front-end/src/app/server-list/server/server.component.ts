import {Component, Input, OnInit} from '@angular/core';
import {Server} from '../../models/server';
import {APIStatusService} from '../../api-status.service';

@Component({
  selector: 'app-server',
  templateUrl: './server.component.pug',
  styleUrls: ['./server.component.css']
})
export class ServerComponent implements OnInit {

  @Input() server: Server;
  name: string;
  region: string;
  location: string;
  showCollapse = false;
  status: string;
  progress: number;
  totalProgress: number;
  type: string;

  constructor(private apiService: APIStatusService) {
  }

  ngOnInit() {
    this.name = this.server.name;
    this.region = this.server.region;
    this.location = this.server.location;
    this.status = this.server.status;
    this.progress = this.server.progress;
    this.totalProgress = this.server.totalProgress;
    this.type = this.server.type;
    console.log(this.server);
  }

  serverSelected() {
    this.showCollapse = !this.showCollapse;
    this.apiService.serverSelected(this.name);
  }
}
