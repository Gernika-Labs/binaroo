/** Saved on the device. Every access is guarded: storage can be blocked or full. */
const KEYS = { best: "binaroo:best", sound: "binaroo:sound" } as const;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the setting just won't persist */
  }
}

export const loadBest = (): number => Number(read(KEYS.best)) || 0;
export const saveBest = (score: number): void => write(KEYS.best, String(score));

export const loadSound = (): boolean => read(KEYS.sound) !== "0";
export const saveSound = (on: boolean): void => write(KEYS.sound, on ? "1" : "0");
