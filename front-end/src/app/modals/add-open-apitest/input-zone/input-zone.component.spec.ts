import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {InputZoneComponent} from './input-zone.component';

describe('InputZoneComponent', () => {
  let component: InputZoneComponent;
  let fixture: ComponentFixture<InputZoneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InputZoneComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputZoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
