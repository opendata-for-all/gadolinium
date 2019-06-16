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
import {CreateTestModalComponent} from './modals/create-test-modal/create-test-modal.component';
import {AddServerModalComponent} from './modals/add-server-modal/add-server-modal.component';
import {PerformanceChartComponent} from './charts/performance-chart/performance-chart.component';
import {AddOpenAPITestComponent} from './modals/add-open-apitest/add-open-apitest.component';
import {FileUploadComponent} from './modals/add-open-apitest/file-upload/file-upload.component';
import {FileUploadService} from './modals/add-open-apitest/file-upload/file-upload.service';
import {InputLatencyComponent} from './modals/add-open-apitest/input-latency/input-latency.component';
import {InputUptimeComponent} from './modals/add-open-apitest/input-uptime/input-uptime.component';
import {DurationPickerModule} from 'ngx-duration-picker';
import {InputZoneComponent} from './modals/add-open-apitest/input-zone/input-zone.component';

const config: SocketIoConfig = {
  url: 'localhost:8080', options: {
    // url: ':80/', options: {
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
    AddServerModalComponent,
    CreateTestModalComponent,
    PerformanceChartComponent,
    AddOpenAPITestComponent,
    FileUploadComponent,
    InputLatencyComponent,
    InputUptimeComponent,
    InputZoneComponent,
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
  entryComponents: [AddServerModalComponent, CreateTestModalComponent, AddOpenAPITestComponent]
})
export class AppModule {
}
