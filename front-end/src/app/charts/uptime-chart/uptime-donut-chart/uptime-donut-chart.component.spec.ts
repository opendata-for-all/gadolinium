import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {UptimeDonutChartComponent} from './uptime-donut-chart.component';

describe('UptimeDonutChartComponent', () => {
  let component: UptimeDonutChartComponent;
  let fixture: ComponentFixture<UptimeDonutChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UptimeDonutChartComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UptimeDonutChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
