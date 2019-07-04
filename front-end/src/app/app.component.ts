import {Component} from '@angular/core';
import {Socket} from 'ngx-socket-io';
import {APIStatusService} from './services/api-status.service';
import {OpenAPI} from './models/OpenAPI';
import {Server} from './models/server';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AddOpenAPITestComponent} from './modals/add-open-apitest/add-open-apitest.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.pug',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Gadolinium';
  apiSelected: OpenAPI = null;
  serverSelected: Server = null;

  constructor(private socket: Socket, private apiStatusService: APIStatusService, private modalService: NgbModal) {
    this.apiStatusService.selectedApi$.subscribe((api) => {
      this.apiSelected = api;
    });
    this.apiStatusService.selectedServer$.subscribe((server) => this.serverSelected = server);
  }

  openAddApiModal() {
    this.modalService.open(AddOpenAPITestComponent, {size: 'lg'});
  }

  openAddServerModal() {
  }
}
