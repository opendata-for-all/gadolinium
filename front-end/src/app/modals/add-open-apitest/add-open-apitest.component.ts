import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FileUploadService} from './file-upload/file-upload.service';
import {OpenAPITestService} from '../../services/open-apitest.service';
import {Subscription} from 'rxjs';
import {FileValidityColors} from '../../models/colors';

@Component({
  selector: 'app-add-open-apitest',
  templateUrl: './add-open-apitest.component.pug',
  styleUrls: ['./add-open-apitest.component.css']
})
export class AddOpenAPITestComponent implements OnInit, OnDestroy, AfterViewInit {

  openApiForm: FormGroup;

  isValidFile: boolean = null;
  isFormComplete: boolean;
  @ViewChild('modalSubmit') modalSubmitButton: ElementRef;
  private isFormCompleteSub: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private modal: NgbActiveModal,
    private renderer: Renderer2,
    private fileUploadServer: FileUploadService,
    private openApiTestService: OpenAPITestService
  ) {
  }

  ngOnInit() {
    this.isFormComplete = false;
    this.openApiTestService.newFormInit();
    this.isFormCompleteSub = this.openApiTestService.$isFormComplete.subscribe((value) => {
      this.isFormComplete = value;
      this.setModalDisableState(!value);
    });
    this.fileUploadServer.setValidFileValue(null);
    this.initForm();
  }

  ngAfterViewInit(): void {
    this.setModalDisableState(!this.isFormComplete);
  }

  initForm() {
    this.openApiForm = this.formBuilder.group({
      file: new FormControl(null, Validators.required),
      latency: new FormControl(null, Validators.required),
      uptime: new FormControl(null, Validators.required),
    });
  }

  onSubmitForm() {
    this.modal.close();
    console.log(this.openApiForm.value);
    this.openApiTestService.sendOpenAPIConfiguration(this.openApiForm.value.file, {
      latency: this.openApiForm.value.latency,
      uptime: this.openApiForm.value.uptime
    });
  }

  ngOnDestroy(): void {
    this.isFormCompleteSub.unsubscribe();
  }

  private setModalDisableState(value: boolean) {
    if (value) {
      this.renderer.setStyle(this.modalSubmitButton.nativeElement, 'background-color', FileValidityColors.notValid.background.light);
    } else {
      this.renderer.setStyle(this.modalSubmitButton.nativeElement, 'background-color', FileValidityColors.isValid.background.light);
    }
    this.renderer.setProperty(this.modalSubmitButton.nativeElement, "disabled", value);
  }

}
