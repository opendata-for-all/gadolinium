import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {SocketIoConfig, SocketIoModule} from 'ngx-socket-io';

import {AppComponent} from './app.component';
import {APIStatusService} from './api-status.service';
import {NgbModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ApiListComponent} from './api-list/api-list.component';
import {ApiComponent} from './api-list/api/api.component';
import {ServerListComponent} from './server-list/server-list.component';
import {ServerComponent} from './server-list/server/server.component';
import {ApiCollapseComponent} from './api-list/api/api-collapse/api-collapse.component';
import {ServerCollapseComponent} from './server-list/server/server-collapse/server-collapse.component';
import {AddApiModalComponent} from './modals/add-api-modal/add-api-modal.component';
import {CreateTestModalComponent} from './modals/create-test-modal/create-test-modal.component';
import {AddServerModalComponent} from './modals/add-server-modal/add-server-modal.component';
import {PerformanceChartComponent} from './charts/performance-chart/performance-chart.component';

const config: SocketIoConfig = {
  // url: 'localhost:8080', options: {
  url: 'localhost:80', options: {
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
    AddApiModalComponent,
    AddServerModalComponent,
    CreateTestModalComponent,
    PerformanceChartComponent,
  ],
  imports: [
    SocketIoModule.forRoot(config),
    BrowserModule,
    NgbModule
  ],
  providers: [APIStatusService, NgbModal],
  bootstrap: [AppComponent],
  entryComponents: [AddApiModalComponent, AddServerModalComponent, CreateTestModalComponent]
})
export class AppModule {
}
