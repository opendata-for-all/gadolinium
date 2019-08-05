import {Component, Input, OnInit} from '@angular/core';
import {Server} from '../../models/server';
import {APIStatusService} from '../../services/api-status.service';

@Component({
  selector: 'app-server',
  templateUrl: './server.component.pug',
  styleUrls: ['./server.component.css']
})
export class ServerComponent {

  @Input() server: Server;
  name: string;
  region: string;
  location: string;
  status: string;
  progress: number;
  totalProgress: number;
  testType: string;
  private executionType: string;

  constructor(private apiService: APIStatusService) {
  }
}
