import {TestBed} from '@angular/core/testing';

import {ApiStatusService} from './api-status.service';

describe('ApiStatusService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ApiStatusService = TestBed.get(ApiStatusService);
    expect(service).toBeTruthy();
  });
});
