import { TestBed } from '@angular/core/testing';

import { ToneAnalyzerService } from './tone-analyzer.service';

describe('ToneAnalyzerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ToneAnalyzerService = TestBed.get(ToneAnalyzerService);
    expect(service).toBeTruthy();
  });
});
