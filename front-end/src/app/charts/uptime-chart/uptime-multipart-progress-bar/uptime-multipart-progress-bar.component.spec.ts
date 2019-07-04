import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {UptimeMultipartProgressBarComponent} from './uptime-multipart-progress-bar.component';

describe('UptimeMultipartProgressBarComponent', () => {
  let component: UptimeMultipartProgressBarComponent;
  let fixture: ComponentFixture<UptimeMultipartProgressBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UptimeMultipartProgressBarComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UptimeMultipartProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
