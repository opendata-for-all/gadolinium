import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AddOpenAPITestComponent} from './add-open-apitest.component';

describe('AddOpenAPITestComponent', () => {
  let component: AddOpenAPITestComponent;
  let fixture: ComponentFixture<AddOpenAPITestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddOpenAPITestComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOpenAPITestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
