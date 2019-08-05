import {Socket} from 'ngx-socket-io';
import {Injectable} from '@angular/core';
import {OpenAPI} from '../models/OpenAPI';
import {Subject} from 'rxjs';
import {Server} from '../models/server';
import {TestResultsService} from './test-results.service';

@Injectable({
  providedIn: 'root'
})
export class APIStatusService {

  apiList: OpenAPI[];
  private selectedApiId: string;
  private selectedApi: OpenAPI;
  private selectedServer: Server;

  // Contains the list of all the API's
  private apiListSource: Subject<OpenAPI[]> = new Subject();
  apiList$ = this.apiListSource.asObservable();
  // Contains the selected API
  private selectedApiSource: Subject<OpenAPI> = new Subject();
  selectedApi$ = this.selectedApiSource.asObservable();

  constructor(
    private socket: Socket,
    private testResultsService: TestResultsService,
  ) {
    this.socket.emit('hello');
    // @ts-ignore
    this.socket.on('APIStatus', (data) => {
      this.apiListSource.next(data);
      data.map((api) => {
        if (api.id === this.selectedApiId) {
          // Update the selected API with the new API data
          this.selectedApiSource.next(api);
        }
      });
    });
    this.socket.on('LatencyTestUpdate', (data) => {
      let {APIStatus, apiId, serverName, httpRequestIndex, testResults, operationId, newRecord} = data;
      this.apiListSource.next(APIStatus);
      // If an API is selected and if it is the same as the one updated
      if (this.selectedApi && apiId === this.selectedApi.id) {
        this.selectedApiSource.next(APIStatus.filter(api => api.id === this.selectedApi.id)[0]);
        this.testResultsService.newLatencyTestResult({
          serverName,
          httpRequestIndex,
          testResults,
          operationId,
          newRecord
        });
      }
    });
    this.socket.on('UptimeTestUpdate', (data) => {
      let {APIStatus, apiId, serverName, isApiUp, date} = data;
      this.apiListSource.next(APIStatus);
      // If an API is selected and if it is the same as the one updated
      if (this.selectedApi && apiId === this.selectedApi.id) {
        this.selectedApiSource.next(APIStatus.filter(api => api.id === this.selectedApi.id)[0]);
        this.testResultsService.newUptimeTestResult({serverName, isApiUp, date});
      }
    });

    this.selectedApi$.subscribe((api) => {
      this.selectedApi = api;
      if (this.selectedApi) {
        this.selectedApiId = api.id;
      }
    });
    this.apiList$.subscribe((apiList) => this.apiList = apiList);
  }

  apiSelected(apiId: string) {
    let api = this.apiList.filter(api => api.id === apiId)[0];
    this.testResultsService.apiSelected(api);
    this.selectedApiSource.next(api);
  }

  deleteApi(apiId: string) {
    this.selectedApiSource.next(null);
    this.selectedApiId = null;
    this.socket.emit('deleteApi', apiId);
    this.testResultsService.apiSelected(null);
    console.log('OpenAPI deleted');
  }

  getSelectedApi() {
    return this.selectedApi;
  }
}
