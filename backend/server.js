import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve frontend static assets
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// === TOURNAMENT CRUD APIS ===

// 1. Get all tournaments
app.get('/api/tournaments', (req, res) => {
  try {
    const list = db.getAllTournaments();
    res.json({ success: true, tournaments: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Create tournament
app.post('/api/tournaments', (req, res) => {
  try {
    const { name, game, type, maxParticipants, settings, participants } = req.body;
    const tournament = db.createTournament({
      name,
      game,
      type,
      maxParticipants: parseInt(maxParticipants, 10) || 8,
      settings,
      participants
    });
    res.status(201).json({ success: true, tournament });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function checkAutoLock(tournament) {
  if (!tournament || tournament.isLocked) return tournament;
  if (tournament.autoLockAt) {
    const lockTime = new Date(tournament.autoLockAt).getTime();
    if (!isNaN(lockTime) && Date.now() >= lockTime) {
      tournament.isLocked = true;
      tournament.status = 'in_progress';
      db.updateTournament(tournament.id, { isLocked: true, status: 'in_progress' });
    }
  }
  return tournament;
}

// 3. Get single tournament
app.get('/api/tournaments/:id', (req, res) => {
  try {
    let tournament = db.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    tournament = checkAutoLock(tournament);
    res.json({ success: true, tournament });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update tournament metadata / state
app.put('/api/tournaments/:id', (req, res) => {
  try {
    const updated = db.updateTournament(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    res.json({ success: true, tournament: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete tournament
app.delete('/api/tournaments/:id', (req, res) => {
  try {
    const ok = db.deleteTournament(req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Save entire bracket state (rounds, matches, participants, lock status)
app.post('/api/tournaments/:id/state', (req, res) => {
  try {
    const { rounds, participants, isLocked, status, inProgressHighlight, lockedSeeds, settings, name, registrationDeadline, autoLockAt } = req.body;
    const updates = {};
    if (rounds !== undefined) updates.rounds = rounds;
    if (participants !== undefined) updates.participants = participants;
    if (isLocked !== undefined) updates.isLocked = isLocked;
    if (status !== undefined) updates.status = status;
    if (inProgressHighlight !== undefined) updates.inProgressHighlight = inProgressHighlight;
    if (lockedSeeds !== undefined) updates.lockedSeeds = lockedSeeds;
    if (settings !== undefined) updates.settings = settings;
    if (name !== undefined) updates.name = name;
    if (registrationDeadline !== undefined) updates.registrationDeadline = registrationDeadline;
    if (autoLockAt !== undefined) updates.autoLockAt = autoLockAt;

    const updated = db.updateTournament(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    res.json({ success: true, tournament: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Register / Add participant (public or admin)
app.post('/api/tournaments/:id/register', (req, res) => {
  try {
    const tournament = db.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    if (tournament.isLocked) {
      return res.status(400).json({ success: false, error: 'Pendaftaran ditutup karena bracket pertandingan sudah dikunci.' });
    }
    if (tournament.registrationDeadline) {
      const deadline = new Date(tournament.registrationDeadline).getTime();
      if (!isNaN(deadline) && Date.now() > deadline) {
        return res.status(400).json({ success: false, error: 'Pendaftaran telah ditutup sesuai batas waktu yang ditentukan panitia.' });
      }
    }

    const { name, playerName, teamName, wecom, dept, contact, tag, isTeam, partner, partners } = req.body;
    const effectiveName = (playerName || name || teamName || '').trim();
    const result = db.addParticipant(req.params.id, {
      name: effectiveName,
      playerName: (playerName || name || '').trim(),
      teamName: (teamName || '').trim(),
      wecom: (wecom || contact || '').trim(),
      dept: (dept || tag || '').trim(),
      isTeam: !!isTeam || (Array.isArray(partners) && partners.length > 0),
      partner: partner || null,
      partners: partners || null
    });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Generate QR Code for Tournament Registration Link
app.get('/api/tournaments/:id/qr', async (req, res) => {
  try {
    const tournament = db.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const isDoubles = req.query.isTeam === '1' || req.query.isTeam === 'true' || !!(tournament.settings && tournament.settings.isDoubles);
    // Determine host and protocol
    const host = req.get('host');
    const protocol = req.protocol;
    const registrationUrl = `${protocol}://${host}/?view=register&id=${tournament.id}${isDoubles ? '&isTeam=1' : ''}`;

    // Generate high quality QR code data URL
    const qrDataUrl = await QRCode.toDataURL(registrationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    const qrSvg = await QRCode.toString(registrationUrl, {
      type: 'svg',
      margin: 2
    });

    res.json({
      success: true,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      registrationUrl,
      qrDataUrl,
      qrSvg
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Start server with automatic port retry if occupied
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`===================================================`);
    console.log(`🏆 TOURNAMENT BRACKET ENGINE RUNNING ON PORT ${port}`);
    console.log(`🌐 Web App URL: http://localhost:${port}`);
    console.log(`===================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
