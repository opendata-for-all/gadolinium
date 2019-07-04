import {TestBed} from '@angular/core/testing';

import {OpenAPITestService} from './open-apitest.service';

describe('OpenAPITestService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OpenAPITestService = TestBed.get(OpenAPITestService);
    expect(service).toBeTruthy();
  });
});
