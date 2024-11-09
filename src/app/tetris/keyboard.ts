interface TrackedKey {
  key: string;
  handler: () => void;
  timeoutRef?: number;
}

export class Keyboard {
  private trackedKeys: Map<string, TrackedKey> = new Map();

  /* ARR is Auto Repeat Rate
     DAS is Delayed Auto Shift */
  constructor(private DAS: number, private ARR: number) {
    this.addEventListeners();
  }

  public addKeyCallback(key: string, handler: () => void) {
    if (this.trackedKeys.has(key)) {
      this.trackedKeys.get(key)!.handler = handler;
    } else {
      this.trackedKeys.set(key, { key, handler });
    }
  }

  public removeKeyCallback(key: string) {
    if (this.trackedKeys.has(key)) {
      this.trackedKeys.delete(key);
    }
  }

  public isKeyHandled(key: string): boolean {
    return this.trackedKeys.has(key);
  }

  private addEventListeners() {
    window.addEventListener('keyup', this.handleKeyup.bind(this), false);
    window.addEventListener('keydown', this.handleKeydown.bind(this), false);
  }

  private handleKeydown(event: KeyboardEvent) {
    const key = event.code;
    const trackedKey = this.trackedKeys.get(key);

    if (!trackedKey || trackedKey.timeoutRef) {
      return;
    }

    trackedKey.handler();
    trackedKey.timeoutRef = window.setTimeout(() => this.timeoutHandler(key), this.DAS);
  }

  private handleKeyup(event: KeyboardEvent) {
    const key = event.code;
    const trackedKey = this.trackedKeys.get(key);

    if (!trackedKey) {
      return;
    }

    clearTimeout(trackedKey.timeoutRef);
    trackedKey.timeoutRef = undefined;
  }

  private timeoutHandler(key: string) {
    const trackedKey = this.trackedKeys.get(key);

    if (!trackedKey) {
      return;
    }

    trackedKey.handler();
    clearTimeout(trackedKey.timeoutRef);
    trackedKey.timeoutRef = window.setTimeout(() => this.timeoutHandler(key), this.ARR);
  }
}
