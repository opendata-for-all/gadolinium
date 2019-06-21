import {AfterViewInit, Component, ElementRef, OnDestroy, QueryList, Renderer2, ViewChildren} from '@angular/core';
import {GCPServers} from '../../../models/GCPServers';
import {FileUploadService} from '../file-upload/file-upload.service';
import {Subscription} from 'rxjs';
import {OpenAPITestService} from '../../../services/open-apitest.service';
import {GCPServer} from '../../../models/GCPServer';

@Component({
  selector: 'app-input-zone',
  templateUrl: './input-zone.component.pug',
  styleUrls: ['./input-zone.component.css'],
})
export class InputZoneComponent implements AfterViewInit, OnDestroy {

  isValidFile: boolean = false;
  @ViewChildren('latenceServer') latencyServersElements: QueryList<ElementRef>;
  @ViewChildren('latenceServer') uptimeServersElements: QueryList<ElementRef>;
  gcpServers = GCPServers;
  latencyRegionsSelection: GCPServer[] = [];
  uptimeLocationSelection: GCPServer[] = [];
  zones = {
    latency: this.latencyRegionsSelection,
    uptime: this.uptimeLocationSelection
  };
  private isValidFileSub: Subscription;

  constructor(
    private fileUploadService: FileUploadService,
    private openApiTestService: OpenAPITestService,
    private renderer: Renderer2
  ) {
  }

  ngAfterViewInit() {
    this.isValidFile = false;
    this.isValidFileSub = this.fileUploadService.$isValidFile.subscribe((isValid) => this.isValidFile = isValid);
  }

  latencyServerSelected(server: GCPServer) {
    if (this.latencyRegionsSelection.includes(server)) {
      this.latencyRegionsSelection = this.latencyRegionsSelection.filter(lRegion => !(lRegion.region === server.region));
    } else {
      this.latencyRegionsSelection = [...this.latencyRegionsSelection, server];
    }
    this.openApiTestService.latencyServersSub.next(this.latencyRegionsSelection);
  }

  uptimeServerSelected(server: GCPServer) {
    if (this.uptimeLocationSelection.includes(server)) {
      this.uptimeLocationSelection = this.uptimeLocationSelection.filter(uLocation => !(uLocation === server));
    } else {
      this.uptimeLocationSelection = [...this.uptimeLocationSelection, server];
    }
    this.openApiTestService.uptimeServersSub.next(this.uptimeLocationSelection);
  }

  ngOnDestroy(): void {
    this.isValidFileSub.unsubscribe();
  }
}
