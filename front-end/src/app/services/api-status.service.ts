import {Socket} from 'ngx-socket-io';
import {Injectable} from '@angular/core';
import {OpenAPI} from '../models/OpenAPI';
import {Subject} from 'rxjs';
import {Server} from '../models/server';
import {GCPServers} from '../models/GCPServers';
import {GCPServer} from '../models/GCPServer';

@Injectable({
  providedIn: 'root'
})
export class APIStatusService {

  private apiList: OpenAPI[];
  private selectedApiId: string;
  private selectedApi: OpenAPI;
  private selectedServer: Server;
  private selectedAddableServers: GCPServer[];
  private plannedTestServers: Server[];
  private instantTestServers: Server[];
  private selectedPlannedTestServers: Server[];
  private selectedGCPServers: GCPServer[];

  private apiListSource: Subject<OpenAPI[]> = new Subject();
  apiList$ = this.apiListSource.asObservable();
  private selectedApiSource: Subject<OpenAPI> = new Subject();
  selectedApi$ = this.selectedApiSource.asObservable();
  private selectedServerSource: Subject<Server> = new Subject();
  selectedServer$ = this.selectedServerSource.asObservable();
  private selectedAddableServerSource: Subject<GCPServer[]> = new Subject();
  selectedAddableServers$ = this.selectedAddableServerSource.asObservable();
  private plannedTestServersSource: Subject<Server[]> = new Subject();
  plannedTestServers$ = this.plannedTestServersSource.asObservable();
  private instantTestServersSource: Subject<Server[]> = new Subject();
  instantTestServers$ = this.instantTestServersSource.asObservable();
  private selectedPlannedTestServersSource: Subject<Server[]> = new Subject();
  selectedPlannedTestServers$ = this.selectedPlannedTestServersSource.asObservable();
  private selectedGCPServersSource: Subject<GCPServer[]> = new Subject();
  selectedGCPServers$ = this.selectedGCPServersSource.asObservable();
  private addableGCPServers = GCPServers;

  constructor(private socket: Socket) {
    this.selectedAddableServers = [];
    this.selectedPlannedTestServers = [];
    this.selectedGCPServers = [];
    this.socket.emit('hello');
    // @ts-ignore
    this.socket.on('APIStatus', (data) => {
      console.log(data);
      this.apiList = data;
      this.apiListSource.next(data);
      data.map((api) => {
        if (api.id === this.selectedApiId) {
          this.selectedApiSource.next(api);
        }
      });
    });
    this.selectedApi$.subscribe((api) => {
      this.selectedApi = api;
      this.selectedApiId = api.id;
      this.plannedTestServersSource.next(
        this.selectedApi.servers.filter((server) => (server.type === 'planned') && (server.status === 'Waiting for tests')));
      this.instantTestServersSource.next(
        this.selectedApi.servers.filter((server) => server.type === 'instant'));
    });
    this.selectedServer$.subscribe((server) => this.selectedServer = server);
    this.selectedAddableServers$.subscribe((servers) => this.selectedAddableServers = servers);
    this.plannedTestServers$.subscribe((servers) => this.plannedTestServers = servers);
    this.instantTestServers$.subscribe((servers) => this.instantTestServers = servers);
    this.selectedGCPServers$.subscribe((servers) => this.selectedGCPServers = servers);
  }

  apiSelected(api: OpenAPI) {
    this.selectedApiSource.next(api);
  }

  serverSelected(serverName: string) {
    console.log('Server ' + serverName + ' selected');
    this.selectedServerSource.next(this.getServerFromServerId(serverName));
  }

  deleteApi(apiId: string) {
    // this.selectedApiSource.next(null);
    this.socket.emit('deleteApi', apiId);
    console.log('OpenAPI deleted');
  }

  deleteServer() {
    this.socket.emit('deleteServer', {
      serverName: this.selectedServer.name,
      apiId: this.selectedApi.id,
      zone: this.selectedServer.zone
    });
  }

  getAddablePlannedTestServers() {
    const gcpRegions = this.addableGCPServers.map((server) => server.region);
    const selectedApiRegions = this.selectedApi.servers.map((server) => server.region);
    return this.addableGCPServers.filter((server) => !selectedApiRegions.includes(server.region));
  }

  getGCPServers() {
    return this.addableGCPServers;
  }

  addableServerSelected(server: GCPServer) {
    if (!this.selectedAddableServers.includes(server)) {
      this.selectedAddableServerSource.next([...this.selectedAddableServers, server]);
    } else {
      this.selectedAddableServerSource.next(this.selectedAddableServers.filter((addedServer) => !(addedServer === server)));
    }
  }

  plannedTestServerSelected(server: Server) {
    if (!this.selectedPlannedTestServers.includes(server)) {
      this.selectedPlannedTestServersSource.next([...this.selectedPlannedTestServers, server]);
    } else {
      this.selectedPlannedTestServersSource.next(this.selectedPlannedTestServers.filter((addedServer) => !(addedServer === server)));
    }
  }

  createPlannedTestServers() {
    const data = {
      apiId: this.selectedApi.id,
      regions: this.selectedAddableServers.map((server) => server.region),
      type: 'planned'
    };
    this.socket.emit('addTestServer', data);
    this.selectedAddableServerSource.next([]);
  }

  createPlannedTest() {
    const data = {};
  }

  gcpServerSelected(server: GCPServer) {
    if (!this.selectedGCPServers.includes(server)) {
      this.selectedGCPServersSource.next([...this.selectedGCPServers, server]);
    } else {
      this.selectedGCPServersSource.next(this.selectedGCPServers.filter((addedServer) => !(addedServer === server)));
    }
  }

  createInstantTest() {
    const data = {
      apiId: this.selectedApi.id,
      regions: this.selectedGCPServers.map((server) => server.region),
      type: 'instant'
    };
    this.socket.emit('addTestServer', data);
  }

  private getServerFromServerId(serverName: string) {
    return this.selectedApi.servers.filter((server) => {
      if (server.name === serverName) {
        return server;
      }
    })[0];
  }
}
