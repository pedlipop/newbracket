import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '..', 'database');
const DB_FILE = path.join(DB_DIR, 'tournaments.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function readData() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { tournaments: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content || '{"tournaments":[]}');
  } catch (err) {
    console.error('Error reading database file:', err);
    return { tournaments: [] };
  }
}

function writeData(data) {
  try {
    const tmpFile = `${DB_FILE}.tmp`;
    const bakFile = `${DB_FILE}.bak`;
    const serialized = JSON.stringify(data, null, 2);
    
    fs.writeFileSync(tmpFile, serialized, 'utf8');
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.copyFileSync(DB_FILE, bakFile);
      } catch (e) {}
    }
    fs.renameSync(tmpFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

export const db = {
  getAllTournaments() {
    const data = readData();
    return data.tournaments || [];
  },

  getTournament(id) {
    const data = readData();
    return (data.tournaments || []).find(t => t.id === id) || null;
  },

  createTournament(payload) {
    const data = readData();
    const now = new Date().toISOString();
    const id = payload.id || `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Default participant list if provided or generate empty slots
    const participants = Array.isArray(payload.participants) ? payload.participants : [];
    
    const tournament = {
      id,
      name: payload.name || 'New Tournament',
      game: payload.game || 'Esports Tournament',
      type: payload.type || 'single_elimination',
      status: payload.status || 'setup',
      isLocked: false,
      maxParticipants: payload.maxParticipants || 8,
      participants: participants,
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

    data.tournaments = [tournament, ...(data.tournaments || [])];
    writeData(data);
    return tournament;
  },

  updateTournament(id, updates) {
    const data = readData();
    const idx = (data.tournaments || []).findIndex(t => t.id === id);
    if (idx === -1) return null;

    const existing = data.tournaments[idx];
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Ensure id does not change
    updated.id = id;
    data.tournaments[idx] = updated;
    writeData(data);
    return updated;
  },

  deleteTournament(id) {
    const data = readData();
    const initialLen = (data.tournaments || []).length;
    data.tournaments = (data.tournaments || []).filter(t => t.id !== id);
    if (data.tournaments.length !== initialLen) {
      writeData(data);
      return true;
    }
    return false;
  },

  addParticipant(tournamentId, participantData) {
    const data = readData();
    const t = (data.tournaments || []).find(item => item.id === tournamentId);
    if (!t) return null;

    const rawName = (participantData.name || '').trim();
    const playerName = (participantData.playerName !== undefined ? participantData.playerName : rawName).trim();
    
    // Nama Tim: only use teamName or playerName if provided, otherwise keep empty string
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

    t.participants = t.participants || [];
    t.participants.push(participant);
    t.updatedAt = new Date().toISOString();
    writeData(data);
    return { tournament: t, participant };
  }
};
