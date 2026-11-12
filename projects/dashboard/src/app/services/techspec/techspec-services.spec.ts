import { TestBed } from '@angular/core/testing';

import { TechspecServices } from './techspec-services';

describe('TechspecServices', () => {
  let service: TechspecServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TechspecServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
