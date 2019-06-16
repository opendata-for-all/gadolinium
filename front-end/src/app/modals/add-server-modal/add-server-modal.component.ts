import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {APIStatusService} from '../../services/api-status.service';
import {GCPServer} from '../../models/GCPServer';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-add-server-modal',
  templateUrl: './add-server-modal.component.pug',
  styleUrls: ['./add-server-modal.component.css']
})
export class AddServerModalComponent implements OnInit, OnDestroy {

  addablePlannedTestServers: GCPServer[];
  alreadySelectedServers: GCPServer[];
  alreadySelectedServersSub: Subscription;

  constructor(private apiService: APIStatusService, private modal: NgbActiveModal) {
    this.alreadySelectedServers = [];
    this.addablePlannedTestServers = this.apiService.getAddablePlannedTestServers();
  }

  ngOnInit() {
    this.alreadySelectedServersSub = this.apiService.selectedAddableServers$.subscribe((servers) => this.alreadySelectedServers = servers);
  }

  ngOnDestroy(): void {
    this.alreadySelectedServersSub.unsubscribe();
  }

  serverSelected(server) {
    this.apiService.addableServerSelected(server);
  }

  setClassNames(server) {
    return this.alreadySelectedServers.includes(server);
  }

  createPlannedTestServers() {
    this.apiService.createPlannedTestServers();
    this.modal.close();
  }
}
