import { CorrelationIdService } from './correlation-id.service';

describe('CorrelationIdService', () => {
  it('should expose a generated id and rotate it', () => {
    const service = new CorrelationIdService();
    const first = service.id;
    expect(first).toBeTruthy();

    service.rotate();
    const second = service.id;
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
  });
});
