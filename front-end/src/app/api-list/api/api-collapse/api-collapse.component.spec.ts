import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ApiCollapseComponent} from './api-collapse.component';

describe('ApiCollapseComponent', () => {
  let component: ApiCollapseComponent;
  let fixture: ComponentFixture<ApiCollapseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApiCollapseComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiCollapseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
