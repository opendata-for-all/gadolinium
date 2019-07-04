import {Component, OnDestroy, OnInit} from '@angular/core';
import {Server} from '../models/server';
import {APIStatusService} from '../services/api-status.service';
import {Subscription} from 'rxjs';
import {OpenAPI} from '../models/OpenAPI';

@Component({
  selector: 'app-server-list',
  templateUrl: './server-list.component.pug',
  styleUrls: ['./server-list.component.css']
})
export class ServerListComponent implements OnInit, OnDestroy {

  selectedApi: OpenAPI;
  serverList: Server[];
  selectedServer: Server;

  private selectedApi$: Subscription;
  private selectedServer$: Subscription;

  constructor(private apiService: APIStatusService) {
  }

  ngOnInit() {
    this.selectedApi$ = this.apiService.selectedApi$.subscribe((api) => {
      if (api) {
        this.serverList = api.servers;
      } else {
        this.serverList = [];
      }
    });
    this.selectedServer$ = this.apiService.selectedServer$.subscribe((server) => this.selectedServer = server);
  }

  ngOnDestroy(): void {
    this.selectedServer$.unsubscribe();
  }
}
