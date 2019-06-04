import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AddServerModalComponent} from './add-server-modal.component';

describe('AddServerModalComponent', () => {
  let component: AddServerModalComponent;
  let fixture: ComponentFixture<AddServerModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddServerModalComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
