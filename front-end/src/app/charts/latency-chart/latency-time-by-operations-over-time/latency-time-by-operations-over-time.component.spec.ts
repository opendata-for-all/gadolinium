import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LatencyTimeByOperationsOverTimeComponent} from './latency-time-by-operations-over-time.component';

describe('LatencyTimeByOperationsOverTimeComponent', () => {
  let component: LatencyTimeByOperationsOverTimeComponent;
  let fixture: ComponentFixture<LatencyTimeByOperationsOverTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LatencyTimeByOperationsOverTimeComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatencyTimeByOperationsOverTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
