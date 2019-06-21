import {AfterViewInit, Component, HostListener, OnDestroy, Renderer2} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FileUploadService} from '../file-upload/file-upload.service';
import {OpenAPITestService} from '../../../services/open-apitest.service';
import {ISO8601Duration, UpTimeConfig} from '../../../models/OpenAPI';

@Component({
  selector: 'app-input-uptime',
  templateUrl: './input-uptime.component.pug',
  styleUrls: ['./input-uptime.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputUptimeComponent,
      multi: true
    }
  ]
})
export class InputUptimeComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {

  isValidFile: boolean = null;
  uptime: UpTimeConfig;
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
      this.uptime.repetitions = parseInt(inputValue);
    } else {
      this.uptime[inputName] = inputValue;
    }
    this.onChange(this.uptime);
    this.uptimeObjectUpdated();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(obj: any): void {
    this.uptime = new UpTimeConfig();
  }

  ngAfterViewInit(): void {
    this.uptime = new UpTimeConfig();
    this.isValidFileSub = this.fileUploadService.$isValidFile.subscribe((isValid) => this.isValidFile = isValid);
  }

  periodChanged() {
    this.uptime.interval = this.period;
    this.uptimeObjectUpdated();
  }

  uptimeObjectUpdated() {
    this.openApiTestService.uptimeSub.next(this.uptime);
    if (this.uptime.repetitions && this.uptime.interval) {
      this.totalDuration = ISO8601Duration.toSeconds(this.uptime.interval.iso8601format) * this.uptime.repetitions * 1000;
    }
  }

  ngOnDestroy(): void {
    this.isValidFileSub.unsubscribe();
  }
}
