import {Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {FileUploadService} from './file-upload.service';
import {Subscription} from 'rxjs';
import {FileValidityColors} from '../../../models/colors';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FileUploadComponent,
      multi: true
    }
  ]
})
export class FileUploadComponent implements OnInit, OnDestroy, ControlValueAccessor {

  onChange: Function;
  isValid: boolean;
  @ViewChild('span') span: ElementRef;
  @ViewChild('label') label: ElementRef;
  @ViewChild('input') input: ElementRef;
  private file: File | null = null;
  private isValidSub: Subscription;

  constructor(
    private host: ElementRef<HTMLInputElement>,
    private fileUploadService: FileUploadService,
    private renderer: Renderer2
  ) {
  }

  @HostListener('change', ['$event.target.files'])
  async emitFiles(event: FileList) {
    const file = event && event.item(0);
    this.onChange(file);
    await this.getValidationOfFile(file);
    this.file = file;
  }

  ngOnInit() {
    this.isValidSub = this.fileUploadService.$isValidFile.subscribe((isValid) => {
      if (isValid !== null) {
        this.setElementValidityStyle(isValid);
      }
    });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
    console.log('It changed');
  }

  registerOnTouched(fn: any): void {
  }

  writeValue(obj: any): void {
    this.host.nativeElement.value = '';
    this.file = null;
  }

  async getValidationOfFile(file: File) {
    this.fileUploadService.setValidFileValue(await this.fileUploadService.getValidationOfOpenAPIJsonFile(file));
  }

  ngOnDestroy(): void {
    this.isValidSub.unsubscribe();
  }

  private setElementValidityStyle(isValid: boolean) {
    if (isValid) {
      console.log(this.span.nativeElement);
      this.span.nativeElement.textContent = 'The file is correct';
      this.renderer.setStyle(this.span.nativeElement, 'background-color', FileValidityColors.isValid.background.dark);
      this.renderer.setStyle(this.span.nativeElement, 'color', FileValidityColors.isValid.text.dark);
      this.renderer.setStyle(this.label.nativeElement, 'background-color', FileValidityColors.isValid.background.light);
      this.renderer.setStyle(this.label.nativeElement, 'color', FileValidityColors.isValid.text.light);
    } else {
      this.span.nativeElement.textContent = 'The file is incorrect';
      this.renderer.setStyle(this.span.nativeElement, 'background-color', FileValidityColors.notValid.background.dark);
      this.renderer.setStyle(this.span.nativeElement, 'color', FileValidityColors.notValid.text.dark);
      this.renderer.setStyle(this.label.nativeElement, 'background-color', FileValidityColors.notValid.background.light);
      this.renderer.setStyle(this.label.nativeElement, 'color', FileValidityColors.notValid.text.light);
    }
  }

}


