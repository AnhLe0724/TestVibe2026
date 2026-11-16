export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class FakeStorage implements StorageLike {
  private readonly store = new Map<string, string>();
  public failOnGet = false;
  public failOnSet = false;

  constructor(initial?: Record<string, string>) {
    if (initial) {
      for (const [k, v] of Object.entries(initial)) {
        this.store.set(k, v);
      }
    }
  }

  getItem(key: string): string | null {
    if (this.failOnGet) throw new Error('Storage read failed');
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failOnSet) throw new Error('QuotaExceededError');
    this.store.set(key, value);
  }

  keys(): string[] {
    return [...this.store.keys()];
  }
}
