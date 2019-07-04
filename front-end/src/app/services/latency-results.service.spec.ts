import {TestBed} from '@angular/core/testing';

import {LatencyResultsService} from './latency-results.service';

describe('LatencyResultsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LatencyResultsService = TestBed.get(LatencyResultsService);
    expect(service).toBeTruthy();
  });
});
