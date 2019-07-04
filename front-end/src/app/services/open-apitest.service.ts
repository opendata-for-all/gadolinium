import {Injectable} from '@angular/core';
import {Socket} from 'ngx-socket-io';
import {Subject} from 'rxjs';
import {GCPServer} from '../models/GCPServer';
import {FileUploadService} from '../modals/add-open-apitest/file-upload/file-upload.service';
import {OpenAPITestConfig} from '../models/OpenAPI';

@Injectable({
  providedIn: 'root'
})
export class OpenAPITestService {

  latencyServersSub: Subject<GCPServer[]> = new Subject();
  $latencyServers = this.latencyServersSub.asObservable();
  uptimeServersSub: Subject<GCPServer[]> = new Subject();
  $uptimeServers = this.uptimeServersSub.asObservable();
  latencySub: Subject<any> = new Subject();
  $latency = this.latencySub.asObservable();
  uptimeSub: Subject<any> = new Subject();
  $uptime = this.uptimeSub.asObservable();
  private isFormComplete: boolean = false;
  private isFormCompleteSub: Subject<boolean> = new Subject();
  $isFormComplete = this.isFormCompleteSub.asObservable();
  private latencyServers: GCPServer[];
  private uptimeServers: GCPServer[];
  private latency: {
    repetition: number,
    duration: string,
  };
  private uptime: {
    repetition: number,
    duration: string,
  };

  constructor(
    private socket: Socket,
    private fileUploadService: FileUploadService
  ) {
    this.latency = {
      repetition: null,
      duration: null
    };
    this.uptime = {
      repetition: null,
      duration: null,
    };
    this.latencyServers = [];
    this.uptimeServers = [];
    this.$isFormComplete.subscribe((value) => this.isFormComplete = value);
    this.$latencyServers.subscribe((value => this.latencyServers = value));
    this.$uptimeServers.subscribe((value => this.uptimeServers = value));
    this.$latency.subscribe(latency => {
      this.latency = latency;
      this.checkFormCompletion();
    });
    this.$uptime.subscribe(uptime => {
      this.uptime = uptime;
      this.checkFormCompletion();
    });
  }

  newFormInit() {
    this.isFormCompleteSub.next(false);
  }

  async sendOpenAPIConfiguration(file: File, config: OpenAPITestConfig) {
    let response = await this.fileUploadService.sendFile(file, '/OpenAPI');
    // @ts-ignore
    let apiId = response.apiId;
    config.latency.timeoutThreshold = 5000;
    let openApiTestConfig = {
      apiId: apiId,
      config: config
    };
    console.log(openApiTestConfig);
    openApiTestConfig.config.latency.zones = this.latencyServers.map(server => server.region);
    openApiTestConfig.config.uptime.zones = this.uptimeServers.map(server => server.region);
    this.socket.emit('openApiTestConfig', openApiTestConfig);
    // this.socket.emit('addTestServer', servers);
  }


  checkFormCompletion() {
    let bool = Object.values(this.latency).every(value =>
      (value !== null) && (value !== '0'))
      && Object.values(this.uptime).every(value =>
        (value !== null) && (value !== '0'));
    this.isFormCompleteSub.next(bool);
  }
}
