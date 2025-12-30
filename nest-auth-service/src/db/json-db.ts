
import { promises as fs } from 'fs';
import * as path from 'path';

export type JsonRoot = {
  users: Array<any>;
  lastId: number;
};

export class JsonDb {
  private filePath: string;
  private initPromise: Promise<void> | null = null;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  private async ensureFile() {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.access(this.filePath);
    } catch {
      const initial: JsonRoot = { users: [], lastId: 0 };
      await fs.writeFile(this.filePath, JSON.stringify(initial, null, 2), 'utf8');
    }
  }

  private async init() {
    if (!this.initPromise) {
      this.initPromise = this.ensureFile();
    }
    return this.initPromise;
  }

  async read(): Promise<JsonRoot> {
    await this.init();
    const raw = await fs.readFile(this.filePath, 'utf8');
    try {
      const data = JSON.parse(raw);
      if (!data.users) data.users = [];
      if (typeof data.lastId !== 'number') data.lastId = 0;
      return data as JsonRoot;
    } catch {
      // If file is corrupted, throw to avoid silent data loss
      throw new Error('JSON DB file is not valid JSON');
    }
  }

  // Basic atomic-ish write: write to temp then rename
  private async atomicWrite(text: string) {
    const tmp = this.filePath + '.tmp';
    await fs.writeFile(tmp, text, 'utf8');
    await fs.rename(tmp, this.filePath);
  }

  async write(data: JsonRoot): Promise<void> {
    const text = JSON.stringify(data, null, 2);
    await this.atomicWrite(text);
  }
}
