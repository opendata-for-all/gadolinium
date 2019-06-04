import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AddApiModalComponent} from './add-api-modal.component';

describe('AddApiModalComponent', () => {
  let component: AddApiModalComponent;
  let fixture: ComponentFixture<AddApiModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddApiModalComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddApiModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
