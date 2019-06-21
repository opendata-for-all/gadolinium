import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {InputLatencyComponent} from './input-latency.component';

describe('InputLatencyComponent', () => {
  let component: InputLatencyComponent;
  let fixture: ComponentFixture<InputLatencyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InputLatencyComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputLatencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
