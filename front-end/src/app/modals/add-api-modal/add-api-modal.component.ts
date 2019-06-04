import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-api-modal',
  templateUrl: './add-api-modal.component.pug',
  styleUrls: ['./add-api-modal.component.css']
})
export class AddApiModalComponent implements OnInit {

  constructor(private modal: NgbActiveModal) {
  }

  ngOnInit() {
  }

  openJSONFile($event: Event) {
    const input = event.target;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const text = reader.result;
      await this.sendOpenAPIJSONFileToMaster(text);
    };
    // @ts-ignore
    reader.readAsText(input.files[0]);
  }

  sendOpenAPIJSONFileToMaster = async (json) => {
    console.log(json);
    const response = await fetch('http://localhost:8080/OpenAPI', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: json
    });
    console.log(response);
  };
}
