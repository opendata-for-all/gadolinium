import {Component, OnDestroy, OnInit} from '@angular/core';
import {Server} from '../models/server';
import {APIStatusService} from '../api-status.service';
import {Subscription} from 'rxjs';
import {Api} from '../models/api';

@Component({
  selector: 'app-server-list',
  templateUrl: './server-list.component.pug',
  styleUrls: ['./server-list.component.css']
})
export class ServerListComponent implements OnInit, OnDestroy {

  selectedApi: Api;
  serverList: Server[];
  selectedServer: Server;

  private selectedApi$: Subscription;
  private selectedServer$: Subscription;

  constructor(private apiService: APIStatusService) {
  }

  ngOnInit() {
    this.selectedApi = {id: '', name: '', progress: 0, servers: [], totalProgress: 0};
    this.selectedApi$ = this.apiService.selectedApi$.subscribe((api) => {
      this.serverList = api.servers;
      this.selectedApi = api;
    });
    this.selectedServer$ = this.apiService.selectedServer$.subscribe((server) => this.selectedServer = server);
  }

  ngOnDestroy(): void {
    this.selectedServer$.unsubscribe();
  }
}
