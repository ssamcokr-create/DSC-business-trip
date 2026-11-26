import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_SEED_DATA } from './src/data/seedData';
import type { AppDatabase } from './src/types/trip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'dsc-trips.json');

function ensureDataFile(): AppDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_SEED_DATA, null, 2), 'utf-8');
    return INITIAL_SEED_DATA;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as AppDatabase;
    if (!parsed || !Array.isArray(parsed.projects)) {
      throw new Error('Invalid DB structure');
    }
    return parsed;
  } catch {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_SEED_DATA, null, 2), 'utf-8');
    return INITIAL_SEED_DATA;
  }
}

function writeDataFile(data: AppDatabase): AppDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const nextData: AppDatabase = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(nextData, null, 2), 'utf-8');
  fs.renameSync(tempFile, DATA_FILE);
  return nextData;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/data', (_req, res) => {
    const data = ensureDataFile();
    res.json(data);
  });

  app.put('/api/data', (req, res) => {
    const payload = req.body as AppDatabase;
    if (
      !payload ||
      !Array.isArray(payload.teamMembers) ||
      !Array.isArray(payload.vendors) ||
      !Array.isArray(payload.projects) ||
      !Array.isArray(payload.assignments)
    ) {
      res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
      return;
    }
    const saved = writeDataFile(payload);
    res.json(saved);
  });

  app.post('/api/reset', (_req, res) => {
    const saved = writeDataFile(INITIAL_SEED_DATA);
    res.json(saved);
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
