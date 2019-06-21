import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {InputUptimeComponent} from './input-uptime.component';

describe('InputUptimeComponent', () => {
  let component: InputUptimeComponent;
  let fixture: ComponentFixture<InputUptimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InputUptimeComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputUptimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
