import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {APIStatusService} from '../../api-status.service';
import {Subscription} from 'rxjs';
import {Api} from '../../models/api';

@Component({
  selector: 'app-api',
  templateUrl: './api.component.pug',
  styleUrls: ['./api.component.css']
})
export class ApiComponent implements OnInit, OnDestroy {

  @Input() api: Api;
  id: string;
  name: string;
  progress: number;
  totalProgress: number;
  @Input() show;

  private selectedApi$: Subscription;

  constructor(private APIStatus: APIStatusService) {
  }

  ngOnInit() {
    this.selectedApi$ = this.APIStatus.selectedApi$.subscribe((api) => this.show = (api === this.api));
    this.id = this.api.id;
    this.name = this.api.name;
    this.progress = this.api.progress;
    this.totalProgress = this.api.totalProgress;
  }

  apiSelected() {
    this.APIStatus.apiSelected(this.api);
  }

  ngOnDestroy(): void {
    this.selectedApi$.unsubscribe();
  }

}
