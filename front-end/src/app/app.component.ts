import {Component} from '@angular/core';
import {Socket} from 'ngx-socket-io';
import {APIStatusService} from './api-status.service';
import {Api} from './models/api';
import {Server} from './models/server';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AddApiModalComponent} from './modals/add-api-modal/add-api-modal.component';
import {AddServerModalComponent} from './modals/add-server-modal/add-server-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.pug',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Gadolinium';
  apiSelected: Api = null;
  serverSelected: Server = null;

  constructor(private socket: Socket, private apiStatusService: APIStatusService, private modalService: NgbModal) {
    this.apiStatusService.selectedApi$.subscribe((api) => this.apiSelected = api);
    this.apiStatusService.selectedServer$.subscribe((server) => this.serverSelected = server);
  }


  openAddApiModal() {
    this.modalService.open(AddApiModalComponent, {size: 'lg'});
  }

  openAddServerModal() {
    this.modalService.open(AddServerModalComponent, {size: 'lg'});
  }
}
