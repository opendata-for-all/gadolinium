import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Server} from '../../models/server';
import {APIStatusService} from '../../services/api-status.service';
import {Subscription} from 'rxjs';
import {GCPServer} from '../../models/GCPServer';
import {ISO8601Duration, OpenAPI} from '../../models/OpenAPI';

@Component({
  selector: 'app-create-test-modal',
  templateUrl: './create-test-modal.component.pug',
  styleUrls: ['./create-test-modal.component.css']
})
export class CreateTestModalComponent implements OnInit {

  api: OpenAPI;
  testType: string;
  plannedTestServers: Server[];
  gcpServers: GCPServer[];
  alreadySelectedPlannedTestServers: Server[];
  alreadySelectedGCPServers: GCPServer[];

  apiSub: Subscription;
  plannedTestServersSub: Subscription;
  alreadySelectedPlannedTestServersSub: Subscription;
  alreadySelectedGCPServersSub: Subscription;

  constructor(private apiService: APIStatusService, private modal: NgbActiveModal) {
    this.alreadySelectedPlannedTestServers = [];
    this.alreadySelectedGCPServers = [];
    this.plannedTestServers = [];
    this.alreadySelectedPlannedTestServersSub = this.apiService.selectedPlannedTestServers$.subscribe(
      (servers) => this.alreadySelectedPlannedTestServers = servers);
    this.alreadySelectedGCPServersSub = this.apiService.selectedGCPServers$.subscribe(
      (servers) => this.alreadySelectedGCPServers = servers);
    this.plannedTestServersSub = this.apiService.plannedTestServers$.subscribe((servers) => this.plannedTestServers = servers);
    this.apiSub = this.apiService.selectedApi$.subscribe(api => this.api = api);
  }

  ngOnInit() {
    this.gcpServers = this.apiService.getGCPServers();
  }

  plannedTestServerSelected(server: Server) {
    if (this.testType !== 'planned') {
      this.setTestType('planned');
    }
    this.apiService.plannedTestServerSelected(server);
  }

  gcpServerSelected(server: GCPServer) {
    if (this.testType !== 'instant') {
      this.setTestType('instant');
    }
    this.apiService.gcpServerSelected(server);
  }

  setClassNames(server) {
    if (this.testType === 'planned') {
      return this.alreadySelectedPlannedTestServers.includes(server);
    } else if (this.testType === 'instant') {
      return this.alreadySelectedGCPServers.includes(server);
    }
  }

  createTests() {
    if (this.testType === 'planned') {
      this.apiService.createPlannedTest();
    } else if (this.testType === 'instant') {
      this.apiService.createInstantTest();
    }
    this.modal.close();
  }

  get latencyString(): string {
    // @ts-ignore
    return this.api.testConfig.latency.repetitions + ' tests for a period of ' + ISO8601Duration.durationString(this.api.testConfig.latency.interval.iso8601format);
  }

  get uptimeString(): string {
    // @ts-ignore
    return this.api.testConfig.uptime.repetitions + ' tests for a period of ' + ISO8601Duration.durationString(this.api.testConfig.uptime.interval.iso8601format);
  }

  setTestType(type: string) {
    this.testType = type;
  }
}
