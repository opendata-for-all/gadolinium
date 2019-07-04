import {TestBed} from '@angular/core/testing';

import {TestResultsService} from './test-results.service';

describe('TestResultsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TestResultsService = TestBed.get(TestResultsService);
    expect(service).toBeTruthy();
  });
});
