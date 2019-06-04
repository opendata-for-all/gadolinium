import {Component, OnDestroy, OnInit} from '@angular/core';
import {Api} from '../models/api';
import {APIStatusService} from '../api-status.service';
import {Subscription} from 'rxjs';
import {Server} from '../models/server';

@Component({
  selector: 'app-api-list',
  templateUrl: './api-list.component.pug',
  styleUrls: ['./api-list.component.css']
})
export class ApiListComponent implements OnInit, OnDestroy {

  apiList: Api[];
  selectedApi: Api;
  selectedServer: Server;

  private apiList$: Subscription;
  private selectedApi$: Subscription;
  private selectedServer$: Subscription;

  constructor(private APIStatus: APIStatusService) {
  }

  ngOnInit() {
    this.apiList$ = this.APIStatus.apiList$.subscribe((apiList) => this.apiList = apiList);
    this.selectedApi$ = this.APIStatus.selectedApi$.subscribe((api) => this.selectedApi = api);
    this.selectedServer$ = this.APIStatus.selectedServer$.subscribe((server) => this.selectedServer = server);
  }

  ngOnDestroy() {
    this.apiList$.unsubscribe();
    this.selectedApi$.unsubscribe();
    this.selectedServer$.unsubscribe();
  }

  isApiSelected(api) {
    return (api === this.selectedApi);
  }
}
