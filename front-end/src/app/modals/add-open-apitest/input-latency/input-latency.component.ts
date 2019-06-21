import {AfterViewInit, Component, HostListener, OnDestroy, Renderer2} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {FileUploadService} from '../file-upload/file-upload.service';
import {Subscription} from 'rxjs';
import {OpenAPITestService} from '../../../services/open-apitest.service';
import {ISO8601Duration, LatencyConfig} from '../../../models/OpenAPI';

@Component({
  selector: 'app-input-latency',
  templateUrl: './input-latency.component.pug',
  styleUrls: ['./input-latency.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputLatencyComponent,
      multi: true
    }
  ]
})

export class InputLatencyComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {

  isValidFile: boolean = false;
  latency: LatencyConfig = new LatencyConfig();
  period: ISO8601Duration = new ISO8601Duration();
  totalDuration: number;
  private onChange: Function;
  private isValidFileSub: Subscription;

  constructor(
    private renderer: Renderer2,
    private fileUploadService: FileUploadService,
    private openApiTestService: OpenAPITestService,
  ) {
  }

  @HostListener('change', ['$event.target.id', '$event.target.value'])
  async valueChanged(inputName: string, inputValue: string) {
    if (inputName === 'repetitions') {
      this.latency.repetitions = parseInt(inputValue);
    } else {
      this.latency[inputName] = inputValue;
    }
    this.onChange(this.latency);
    this.latencyObjectUpdated();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  writeValue(obj: any): void {
    this.latency = new LatencyConfig();
  }

  ngAfterViewInit(): void {
    this.latency = new LatencyConfig();
    this.period = new ISO8601Duration();
    this.isValidFileSub = this.fileUploadService.$isValidFile.subscribe((isValid) => this.isValidFile = isValid);
  }

  periodChanged() {
    this.latency.interval = this.period;
    this.latencyObjectUpdated();
  }

  latencyObjectUpdated() {
    this.openApiTestService.latencySub.next(this.latency);
    if (this.latency.repetitions && this.latency.interval) {
      this.totalDuration = ISO8601Duration.toSeconds(this.latency.interval.iso8601format) * this.latency.repetitions * 1000;
    }
  }

  ngOnDestroy(): void {
    this.isValidFileSub.unsubscribe();
  }


}
