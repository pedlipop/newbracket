import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

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
app.get('/api/tournaments', async (req, res) => {
  try {
    const list = await db.getAllTournaments();
    res.json({ success: true, tournaments: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Create tournament
app.post('/api/tournaments', async (req, res) => {
  try {
    const { name, game, type, maxParticipants, settings, participants } = req.body;
    const tournament = await db.createTournament({
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

async function checkAutoLock(tournament) {
  if (!tournament || tournament.isLocked) return tournament;
  if (tournament.autoLockAt) {
    const lockTime = new Date(tournament.autoLockAt).getTime();
    if (!isNaN(lockTime) && Date.now() >= lockTime) {
      tournament.isLocked = true;
      tournament.status = 'in_progress';
      await db.updateTournament(tournament.id, { isLocked: true, status: 'in_progress' });
    }
  }
  return tournament;
}

// 3. Get single tournament
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    let tournament = await db.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    tournament = await checkAutoLock(tournament);
    res.json({ success: true, tournament });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update tournament metadata / state
app.put('/api/tournaments/:id', async (req, res) => {
  try {
    const updated = await db.updateTournament(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    res.json({ success: true, tournament: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete tournament
app.delete('/api/tournaments/:id', async (req, res) => {
  try {
    const ok = await db.deleteTournament(req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Save entire bracket state (rounds, matches, participants, lock status)
app.post('/api/tournaments/:id/state', async (req, res) => {
  try {
    const { rounds, participants, isLocked, status, inProgressHighlight, lockedSeeds, settings, name, registrationDeadline, autoLockAt, isRegistrationClosed, hideLiveBracket } = req.body;
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
    if (isRegistrationClosed !== undefined) updates.isRegistrationClosed = isRegistrationClosed;
    if (hideLiveBracket !== undefined) updates.hideLiveBracket = hideLiveBracket;

    const updated = await db.updateTournament(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    res.json({ success: true, tournament: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Register / Add participant (public or admin)
app.post('/api/tournaments/:id/register', async (req, res) => {
  try {
    const tournament = await db.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    if (tournament.isLocked) {
      return res.status(400).json({ success: false, error: 'Pendaftaran ditutup karena bracket pertandingan sudah dikunci.' });
    }
    if (!req.body.isAdmin) {
      if (tournament.isRegistrationClosed) {
        return res.status(400).json({ success: false, error: 'Pendaftaran telah ditutup oleh panitia.' });
      }
      if (tournament.registrationDeadline) {
        const deadline = new Date(tournament.registrationDeadline).getTime();
        if (!isNaN(deadline) && Date.now() > deadline) {
          return res.status(400).json({ success: false, error: 'Pendaftaran telah ditutup sesuai batas waktu yang ditentukan panitia.' });
        }
      }
    }

    const { name, playerName, teamName, wecom, dept, contact, tag, isTeam, partner, partners } = req.body;
    const effectiveName = (playerName || name || teamName || '').trim();

    // Duplicate WeCom Validation
    const cleanWecom = str => (str || '').toString().trim().replace(/[\s\-\+]/g, '').toLowerCase();
    
    // Collect all wecoms submitted in this request
    const submittedWecoms = [];
    const mainWecom = cleanWecom(wecom || contact);
    if (mainWecom) {
      submittedWecoms.push({ role: 'Pemain Utama / Kapten', wecom: mainWecom, raw: (wecom || contact).trim() });
    }
    
    const rawPartners = Array.isArray(partners) ? partners : (partner ? [partner] : []);
    rawPartners.forEach((p, idx) => {
      const pWecom = cleanWecom(p.wecom);
      if (pWecom) {
        submittedWecoms.push({ role: `Rekan #${idx + 1} (${p.name || ''})`, wecom: pWecom, raw: (p.wecom || '').trim() });
      }
    });

    // 1. Check duplicate within the same submission
    const selfMap = new Map();
    for (const item of submittedWecoms) {
      if (selfMap.has(item.wecom)) {
        return res.status(400).json({
          success: false,
          error: `No. WeCom [${item.raw}] dimasukkan lebih dari sekali dalam satu tim (${item.role} dan ${selfMap.get(item.wecom).role})! Setiap anggota tim harus memiliki nomor unik.`
        });
      }
      selfMap.set(item.wecom, item);
    }

    // 2. Check duplicate against existing participants in this tournament
    const existingList = tournament.participants || [];
    for (const ep of existingList) {
      const teamLabel = ep.teamName || ep.name || ep.playerName || 'Tim Lain';
      
      const epWecoms = [];
      const epMain = cleanWecom(ep.wecom);
      if (epMain) epWecoms.push({ label: ep.name || ep.playerName || 'Kapten', wecom: epMain, raw: ep.wecom });
      
      const epPartners = Array.isArray(ep.partners) ? ep.partners : (ep.partner ? [ep.partner] : []);
      epPartners.forEach(part => {
        const partW = cleanWecom(part.wecom);
        if (partW) epWecoms.push({ label: part.name || 'Rekan', wecom: partW, raw: part.wecom });
      });

      for (const epw of epWecoms) {
        for (const sub of submittedWecoms) {
          if (sub.wecom === epw.wecom) {
            return res.status(400).json({
              success: false,
              error: `No. WeCom [${sub.raw}] sudah terdaftar pada tim "${teamLabel}"! Setiap nomor WeCom hanya boleh terdaftar 1 kali untuk menghindari tim ganda.`
            });
          }
        }
      }
    }

    const result = await db.addParticipant(req.params.id, {
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
    const tournament = await db.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const isDoubles = !!(tournament.settings && tournament.settings.isDoubles);
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const registrationUrl = `${protocol}://${host}/?view=register&id=${tournament.id}${isDoubles ? '&isTeam=1' : ''}`;

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

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`===================================================`);
  console.log(`🏆 TOURNAMENT BRACKET ENGINE RUNNING ON PORT ${PORT}`);
  console.log(`🌐 Host: ${HOST} | Mode: ${db.isCloudMode() ? 'Railway PostgreSQL' : 'Local JSON'}`);
  console.log(`===================================================`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && !process.env.PORT) {
    const nextPort = Number(PORT) + 1;
    console.warn(`Port ${PORT} is in use, trying port ${nextPort}...`);
    app.listen(nextPort, HOST);
  } else {
    console.error('Server error:', err);
  }
});

