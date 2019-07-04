import {Socket} from 'ngx-socket-io';
import {Injectable} from '@angular/core';
import {HTTPRequest, OpenAPI} from '../models/OpenAPI';
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
  private latencyResults: { name: string, results: HTTPRequest };
  private uptimeResults: any;

  private apiListSource: Subject<OpenAPI[]> = new Subject();
  apiList$ = this.apiListSource.asObservable();
  private selectedApiSource: Subject<OpenAPI> = new Subject();
  selectedApi$ = this.selectedApiSource.asObservable();
  private selectedServerSource: Subject<Server> = new Subject();
  selectedServer$ = this.selectedServerSource.asObservable();


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
          this.selectedApiSource.next(api);
        }
      });
    });
    this.socket.on('LatencyTestUpdate', (data) => {
      let {APIStatus, apiId, serverName, httpRequestIndex, testResults, operationId, newRecord} = data;
      this.apiListSource.next(APIStatus);
      if (this.selectedApi && apiId === this.selectedApi.id) {
        this.selectedApiSource.next(APIStatus.filter(api => api.id === this.selectedApi.id)[0]);
        this.testResultsService.newLatencyTestResult({serverName, httpRequestIndex, testResults, operationId, newRecord});
      }
    });
    this.socket.on('UptimeTestUpdate', (data) => {
      let {APIStatus, apiId, serverName, isApiUp, date} = data;
      this.apiListSource.next(APIStatus);
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
    this.selectedServer$.subscribe((server) => this.selectedServer = server);
    this.apiList$.subscribe((apiList) => this.apiList = apiList);
  }

  private static extractLatencyResultsFromHTTPRequests(httpRequests: HTTPRequest[]) {
    return httpRequests.map(httpRequest => {
      return {name: httpRequest.operationId, results: httpRequest.testResults};
    });
  }

  serverSelected(serverName: string) {
    console.log('Server ' + serverName + ' selected');
    this.selectedServerSource.next(this.getServerFromServerId(serverName));
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
    this.testResultsService.apiSelected(this.selectedApi);
    console.log('OpenAPI deleted');
  }

  deleteServer() {
    this.socket.emit('deleteServer', {
      name: this.selectedServer.name,
      apiId: this.selectedApi.id,
      zone: this.selectedServer.zone
    });
  }

  private getServerFromServerId(serverName: string) {
    return this.selectedApi.servers.filter((server) => {
      if (server.name === serverName) {
        return server;
      }
    })[0];
  }

  getSelectedApi() {
    return this.selectedApi;
  }
}
