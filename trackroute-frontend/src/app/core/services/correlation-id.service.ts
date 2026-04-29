import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class CorrelationIdService {
  private currentId = uuidv4();

  get id(): string {
    return this.currentId;
  }

  rotate(): void {
    this.currentId = uuidv4();
  }
}
