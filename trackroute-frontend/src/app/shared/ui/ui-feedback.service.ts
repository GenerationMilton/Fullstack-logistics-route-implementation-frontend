import { Injectable, signal } from '@angular/core';

export type FeedbackType = 'success' | 'error' | 'info';

export interface FeedbackMessage {
  text: string;
  type: FeedbackType;
}

@Injectable({ providedIn: 'root' })
export class UiFeedbackService {
  readonly message = signal<FeedbackMessage | null>(null);
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  show(text: string, type: FeedbackType = 'info', timeoutMs = 3000): void {
    this.message.set({ text, type });
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.clear(), timeoutMs);
  }

  clear(): void {
    this.message.set(null);
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
