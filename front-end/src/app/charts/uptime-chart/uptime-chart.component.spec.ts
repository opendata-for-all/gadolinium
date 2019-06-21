import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {UptimeChartComponent} from './uptime-chart.component';

describe('UptimeChartComponent', () => {
  let component: UptimeChartComponent;
  let fixture: ComponentFixture<UptimeChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UptimeChartComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UptimeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
