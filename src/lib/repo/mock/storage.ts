import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Ensure the data directory exists
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Get the path to a JSON file
 */
function getFilePath(filename: string): string {
  return path.join(DATA_DIR, `${filename}.json`);
}

/**
 * Read data from a JSON file
 */
export async function readJsonFile<T>(filename: string): Promise<T[]> {
  await ensureDataDir();
  const filePath = getFilePath(filename);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T[];
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Write data to a JSON file (atomic write using temp file + rename)
 */
export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const filePath = getFilePath(filename);
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  
  try {
    // Write to temp file first
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    // Atomic rename
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Generate a new UUID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Simple in-memory lock for file operations
 */
const locks = new Map<string, Promise<void>>();

export async function withLock<T>(
  filename: string,
  operation: () => Promise<T>
): Promise<T> {
  // Wait for any existing lock
  while (locks.has(filename)) {
    await locks.get(filename);
  }
  
  let resolve: () => void;
  const lockPromise = new Promise<void>((r) => { resolve = r; });
  locks.set(filename, lockPromise);
  
  try {
    return await operation();
  } finally {
    locks.delete(filename);
    resolve!();
  }
}

/**
 * Create a generic CRUD repository for a JSON file
 */
export function createBaseRepo<T extends { id: string; created_at: string }>(filename: string) {
  return {
    async list(): Promise<T[]> {
      return readJsonFile<T>(filename);
    },

    async get(id: string): Promise<T | null> {
      const items = await readJsonFile<T>(filename);
      return items.find(item => item.id === id) || null;
    },

    async create(data: Omit<T, 'id' | 'created_at'>): Promise<T> {
      return withLock(filename, async () => {
        const items = await readJsonFile<T>(filename);
        const newItem = {
          ...data,
          id: generateId(),
          created_at: getCurrentTimestamp(),
        } as T;
        items.push(newItem);
        await writeJsonFile(filename, items);
        return newItem;
      });
    },

    async update(id: string, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T | null> {
      return withLock(filename, async () => {
        const items = await readJsonFile<T>(filename);
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;
        
        items[index] = { ...items[index], ...data };
        await writeJsonFile(filename, items);
        return items[index];
      });
    },

    async remove(id: string): Promise<boolean> {
      return withLock(filename, async () => {
        const items = await readJsonFile<T>(filename);
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return false;
        
        items.splice(index, 1);
        await writeJsonFile(filename, items);
        return true;
      });
    },
  };
}
