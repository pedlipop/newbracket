import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '..', 'database');
const DB_FILE = path.join(DB_DIR, 'tournaments.json');

const DATABASE_URL = process.env.DATABASE_URL;

// ==================== POSTGRESQL CLOUD DATABASE (FOR RAILWAY) ====================
let pgPool = null;
let isPgInitialized = false;

if (DATABASE_URL) {
  console.log('📦 Initializing PostgreSQL Database Connection (Railway Cloud Mode)...');
  pgPool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  pgPool.on('error', (err) => {
    console.error('⚠️ Unexpected error on idle PostgreSQL client:', err);
  });
}

async function initPostgres() {
  if (!pgPool || isPgInitialized) return;
  try {
    const client = await pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS tournaments (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_tournaments_updated_at ON tournaments(updated_at DESC);
      `);
      isPgInitialized = true;
      console.log('✅ PostgreSQL "tournaments" table verified & ready.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Failed to initialize PostgreSQL table:', err.message);
  }
}

// ==================== LOCAL JSON DATABASE (FALLBACK OFFLINE MODE) ====================
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (e) {}
}

function readLocalData() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { tournaments: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content || '{"tournaments":[]}');
  } catch (err) {
    console.error('Error reading local database file:', err);
    return { tournaments: [] };
  }
}

function writeLocalData(data) {
  try {
    const tmpFile = `${DB_FILE}.tmp`;
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(tmpFile, serialized, 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing local database file:', err);
    return false;
  }
}

// ==================== UNIFIED DATABASE INTERFACE ====================
export const db = {
  isCloudMode() {
    return !!DATABASE_URL;
  },

  async getAllTournaments() {
    if (DATABASE_URL) {
      await initPostgres();
      try {
        const res = await pgPool.query(
          'SELECT data FROM tournaments ORDER BY updated_at DESC'
        );
        return res.rows.map(row => row.data);
      } catch (err) {
        console.error('PostgreSQL getAllTournaments error:', err);
        return [];
      }
    } else {
      const data = readLocalData();
      return data.tournaments || [];
    }
  },

  async getTournament(id) {
    if (DATABASE_URL) {
      await initPostgres();
      try {
        const res = await pgPool.query('SELECT data FROM tournaments WHERE id = $1', [id]);
        return res.rows.length > 0 ? res.rows[0].data : null;
      } catch (err) {
        console.error('PostgreSQL getTournament error:', err);
        return null;
      }
    } else {
      const data = readLocalData();
      return (data.tournaments || []).find(t => t.id === id) || null;
    }
  },

  async createTournament(payload) {
    const now = new Date().toISOString();
    const id = payload.id || `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const participants = Array.isArray(payload.participants) ? payload.participants : [];

    const tournament = {
      id,
      name: payload.name || 'New Tournament',
      game: payload.game || 'Esports Tournament',
      type: payload.type || 'single_elimination',
      status: payload.status || 'setup',
      isLocked: false,
      maxParticipants: payload.maxParticipants || 8,
      participants,
      rounds: payload.rounds || [],
      lockedSeeds: [],
      inProgressHighlight: false,
      registrationDeadline: payload.registrationDeadline || null,
      autoLockAt: payload.autoLockAt || null,
      settings: {
        thirdPlaceMatch: payload.thirdPlaceMatch || false,
        theme: payload.theme || 'dark-modern',
        ...payload.settings
      },
      createdAt: now,
      updatedAt: now
    };

    if (DATABASE_URL) {
      await initPostgres();
      try {
        await pgPool.query(
          `INSERT INTO tournaments (id, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4)`,
          [id, JSON.stringify(tournament), now, now]
        );
        return tournament;
      } catch (err) {
        console.error('PostgreSQL createTournament error:', err);
        throw err;
      }
    } else {
      const data = readLocalData();
      data.tournaments = [tournament, ...(data.tournaments || [])];
      writeLocalData(data);
      return tournament;
    }
  },

  async updateTournament(id, updates) {
    if (DATABASE_URL) {
      await initPostgres();
      try {
        const existing = await this.getTournament(id);
        if (!existing) return null;

        const updated = {
          ...existing,
          ...updates,
          id, // protect ID from changing
          updatedAt: new Date().toISOString()
        };

        await pgPool.query(
          `UPDATE tournaments SET data = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(updated), id]
        );
        return updated;
      } catch (err) {
        console.error('PostgreSQL updateTournament error:', err);
        throw err;
      }
    } else {
      const data = readLocalData();
      const idx = (data.tournaments || []).findIndex(t => t.id === id);
      if (idx === -1) return null;

      const existing = data.tournaments[idx];
      const updated = {
        ...existing,
        ...updates,
        id,
        updatedAt: new Date().toISOString()
      };

      data.tournaments[idx] = updated;
      writeLocalData(data);
      return updated;
    }
  },

  async deleteTournament(id) {
    if (DATABASE_URL) {
      await initPostgres();
      try {
        const res = await pgPool.query('DELETE FROM tournaments WHERE id = $1', [id]);
        return (res.rowCount || 0) > 0;
      } catch (err) {
        console.error('PostgreSQL deleteTournament error:', err);
        return false;
      }
    } else {
      const data = readLocalData();
      const initialLen = (data.tournaments || []).length;
      data.tournaments = (data.tournaments || []).filter(t => t.id !== id);
      if (data.tournaments.length !== initialLen) {
        writeLocalData(data);
        return true;
      }
      return false;
    }
  },

  async addParticipant(tournamentId, participantData) {
    const rawName = (participantData.name || '').trim();
    const playerName = (participantData.playerName !== undefined ? participantData.playerName : rawName).trim();
    
    let teamName = (participantData.teamName || '').trim();
    if (!teamName && playerName) {
      teamName = playerName;
    }

    const participant = {
      id: participantData.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: teamName || playerName || '',
      teamName: teamName || '',
      playerName: playerName || '',
      wecom: (participantData.wecom || participantData.contact || '').trim(),
      dept: (participantData.dept || participantData.tag || '').trim(),
      isTeam: !!participantData.isTeam || (Array.isArray(participantData.partners) && participantData.partners.length > 0),
      partners: (Array.isArray(participantData.partners) ? participantData.partners : (participantData.partner ? [participantData.partner] : [])).map(p => ({
        name: (p.name || '').trim(),
        wecom: (p.wecom || '').trim(),
        dept: (p.dept || '').trim()
      })).filter(p => p.name.length > 0),
      partner: participantData.partner ? {
        name: (participantData.partner.name || '').trim(),
        wecom: (participantData.partner.wecom || '').trim(),
        dept: (participantData.partner.dept || '').trim()
      } : (Array.isArray(participantData.partners) && participantData.partners[0] ? {
        name: (participantData.partners[0].name || '').trim(),
        wecom: (participantData.partners[0].wecom || '').trim(),
        dept: (participantData.partners[0].dept || '').trim()
      } : null),
      registeredAt: new Date().toISOString()
    };

    if (DATABASE_URL) {
      await initPostgres();
      try {
        const t = await this.getTournament(tournamentId);
        if (!t) return null;

        t.participants = t.participants || [];
        t.participants.push(participant);
        t.updatedAt = new Date().toISOString();

        await pgPool.query(
          `UPDATE tournaments SET data = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(t), tournamentId]
        );
        return { tournament: t, participant };
      } catch (err) {
        console.error('PostgreSQL addParticipant error:', err);
        throw err;
      }
    } else {
      const data = readLocalData();
      const t = (data.tournaments || []).find(item => item.id === tournamentId);
      if (!t) return null;

      t.participants = t.participants || [];
      t.participants.push(participant);
      t.updatedAt = new Date().toISOString();
      writeLocalData(data);
      return { tournament: t, participant };
    }
  }
};
