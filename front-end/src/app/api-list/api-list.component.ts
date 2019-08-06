import {Component, OnDestroy, OnInit} from '@angular/core';
import {OpenAPI} from '../models/OpenAPI';
import {APIStatusService} from '../services/api-status.service';
import {Subscription} from 'rxjs';
import {Server} from '../models/server';

@Component({
  selector: 'app-api-list',
  templateUrl: './api-list.component.pug',
  styleUrls: ['./api-list.component.css']
})
export class ApiListComponent implements OnInit, OnDestroy {

  apiList: OpenAPI[];
  selectedApi: OpenAPI;
  selectedServer: Server;

  private apiList$: Subscription;
  private selectedApi$: Subscription;
  private selectedServer$: Subscription;

  constructor(private APIStatus: APIStatusService) {
  }

  ngOnInit() {
    this.apiList$ = this.APIStatus.apiList$.subscribe((apiList) => this.apiList = apiList);
    this.selectedApi$ = this.APIStatus.selectedApi$.subscribe((api) => this.selectedApi = api);
  }

  ngOnDestroy() {
    this.apiList$.unsubscribe();
    this.selectedApi$.unsubscribe();
    this.selectedServer$.unsubscribe();
  }

  isApiSelected(api) {
    if (this.selectedApi) {
      return (api.id === this.selectedApi.id);
    } else {
      return false;
    }
  }
}
