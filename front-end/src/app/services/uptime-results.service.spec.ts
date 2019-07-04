import {TestBed} from '@angular/core/testing';

import {UptimeResultsService} from './uptime-results.service';

describe('UptimeResultsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UptimeResultsService = TestBed.get(UptimeResultsService);
    expect(service).toBeTruthy();
  });
});
