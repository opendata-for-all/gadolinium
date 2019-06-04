import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ServerCollapseComponent} from './server-collapse.component';

describe('ServerCollapseComponent', () => {
  let component: ServerCollapseComponent;
  let fixture: ComponentFixture<ServerCollapseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServerCollapseComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerCollapseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
