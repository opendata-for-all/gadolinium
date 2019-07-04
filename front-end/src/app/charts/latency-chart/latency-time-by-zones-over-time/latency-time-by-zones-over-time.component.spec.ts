import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LatencyTimeByZonesOverTimeComponent} from './latency-time-by-zones-over-time.component';

describe('LatencyTimeByZonesOverTimeComponent', () => {
  let component: LatencyTimeByZonesOverTimeComponent;
  let fixture: ComponentFixture<LatencyTimeByZonesOverTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LatencyTimeByZonesOverTimeComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatencyTimeByZonesOverTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
