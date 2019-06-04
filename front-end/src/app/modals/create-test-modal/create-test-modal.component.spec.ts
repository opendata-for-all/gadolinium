import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {CreateTestModalComponent} from './create-test-modal.component';

describe('CreateTestModalComponent', () => {
  let component: CreateTestModalComponent;
  let fixture: ComponentFixture<CreateTestModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateTestModalComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTestModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
