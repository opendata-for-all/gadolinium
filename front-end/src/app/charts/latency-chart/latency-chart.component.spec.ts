import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LatencyChartComponent} from './latency-chart.component';

describe('LatencyChartComponent', () => {
  let component: LatencyChartComponent;
  let fixture: ComponentFixture<LatencyChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LatencyChartComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatencyChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
