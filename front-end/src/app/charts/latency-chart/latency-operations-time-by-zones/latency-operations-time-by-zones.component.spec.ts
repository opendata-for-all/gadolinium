import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LatencyOperationsTimeByZonesComponent} from './latency-operations-time-by-zones.component';

describe('LatencyOperationsTimeByZonesComponent', () => {
  let component: LatencyOperationsTimeByZonesComponent;
  let fixture: ComponentFixture<LatencyOperationsTimeByZonesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LatencyOperationsTimeByZonesComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatencyOperationsTimeByZonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
