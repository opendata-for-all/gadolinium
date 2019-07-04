import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {SocketIoConfig, SocketIoModule} from 'ngx-socket-io';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {NgbModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {LuxonModule} from 'luxon-angular';

import {AppComponent} from './app.component';
import {APIStatusService} from './services/api-status.service';
import {ApiListComponent} from './api-list/api-list.component';
import {ApiComponent} from './api-list/api/api.component';
import {ServerListComponent} from './server-list/server-list.component';
import {ServerComponent} from './server-list/server/server.component';
import {ApiCollapseComponent} from './api-list/api/api-collapse/api-collapse.component';
import {ServerCollapseComponent} from './server-list/server/server-collapse/server-collapse.component';
import {AddOpenAPITestComponent} from './modals/add-open-apitest/add-open-apitest.component';
import {FileUploadComponent} from './modals/add-open-apitest/file-upload/file-upload.component';
import {FileUploadService} from './modals/add-open-apitest/file-upload/file-upload.service';
import {InputLatencyComponent} from './modals/add-open-apitest/input-latency/input-latency.component';
import {InputUptimeComponent} from './modals/add-open-apitest/input-uptime/input-uptime.component';
import {DurationPickerModule} from 'ngx-duration-picker';
import {InputZoneComponent} from './modals/add-open-apitest/input-zone/input-zone.component';
import {LatencyChartComponent} from './charts/latency-chart/latency-chart.component';
import {UptimeChartComponent} from './charts/uptime-chart/uptime-chart.component';
import {UptimeDonutChartComponent} from './charts/uptime-chart/uptime-donut-chart/uptime-donut-chart.component';
import {UptimeMultipartProgressBarComponent} from './charts/uptime-chart/uptime-multipart-progress-bar/uptime-multipart-progress-bar.component';
import {LatencyOperationsTimeByZonesComponent} from './charts/latency-chart/latency-operations-time-by-zones/latency-operations-time-by-zones.component';
import {LatencyTimeByOperationsOverTimeComponent} from './charts/latency-chart/latency-time-by-operations-over-time/latency-time-by-operations-over-time.component';
import {LatencyTimeByZonesOverTimeComponent} from './charts/latency-chart/latency-time-by-zones-over-time/latency-time-by-zones-over-time.component';

const config: SocketIoConfig = {
  // url: 'localhost:8080', options: {
  url: ':8080/', options: {
    query: {
      token: 'webclient'
    }
  }
};

@NgModule({
  declarations: [
    AppComponent,
    ApiComponent,
    ServerComponent,
    ApiListComponent,
    ServerListComponent,
    ApiCollapseComponent,
    ServerCollapseComponent,
    AddOpenAPITestComponent,
    FileUploadComponent,
    InputLatencyComponent,
    InputUptimeComponent,
    InputZoneComponent,
    LatencyChartComponent,
    UptimeChartComponent,
    UptimeDonutChartComponent,
    UptimeMultipartProgressBarComponent,
    LatencyOperationsTimeByZonesComponent,
    LatencyTimeByOperationsOverTimeComponent,
    LatencyTimeByZonesOverTimeComponent,
  ],
  imports: [
    SocketIoModule.forRoot(config),
    BrowserModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    DurationPickerModule,
    LuxonModule
  ],
  providers: [APIStatusService, FileUploadService, NgbModal],
  bootstrap: [AppComponent],
  entryComponents: [AddOpenAPITestComponent]
})
export class AppModule {
}
