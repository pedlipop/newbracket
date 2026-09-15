/**
 * CNGR TOURNAMENT ENGINE & BRACKETHQ-INSPIRED CONTROLLER
 * Full client-side application with dynamic non-power-of-2 bracket tree,
 * drag-and-drop seeding, QR code registration, match progression, and live spectator view.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentView: 'dashboard',
    tournaments: [],
    currentTournament: null,
    activeDrawerPanel: 'participants',
    isDrawerCollapsed: false,
    zoomLevel: 1.0,
    panX: 40,
    panY: 40,
    isDraggingCanvas: false,
    dragStartX: 0,
    dragStartY: 0,
    highlightInProgress: false,
    selectedMatchForEdit: null,
    livePollingTimer: null,
    currentTheme: 'dark',
    draggedParticipant: null,
    draggedSlot: null,
    parsedCsvParticipants: [],
    activeSearchFilter: 'all',
    regTeammateCount: 1
  };

  // DOM Elements Cache
  const el = {};

  function initElements() {
    // Views
    el.dashboardView = document.getElementById('dashboard-view');
    el.studioView = document.getElementById('studio-view');
    el.liveView = document.getElementById('live-view');
    el.registerView = document.getElementById('register-view');

    // Dashboard
    el.tournamentsGrid = document.getElementById('tournaments-grid');
    el.dashboardSearchInput = document.getElementById('dashboard-search-input');
    el.dashboardEmptyState = document.getElementById('dashboard-empty-state');
    el.btnOpenCreateModal = document.getElementById('btn-open-create-modal');
    el.btnEmptyCreate = document.getElementById('btn-empty-create');

    // Studio Header
    el.btnBackDashboard = document.getElementById('btn-back-dashboard');
    el.studioTournamentName = document.getElementById('studio-tournament-name');
    el.btnEditTitle = document.getElementById('btn-edit-title');
    el.studioStatusBadge = document.getElementById('studio-status-badge');
    el.btnToggleHighlight = document.getElementById('btn-toggle-highlight');
    el.btnToggleLock = document.getElementById('btn-toggle-lock');
    el.lockBtnText = document.getElementById('lock-btn-text');
    el.btnOpenQrModal = document.getElementById('btn-open-qr-modal');
    el.btnOpenLiveView = document.getElementById('btn-open-live-view');

    // Studio Drawer
    el.studioDrawer = document.getElementById('studio-drawer');
    el.btnDrawerCollapse = document.getElementById('btn-drawer-collapse');
    el.participantCountBadge = document.getElementById('participant-count-badge');
    el.btnAutoSeed = document.getElementById('btn-auto-seed');
    el.btnRandomSeed = document.getElementById('btn-random-seed');
    el.btnBulkAdd = document.getElementById('btn-bulk-add');
    el.addParticipantForm = document.getElementById('add-participant-form');
    el.newParticipantInput = document.getElementById('new-participant-input');
    el.participantsList = document.getElementById('participants-list');
    el.settingGameInput = document.getElementById('setting-game-input');
    el.settingBronzeMatch = document.getElementById('setting-bronze-match');
    el.btnResetScores = document.getElementById('btn-reset-scores');

    // Canvas
    el.canvasContainer = document.getElementById('canvas-container');
    el.bracketCanvas = document.getElementById('bracket-canvas');
    el.bracketSvg = document.getElementById('bracket-svg');
    el.bracketRoundsContainer = document.getElementById('bracket-rounds-container');
    el.btnZoomIn = document.getElementById('btn-zoom-in');
    el.btnZoomOut = document.getElementById('btn-zoom-out');
    el.btnZoomReset = document.getElementById('btn-zoom-reset');
    el.btnCenterBracket = document.getElementById('btn-center-bracket');
    el.zoomLevelText = document.getElementById('zoom-level-text');

    // Live View
    el.liveCanvasContainer = document.getElementById('live-canvas-container');
    el.liveCanvas = document.getElementById('live-canvas');
    el.liveSvg = document.getElementById('live-svg');
    el.liveRoundsContainer = document.getElementById('live-rounds-container');
    el.liveTournamentName = document.getElementById('live-tournament-name');
    el.liveGameBadge = document.getElementById('live-game-badge');
    el.btnLiveHighlight = document.getElementById('btn-live-highlight');
    el.btnLiveZoomIn = document.getElementById('btn-live-zoom-in');
    el.btnLiveZoomOut = document.getElementById('btn-live-zoom-out');
    el.btnLiveCenter = document.getElementById('btn-live-center');
    el.liveZoomText = document.getElementById('live-zoom-text');

    // Register View
    el.registerTournamentName = document.getElementById('register-tournament-name');
    el.registerTournamentMeta = document.getElementById('register-tournament-meta');
    el.registerCapacityText = document.getElementById('register-capacity-text');
    el.registerCapacityFill = document.getElementById('register-capacity-fill');
    el.publicRegisterForm = document.getElementById('public-register-form');
    el.registerSuccessBox = document.getElementById('register-success-box');
    el.btnViewLiveBracket = document.getElementById('btn-view-live-bracket');

    // Modals
    el.modalCreateTournament = document.getElementById('modal-create-tournament');
    el.formCreateTournament = document.getElementById('form-create-tournament');
    el.modalQrCode = document.getElementById('modal-qr-code');
    el.qrCodeDisplay = document.getElementById('qr-code-display');
    el.qrUrlText = document.getElementById('qr-url-text');
    el.btnCopyQrUrl = document.getElementById('btn-copy-qr-url');
    el.btnDownloadQr = document.getElementById('btn-download-qr');
    el.btnOpenRegPage = document.getElementById('btn-open-reg-page');

    el.modalMatchControl = document.getElementById('modal-match-control');
    el.modalMatchTitle = document.getElementById('modal-match-title');
    el.modalMatchRound = document.getElementById('modal-match-round');
    el.modalP1Seed = document.getElementById('modal-p1-seed');
    el.modalP1Name = document.getElementById('modal-p1-name');
    el.modalP1Score = document.getElementById('modal-p1-score');
    el.btnDirectWinP1 = document.getElementById('btn-direct-win-p1');
    el.modalP2Seed = document.getElementById('modal-p2-seed');
    el.modalP2Name = document.getElementById('modal-p2-name');
    el.modalP2Score = document.getElementById('modal-p2-score');
    el.btnDirectWinP2 = document.getElementById('btn-direct-win-p2');
    el.btnSaveMatchScore = document.getElementById('btn-save-match-score');
    el.btnClearMatchResult = document.getElementById('btn-clear-match-result');

    el.modalConfirm = document.getElementById('modal-confirm');
    el.confirmTitle = document.getElementById('confirm-title');
    el.confirmMessage = document.getElementById('confirm-message');
    el.btnConfirmAction = document.getElementById('btn-confirm-action');

    el.modalEditName = document.getElementById('modal-edit-name');
    el.formEditName = document.getElementById('form-edit-name');
    el.inputEditTournamentName = document.getElementById('input-edit-tournament-name');

    el.modalBulkAdd = document.getElementById('modal-bulk-add');
    el.formBulkAdd = document.getElementById('form-bulk-add');
    el.bulkParticipantsText = document.getElementById('bulk-participants-text');
    el.csvDropzone = document.getElementById('csv-dropzone');
    el.bulkCsvFile = document.getElementById('bulk-csv-file');
    el.csvFileStatus = document.getElementById('csv-file-status');
    el.csvFileName = document.getElementById('csv-file-name');
    el.btnClearCsv = document.getElementById('btn-clear-csv');

    el.createIsDoubles = document.getElementById('create-is-doubles');

    // Match Search Elements
    el.btnOpenMatchSearch = document.getElementById('btn-open-match-search');
    el.btnLiveMatchSearch = document.getElementById('btn-live-match-search');
    el.modalMatchSearch = document.getElementById('modal-match-search');
    el.inputSearchMatch = document.getElementById('input-search-match');
    el.matchSearchResults = document.getElementById('match-search-results');

    // Match Progress HUD Widgets
    el.studioProgressPct = document.getElementById('studio-progress-pct');
    el.studioProgressFill = document.getElementById('studio-progress-fill');
    el.studioProgressCount = document.getElementById('studio-progress-count');
    el.liveProgressPct = document.getElementById('live-progress-pct');
    el.liveProgressFill = document.getElementById('live-progress-fill');
    el.liveProgressCount = document.getElementById('live-progress-count');
    el.liveActiveMatchNames = document.getElementById('live-active-match-names');
    el.liveActiveMatchRound = document.getElementById('live-active-match-round');

    // QR Deadline Elements
    el.qrDeadlinePreset = document.getElementById('qr-deadline-preset');
    el.qrDeadlineCustom = document.getElementById('qr-deadline-custom');
    el.btnSaveQrDeadline = document.getElementById('btn-save-qr-deadline');
    el.qrDeadlineStatusBadge = document.getElementById('qr-deadline-status-badge');

    // Auto-Lock Bracket Elements
    el.settingAutoLockSelect = document.getElementById('setting-autolock-select');
    el.btnSaveAutoLock = document.getElementById('btn-save-autolock');
    el.studioAutolockBanner = document.getElementById('studio-autolock-banner');
    el.autolockCountdownText = document.getElementById('autolock-countdown-text');

    // Registration Form Elements
    el.regTeamNameGroup = document.getElementById('reg-team-name-group');
    el.regTeamName = document.getElementById('reg-team-name');
    el.regPlayerName = document.getElementById('reg-player-name');
    el.regPlayerWecom = document.getElementById('reg-player-wecom');
    el.regPlayerDept = document.getElementById('reg-player-dept');
    el.regPartnerSection = document.getElementById('reg-partner-section');
    el.regTeammateCountSelect = document.getElementById('reg-teammate-count-select');
    el.regPartnersDynamicContainer = document.getElementById('reg-partners-dynamic-container');
    el.regDeadlineBadge = document.getElementById('reg-deadline-badge');
    el.regDeadlineText = document.getElementById('reg-deadline-text');
    el.registerClosedBox = document.getElementById('register-closed-box');
    el.btnClosedViewLive = document.getElementById('btn-closed-view-live');
    el.successLiveUrl = document.getElementById('success-live-url');
    el.btnCopySuccessLive = document.getElementById('btn-copy-success-live');

    el.toastContainer = document.getElementById('toast-container');
  }

  // ==================== ROUTING & INITIALIZATION ====================
  async function initApp() {
    initElements();
    setupEventListeners();
    handleRoute();
    window.addEventListener('popstate', handleRoute);
    setInterval(updateAutoLockTimerUI, 1000);
  }

  function handleRoute() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || 'dashboard';
    const tournamentId = params.get('id');

    if (view === 'studio' && tournamentId) {
      loadTournamentStudio(tournamentId);
    } else if (view === 'live' && tournamentId) {
      loadPublicLiveView(tournamentId);
    } else if (view === 'register' && tournamentId) {
      loadPublicRegisterView(tournamentId);
    } else {
      loadDashboard();
    }
  }

  function switchView(viewName) {
    state.currentView = viewName;
    el.dashboardView.classList.add('hidden');
    el.studioView.classList.add('hidden');
    el.liveView.classList.add('hidden');
    el.registerView.classList.add('hidden');

    if (state.livePollingTimer) {
      clearInterval(state.livePollingTimer);
      state.livePollingTimer = null;
    }

    if (viewName === 'dashboard') el.dashboardView.classList.remove('hidden');
    if (viewName === 'studio') el.studioView.classList.remove('hidden');
    if (viewName === 'live') el.liveView.classList.remove('hidden');
    if (viewName === 'register') {
      el.registerView.classList.remove('hidden');
      el.registerView.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';
    if (type === 'warning') icon = 'fa-bolt';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${escapeHTML(message)}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  // ==================== DASHBOARD VIEW ====================
  async function loadDashboard() {
    switchView('dashboard');
    window.history.replaceState({}, '', window.location.pathname);
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      state.tournaments = data.tournaments || [];
      renderDashboardTournaments();
    } catch (err) {
      showToast('Error loading tournaments: ' + err.message, 'error');
    }
  }

  function renderDashboardTournaments() {
    const search = (el.dashboardSearchInput.value || '').trim().toLowerCase();
    const activeChip = document.querySelector('.filter-chip.active');
    const filter = activeChip ? activeChip.dataset.filter : 'all';

    let filtered = state.tournaments.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search) || (t.game && t.game.toLowerCase().includes(search));
      const matchFilter = filter === 'all' || t.status === filter;
      return matchSearch && matchFilter;
    });

    if (filtered.length === 0) {
      el.tournamentsGrid.innerHTML = '';
      el.dashboardEmptyState.classList.remove('hidden');
      return;
    }

    el.dashboardEmptyState.classList.add('hidden');
    el.tournamentsGrid.innerHTML = filtered.map(t => {
      const pCount = (t.participants || []).length;
      const statusClass = `badge-${t.status || 'setup'}`;
      const statusText = (t.status || 'setup').replace('_', ' ').toUpperCase();

      return `
        <div class="tournament-card" data-id="${t.id}">
          <div>
            <div class="card-top">
              <span class="card-game-badge">${escapeHTML(t.game || 'Esports')}</span>
              <span class="badge ${statusClass}">${statusText}</span>
            </div>
            <h3 class="card-title">${escapeHTML(t.name)}</h3>
            <div class="card-stats">
              <span><i class="fa-solid fa-users"></i> ${pCount} / ${t.maxParticipants || 8} Teams</span>
              <span><i class="fa-solid fa-sitemap"></i> Single Elimination</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-primary btn-open-studio" data-id="${t.id}">
              <i class="fa-solid fa-pen-to-square"></i> Studio
            </button>
            <button class="btn btn-sm btn-outline btn-card-live" data-id="${t.id}" title="Spectator View">
              <i class="fa-solid fa-eye"></i> Live
            </button>
            <button class="btn btn-sm btn-secondary btn-card-qr" data-id="${t.id}" title="Registration QR">
              <i class="fa-solid fa-qrcode"></i>
            </button>
            <button class="btn btn-sm btn-ghost btn-card-delete" data-id="${t.id}" title="Delete Tournament">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach card event listeners
    el.tournamentsGrid.querySelectorAll('.btn-open-studio').forEach(b => {
      b.addEventListener('click', () => navigateToStudio(b.dataset.id));
    });
    el.tournamentsGrid.querySelectorAll('.btn-card-live').forEach(b => {
      b.addEventListener('click', () => navigateToLive(b.dataset.id));
    });
    el.tournamentsGrid.querySelectorAll('.btn-card-qr').forEach(b => {
      b.addEventListener('click', () => openQrModalForTournament(b.dataset.id));
    });
    el.tournamentsGrid.querySelectorAll('.btn-card-delete').forEach(b => {
      b.addEventListener('click', () => confirmDeleteTournament(b.dataset.id));
    });
  }

  function navigateToStudio(id) {
    window.history.pushState({}, '', `?view=studio&id=${id}`);
    loadTournamentStudio(id);
  }

  function navigateToLive(id) {
    window.history.pushState({}, '', `?view=live&id=${id}`);
    loadPublicLiveView(id);
  }

  // ==================== STUDIO VIEW ====================
  async function loadTournamentStudio(tournamentId) {
    switchView('studio');
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) throw new Error('Tournament not found');
      const data = await res.json();
      state.currentTournament = data.tournament;
      setupStudioUI();
      renderBracketStudio();
    } catch (err) {
      showToast('Error loading studio: ' + err.message, 'error');
      loadDashboard();
    }
  }

  function setupStudioUI() {
    const t = state.currentTournament;
    el.studioTournamentName.textContent = t.name;
    el.studioStatusBadge.className = `badge badge-${t.status || 'setup'}`;
    el.studioStatusBadge.textContent = (t.status || 'setup').replace('_', ' ').toUpperCase();

    // Lock button state
    if (t.isLocked) {
      el.btnToggleLock.classList.add('locked');
      el.lockBtnText.textContent = 'Unlock Bracket';
      el.btnToggleLock.querySelector('i').className = 'fa-solid fa-lock-open';
    } else {
      el.btnToggleLock.classList.remove('locked');
      el.lockBtnText.textContent = 'Lock Bracket';
      el.btnToggleLock.querySelector('i').className = 'fa-solid fa-lock';
    }

    // Highlight In-progress button
    state.highlightInProgress = !!t.inProgressHighlight;
    if (state.highlightInProgress) {
      el.btnToggleHighlight.classList.add('active');
    } else {
      el.btnToggleHighlight.classList.remove('active');
    }

    // Settings
    el.settingGameInput.value = t.game || '';
    el.settingBronzeMatch.checked = !!(t.settings && t.settings.thirdPlaceMatch);

    // Apply theme
    applyTheme(t.settings?.theme || 'dark');

    // Render participants drawer list
    renderParticipantsDrawer();
  }

  let globalTooltipEl = null;

  function ensureGlobalTooltip() {
    if (!globalTooltipEl) {
      globalTooltipEl = document.getElementById('global-member-tooltip');
      if (!globalTooltipEl) {
        globalTooltipEl = document.createElement('div');
        globalTooltipEl.id = 'global-member-tooltip';
        globalTooltipEl.className = 'hidden';
        document.body.appendChild(globalTooltipEl);
      }
    }
  }

  function showGlobalTooltip(targetEl, p) {
    if (!p) return;
    const partnersList = Array.isArray(p.partners) && p.partners.length > 0
      ? p.partners
      : (p.partner && p.partner.name ? [p.partner] : []);

    if (partnersList.length === 0) return;
    ensureGlobalTooltip();

    globalTooltipEl.innerHTML = `
      <div class="member-row">
        <span class="member-label">Tim:</span>
        <span class="member-val">${escapeHTML(p.name)}</span>
      </div>
      <div class="member-row">
        <span class="member-label">Pemain Utama:</span>
        <span class="member-val">${escapeHTML(p.playerName || p.name)}</span>
        ${p.dept ? `<span class="member-dept">(${escapeHTML(p.dept)})</span>` : ''}
      </div>
      ${partnersList.map((partner, pIdx) => `
        <div class="member-row">
          <span class="member-label">Rekan ${partnersList.length > 1 ? `#${pIdx + 1}` : ''}:</span>
          <span class="member-val partner-highlight">${escapeHTML(partner.name)}</span>
          ${partner.dept ? `<span class="member-dept">(${escapeHTML(partner.dept)})</span>` : ''}
          ${partner.wecom ? `<span class="member-dept">• Wecom: ${escapeHTML(partner.wecom)}</span>` : ''}
        </div>
      `).join('')}
    `;

    globalTooltipEl.classList.remove('hidden');

    const rect = targetEl.getBoundingClientRect();
    const tooltipRect = globalTooltipEl.getBoundingClientRect();

    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;

    if (top < 10) {
      top = rect.bottom + 8;
    }
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    globalTooltipEl.style.top = `${top}px`;
    globalTooltipEl.style.left = `${left}px`;
  }

  function hideGlobalTooltip() {
    if (globalTooltipEl) {
      globalTooltipEl.classList.add('hidden');
    }
  }

  function renderParticipantsDrawer() {
    const t = state.currentTournament;
    const participants = t.participants || [];
    el.participantCountBadge.textContent = participants.length;

    if (participants.length === 0) {
      el.participantsList.innerHTML = `<div class="text-subtle" style="padding: 1rem 0; text-align: center;">No participants registered yet. Scan QR or add below.</div>`;
      return;
    }

    // Determine which participants are currently placed into the bracket
    const assignedIds = new Set();
    (t.rounds || []).forEach(r => {
      (r.matches || []).forEach(m => {
        if (m.p1 && m.p1.id && !m.p1.isPlaceholder && !m.p1.isUnseeded && m.p1.name && m.p1.name.trim()) assignedIds.add(m.p1.id);
        if (m.p2 && m.p2.id && !m.p2.isPlaceholder && !m.p2.isUnseeded && m.p2.name && m.p2.name.trim()) assignedIds.add(m.p2.id);
      });
    });

    el.participantsList.innerHTML = participants.map((p, idx) => {
      const partnersList = Array.isArray(p.partners) && p.partners.length > 0
        ? p.partners
        : (p.partner && p.partner.name ? [p.partner] : []);
      const hasPartner = partnersList.length > 0;
      const teamSize = 1 + partnersList.length;
      const hasInfo = !!(p.name && p.name.trim());
      const isAssigned = hasInfo && assignedIds.has(p.id);
      const canDrag = !t.isLocked && hasInfo;

      return `
        <div class="participant-item ${!hasInfo ? 'is-empty-slot' : ''}" draggable="${canDrag}" data-id="${p.id}" data-idx="${idx}">
          <i class="fa-solid fa-grip-vertical participant-drag-grip" style="${!hasInfo ? 'opacity:0.25; cursor:not-allowed;' : ''}"></i>
          <span class="participant-seed">${idx + 1}</span>
          <span class="participant-name ${!t.isLocked ? 'editable' : ''}" title="${hasInfo ? escapeHTML(p.name) : 'Slot Kosong (Isi nama terlebih dahulu untuk dapat memindahkannya ke bagan)'}">
            ${hasInfo ? escapeHTML(p.name) : '<span style="opacity:0.4; font-style:italic;">(Slot Kosong)</span>'}
            ${hasPartner ? `<span class="team-partner-tag" title="Mode Tim (${teamSize} Pemain)">${teamSize}P</span>` : ''}
          </span>
          <span class="participant-status-dot ${isAssigned ? 'seeded' : 'unseeded'}" title="${isAssigned ? 'Masuk Bagan' : (hasInfo ? 'Belum Di-seed' : 'Wajib Diisi')}"></span>
          ${!t.isLocked ? `
            <button type="button" class="btn-edit-participant" data-id="${p.id}" title="Edit Nama"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="btn-remove-participant" data-id="${p.id}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach hover events for team member tooltip
    el.participantsList.querySelectorAll('.participant-item').forEach(item => {
      const p = participants.find(part => part.id === item.dataset.id);
      const partnersList = Array.isArray(p?.partners) && p.partners.length > 0
        ? p.partners
        : (p?.partner && p.partner.name ? [p.partner] : []);
      if (partnersList.length > 0) {
        item.addEventListener('mouseenter', () => showGlobalTooltip(item, p));
        item.addEventListener('mouseleave', hideGlobalTooltip);
      }
    });

    // Attach drag and edit events to drawer participant items
    if (!t.isLocked) {
      el.participantsList.querySelectorAll('.participant-item').forEach(item => {
        item.addEventListener('dragstart', handleParticipantDragStart);
        item.addEventListener('dragend', handleParticipantDragEnd);
      });

      el.participantsList.querySelectorAll('.btn-edit-participant').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          startEditingParticipant(btn.dataset.id);
        });
      });

      el.participantsList.querySelectorAll('.participant-name').forEach(span => {
        span.addEventListener('click', (e) => {
          if (t.isLocked) return;
          e.stopPropagation();
          const parent = span.closest('.participant-item');
          if (parent) startEditingParticipant(parent.dataset.id);
        });
      });

      el.participantsList.querySelectorAll('.btn-remove-participant').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeParticipant(btn.dataset.id);
        });
      });
    }
  }

  // ==================== DYNAMIC ASYMMETRIC BRACKET ENGINE ====================
  /**
   * BracketHQ Asymmetric Non-Power-of-2 Generator:
   * Generates play-in matches on the left for unseeded entries,
   * while top seeds receiving BYEs enter directly in Round 2.
   */
  function generateBracketTree(participants, currentRounds = null, isAutoSeeding = false) {
    const validParticipantIds = new Set((participants || []).filter(p => p && p.id).map(p => p.id));
    const P = (participants || []).length;

    // CASE 0: 0 Participants -> Empty bracket
    if (P === 0) {
      return [];
    }

    const seedMap = {};
    (participants || []).forEach((p, idx) => {
      if (p && p.name && p.name.trim()) {
        seedMap[idx + 1] = p;
      }
    });

    const makeEmpty = (s) => ({ name: '', id: null, isPlaceholder: true, isUnseeded: true, seed: s });

    const getValidExisting = (existingP, fallbackP) => {
      if (existingP && existingP.id && validParticipantIds.has(existingP.id) && !existingP.isPlaceholder && !existingP.isUnseeded) {
        const part = (participants || []).find(p => p.id === existingP.id);
        if (part && part.name && part.name.trim()) {
          return existingP;
        }
      }
      return fallbackP;
    };

    // CASE 1: Exactly 1 Participant -> 1 Championship Final with empty slot, no dummy
    if (P === 1) {
      const existing = findExistingMatch(currentRounds, 1, 0);
      const defaultP1 = (isAutoSeeding && seedMap[1]) ? { ...seedMap[1], seed: 1, isPlaceholder: false, isUnseeded: false } : makeEmpty(1);
      const p1 = getValidExisting(existing?.p1, defaultP1);
      const p2 = makeEmpty(null);
      const isP1Placed = (p1.id && validParticipantIds.has(p1.id) && !p1.isUnseeded);

      return [{
        roundNumber: 1,
        title: 'Championship Final',
        matches: [{
          id: 'r1_m1',
          round: 1,
          matchIndex: 0,
          pairRange: [0, 0],
          p1,
          p2,
          p1Locked: isP1Placed ? !!existing?.p1Locked : false,
          p2Locked: false,
          score1: isP1Placed ? (existing?.score1 ?? '') : '',
          score2: '',
          winnerId: null,
          status: 'scheduled'
        }]
      }];
    }

    // CASE 2: Exactly 2 Participants -> Pure Championship Final
    if (P === 2) {
      const existing = findExistingMatch(currentRounds, 1, 0);
      const defaultP1 = (isAutoSeeding && seedMap[1]) ? { ...seedMap[1], seed: 1, isPlaceholder: false, isUnseeded: false } : makeEmpty(1);
      const defaultP2 = (isAutoSeeding && seedMap[2]) ? { ...seedMap[2], seed: 2, isPlaceholder: false, isUnseeded: false } : makeEmpty(2);
      const p1 = getValidExisting(existing?.p1, defaultP1);
      const p2 = getValidExisting(existing?.p2, defaultP2);
      const isValidMatch = (p1.id && validParticipantIds.has(p1.id) && !p1.isUnseeded) && (p2.id && validParticipantIds.has(p2.id) && !p2.isUnseeded);

      return [{
        roundNumber: 1,
        title: 'Championship Final',
        matches: [{
          id: 'r1_m1',
          round: 1,
          matchIndex: 0,
          pairRange: [0, 0],
          p1,
          p2,
          p1Locked: (p1.id && validParticipantIds.has(p1.id)) ? !!existing?.p1Locked : false,
          p2Locked: (p2.id && validParticipantIds.has(p2.id)) ? !!existing?.p2Locked : false,
          score1: isValidMatch ? (existing?.score1 ?? '') : '',
          score2: isValidMatch ? (existing?.score2 ?? '') : '',
          winnerId: isValidMatch ? (existing?.winnerId || null) : null,
          status: isValidMatch ? (existing?.status || 'scheduled') : 'scheduled'
        }]
      }];
    }

    // Universal Canonical Bracket Engine for any P >= 3 (BracketHQ logic)
    const N = Math.pow(2, Math.ceil(Math.log2(P)));
    const seedingOrder = getSeedingOrder(N);
    const numPairs = N / 2;
    const totalRounds = Math.log2(N);

    const pairs = [];
    for (let i = 0; i < numPairs; i++) {
      const s1 = seedingOrder[2 * i];
      const s2 = seedingOrder[2 * i + 1];
      pairs.push({ pair: i, s1, s2, isContested: s2 <= P });
    }

    const rounds = [];
    const isPurePowerOf2 = P === N;

    if (isPurePowerOf2) {
      // Pure power of 2 (4, 8, 16, 32...): All pairs are contested in Round 1
      const r1MatchCount = N / 2;
      const r1Matches = [];

      for (let i = 0; i < r1MatchCount; i++) {
        const s1 = seedingOrder[2 * i];
        const s2 = seedingOrder[2 * i + 1];
        const matchId = `r1_m${i + 1}`;
        const existing = findExistingMatch(currentRounds, 1, i);

        const defaultP1 = (isAutoSeeding && seedMap[s1]) ? { ...seedMap[s1], seed: s1, isPlaceholder: false, isUnseeded: false } : makeEmpty(s1);
        const defaultP2 = (isAutoSeeding && seedMap[s2]) ? { ...seedMap[s2], seed: s2, isPlaceholder: false, isUnseeded: false } : makeEmpty(s2);

        const p1 = getValidExisting(existing?.p1, defaultP1);
        const p2 = getValidExisting(existing?.p2, defaultP2);
        const isValidMatch = (p1.id && validParticipantIds.has(p1.id) && !p1.isUnseeded) && (p2.id && validParticipantIds.has(p2.id) && !p2.isUnseeded);

        r1Matches.push({
          id: matchId,
          round: 1,
          matchIndex: i,
          pairRange: [i, i],
          p1,
          p2,
          p1Locked: (p1.id && validParticipantIds.has(p1.id)) ? !!existing?.p1Locked : false,
          p2Locked: (p2.id && validParticipantIds.has(p2.id)) ? !!existing?.p2Locked : false,
          score1: isValidMatch ? (existing?.score1 ?? '') : '',
          score2: isValidMatch ? (existing?.score2 ?? '') : '',
          winnerId: isValidMatch ? (existing?.winnerId || null) : null,
          status: isValidMatch ? (existing?.status || 'scheduled') : 'scheduled'
        });
      }

      const r1Title = getRoundTitle(1, totalRounds, r1MatchCount);
      rounds.push({ roundNumber: 1, title: r1Title, matches: r1Matches });

      let prevMatches = r1Matches;
      let currRoundNum = 2;

      while (prevMatches.length > 1) {
        const nextMatches = [];
        const nextCount = prevMatches.length / 2;

        for (let i = 0; i < nextCount; i++) {
          const mTop = prevMatches[2 * i];
          const mBot = prevMatches[2 * i + 1];

          let p1 = null;
          if (mTop && mTop.winnerId) {
            p1 = mTop.winnerId === mTop.p1?.id ? mTop.p1 : mTop.p2;
          } else {
            p1 = { name: `Winner R${currRoundNum - 1} M${(mTop?.matchIndex ?? 0) + 1}`, isPlaceholder: true };
          }

          let p2 = null;
          if (mBot && mBot.winnerId) {
            p2 = mBot.winnerId === mBot.p1?.id ? mBot.p1 : mBot.p2;
          } else {
            p2 = { name: `Winner R${currRoundNum - 1} M${(mBot?.matchIndex ?? 0) + 1}`, isPlaceholder: true };
          }

          const matchId = `r${currRoundNum}_m${i + 1}`;
          const existing = findExistingMatch(currentRounds, currRoundNum, i);

          const startPair = mTop?.pairRange ? mTop.pairRange[0] : (2 * i * Math.pow(2, currRoundNum - 1));
          const endPair = mBot?.pairRange ? mBot.pairRange[1] : ((2 * i + 1) * Math.pow(2, currRoundNum - 1));

          const p1Valid = existing?.p1 && existing.p1.id && !existing.p1.isPlaceholder && !existing.p1.isUnseeded && validParticipantIds.has(existing.p1.id);
          const p2Valid = existing?.p2 && existing.p2.id && !existing.p2.isPlaceholder && !existing.p2.isUnseeded && validParticipantIds.has(existing.p2.id);

          nextMatches.push({
            id: matchId,
            round: currRoundNum,
            matchIndex: i,
            pairRange: [startPair, endPair],
            feederTopId: mTop?.id || null,
            feederBotId: mBot?.id || null,
            p1: p1Valid ? existing.p1 : p1,
            p2: p2Valid ? existing.p2 : p2,
            p1Locked: p1Valid ? !!existing?.p1Locked : false,
            p2Locked: p2Valid ? !!existing?.p2Locked : false,
            score1: (p1Valid && p2Valid) ? (existing?.score1 ?? '') : '',
            score2: (p1Valid && p2Valid) ? (existing?.score2 ?? '') : '',
            winnerId: (p1Valid && p2Valid && existing?.winnerId) ? existing.winnerId : null,
            status: (p1Valid && p2Valid) ? (existing?.status || 'scheduled') : 'scheduled'
          });
        }

        const roundTitle = getRoundTitle(currRoundNum, totalRounds, nextCount);
        rounds.push({ roundNumber: currRoundNum, title: roundTitle, matches: nextMatches });
        prevMatches = nextMatches;
        currRoundNum++;
      }

      return rounds;
    }

    // Non-Power-of-2 with BYEs (BracketHQ Logic):
    // Round 1: Only contested pairs (s2 <= P). Exactly P - N/2 matches.
    const contestedPairs = pairs.filter(p => p.isContested);
    const r1Matches = [];

    contestedPairs.forEach((cp, idx) => {
      const matchId = `r1_m${idx + 1}`;
      const existing = findExistingMatch(currentRounds, 1, idx);

      const defaultP1 = (isAutoSeeding && seedMap[cp.s1]) ? { ...seedMap[cp.s1], seed: cp.s1, isPlaceholder: false, isUnseeded: false } : makeEmpty(cp.s1);
      const defaultP2 = (isAutoSeeding && seedMap[cp.s2]) ? { ...seedMap[cp.s2], seed: cp.s2, isPlaceholder: false, isUnseeded: false } : makeEmpty(cp.s2);

      const p1 = getValidExisting(existing?.p1, defaultP1);
      const p2 = getValidExisting(existing?.p2, defaultP2);
      const isValidMatch = (p1.id && validParticipantIds.has(p1.id) && !p1.isUnseeded) && (p2.id && validParticipantIds.has(p2.id) && !p2.isUnseeded);

      r1Matches.push({
        id: matchId,
        round: 1,
        matchIndex: idx,
        parentPairIndex: cp.pair,
        pairRange: [cp.pair, cp.pair],
        p1,
        p2,
        p1Locked: (p1.id && validParticipantIds.has(p1.id)) ? !!existing?.p1Locked : false,
        p2Locked: (p2.id && validParticipantIds.has(p2.id)) ? !!existing?.p2Locked : false,
        score1: isValidMatch ? (existing?.score1 ?? '') : '',
        score2: isValidMatch ? (existing?.score2 ?? '') : '',
        winnerId: isValidMatch ? (existing?.winnerId || null) : null,
        status: isValidMatch ? (existing?.status || 'scheduled') : 'scheduled'
      });
    });

    const r1Title = getRoundTitle(1, totalRounds, contestedPairs.length);
    rounds.push({ roundNumber: 1, title: r1Title, matches: r1Matches });

    // Round 2: Exactly N / 4 matches.
    // Each match i connects to Pair 2*i (top) and Pair 2*i + 1 (bot).
    // If a pair had a Round 1 match, it is fed by that match.
    // If a pair had a BYE, it is fed directly by that seed!
    const r2Matches = [];
    const r2MatchCount = N / 4;

    for (let i = 0; i < r2MatchCount; i++) {
      const topPairIdx = 2 * i;
      const botPairIdx = 2 * i + 1;
      const topPair = pairs[topPairIdx];
      const botPair = pairs[botPairIdx];

      const feederTop = r1Matches.find(m => m.parentPairIndex === topPairIdx);
      const feederBot = r1Matches.find(m => m.parentPairIndex === botPairIdx);

      const matchId = `r2_m${i + 1}`;
      const existing = findExistingMatch(currentRounds, 2, i);

      let p1 = null;
      let feederTopId = null;
      if (feederTop) {
        feederTopId = feederTop.id;
        if (feederTop.winnerId) {
          p1 = feederTop.winnerId === feederTop.p1?.id ? feederTop.p1 : feederTop.p2;
        } else {
          p1 = { name: `Winner R1 M${(feederTop.matchIndex ?? 0) + 1}`, isPlaceholder: true };
        }
      } else {
        // Direct BYE from topPair.s1
        const defaultP1 = (isAutoSeeding && seedMap[topPair.s1]) ? { ...seedMap[topPair.s1], seed: topPair.s1, isPlaceholder: false, isUnseeded: false } : makeEmpty(topPair.s1);
        p1 = getValidExisting(existing?.p1, defaultP1);
      }

      let p2 = null;
      let feederBotId = null;
      if (feederBot) {
        feederBotId = feederBot.id;
        if (feederBot.winnerId) {
          p2 = feederBot.winnerId === feederBot.p1?.id ? feederBot.p1 : feederBot.p2;
        } else {
          p2 = { name: `Winner R1 M${(feederBot.matchIndex ?? 0) + 1}`, isPlaceholder: true };
        }
      } else {
        // Direct BYE from botPair.s1
        const defaultP2 = (isAutoSeeding && seedMap[botPair.s1]) ? { ...seedMap[botPair.s1], seed: botPair.s1, isPlaceholder: false, isUnseeded: false } : makeEmpty(botPair.s1);
        p2 = getValidExisting(existing?.p2, defaultP2);
      }

      const p1Valid = feederTopId ? (p1 && !p1.isPlaceholder) : (existing?.p1 && existing.p1.id && !existing.p1.isPlaceholder && !existing.p1.isUnseeded && validParticipantIds.has(existing.p1.id));
      const p2Valid = feederBotId ? (p2 && !p2.isPlaceholder) : (existing?.p2 && existing.p2.id && !existing.p2.isPlaceholder && !existing.p2.isUnseeded && validParticipantIds.has(existing.p2.id));

      r2Matches.push({
        id: matchId,
        round: 2,
        matchIndex: i,
        pairRange: [topPairIdx, botPairIdx],
        feederTopId,
        feederBotId,
        p1: feederTopId ? p1 : (p1Valid ? existing.p1 : p1),
        p2: feederBotId ? p2 : (p2Valid ? existing.p2 : p2),
        p1Locked: p1Valid ? !!existing?.p1Locked : false,
        p2Locked: p2Valid ? !!existing?.p2Locked : false,
        score1: (p1Valid && p2Valid) ? (existing?.score1 ?? '') : '',
        score2: (p1Valid && p2Valid) ? (existing?.score2 ?? '') : '',
        winnerId: (p1Valid && p2Valid && existing?.winnerId) ? existing.winnerId : null,
        status: (p1Valid && p2Valid) ? (existing?.status || 'scheduled') : 'scheduled'
      });
    }

    const r2Title = getRoundTitle(2, totalRounds, r2MatchCount);
    rounds.push({ roundNumber: 2, title: r2Title, matches: r2Matches });

    // Subsequent rounds (Round 3 onwards down to Championship Final)
    let prevMatches = r2Matches;
    let currRoundNum = 3;

    while (prevMatches.length > 1) {
      const nextMatches = [];
      const nextCount = prevMatches.length / 2;

      for (let i = 0; i < nextCount; i++) {
        const mTop = prevMatches[2 * i];
        const mBot = prevMatches[2 * i + 1];

        let p1 = null;
        if (mTop && mTop.winnerId) {
          p1 = mTop.winnerId === mTop.p1?.id ? mTop.p1 : mTop.p2;
        } else {
          p1 = { name: `Winner R${currRoundNum - 1} M${(mTop?.matchIndex ?? 0) + 1}`, isPlaceholder: true };
        }

        let p2 = null;
        if (mBot && mBot.winnerId) {
          p2 = mBot.winnerId === mBot.p1?.id ? mBot.p1 : mBot.p2;
        } else {
          p2 = { name: `Winner R${currRoundNum - 1} M${(mBot?.matchIndex ?? 0) + 1}`, isPlaceholder: true };
        }

        const matchId = `r${currRoundNum}_m${i + 1}`;
        const existing = findExistingMatch(currentRounds, currRoundNum, i);

        const startPair = mTop?.pairRange ? mTop.pairRange[0] : (2 * i * Math.pow(2, currRoundNum - 1));
        const endPair = mBot?.pairRange ? mBot.pairRange[1] : ((2 * i + 1) * Math.pow(2, currRoundNum - 1));

        const p1Valid = existing?.p1 && existing.p1.id && !existing.p1.isPlaceholder && !existing.p1.isUnseeded && validParticipantIds.has(existing.p1.id);
        const p2Valid = existing?.p2 && existing.p2.id && !existing.p2.isPlaceholder && !existing.p2.isUnseeded && validParticipantIds.has(existing.p2.id);

        nextMatches.push({
          id: matchId,
          round: currRoundNum,
          matchIndex: i,
          pairRange: [startPair, endPair],
          feederTopId: mTop?.id || null,
          feederBotId: mBot?.id || null,
          p1: p1Valid ? existing.p1 : p1,
          p2: p2Valid ? existing.p2 : p2,
          p1Locked: p1Valid ? !!existing?.p1Locked : false,
          p2Locked: p2Valid ? !!existing?.p2Locked : false,
          score1: (p1Valid && p2Valid) ? (existing?.score1 ?? '') : '',
          score2: (p1Valid && p2Valid) ? (existing?.score2 ?? '') : '',
          winnerId: (p1Valid && p2Valid && existing?.winnerId) ? existing.winnerId : null,
          status: (p1Valid && p2Valid) ? (existing?.status || 'scheduled') : 'scheduled'
        });
      }

      const roundTitle = getRoundTitle(currRoundNum, totalRounds, nextCount);
      rounds.push({ roundNumber: currRoundNum, title: roundTitle, matches: nextMatches });
      prevMatches = nextMatches;
      currRoundNum++;
    }

    return rounds;
  }

  function getRoundTitle(roundNum, totalRounds, matchCount) {
    const roundsFromFinal = totalRounds - roundNum;
    if (roundsFromFinal === 0) return 'Championship Final';
    if (roundsFromFinal === 1) return 'Semifinals';
    if (roundsFromFinal === 2) return 'Quarterfinals';
    if (roundsFromFinal === 3) return 'Round of 16';
    if (roundsFromFinal === 4) return 'Round of 32';
    if (roundsFromFinal === 5) return 'Round of 64';
    return `Round ${roundNum}`;
  }

  function getSeedingOrder(N) {
    let order = [1, 2];
    while (order.length < N) {
      const next = [];
      const sum = order.length * 2 + 1;
      for (let i = 0; i < order.length; i++) {
        next.push(order[i]);
        next.push(sum - order[i]);
      }
      order = next;
    }
    return order;
  }

  function findExistingMatch(currentRounds, roundNum, matchIdx) {
    if (!currentRounds || !Array.isArray(currentRounds)) return null;
    const r = currentRounds.find(item => item.roundNumber === roundNum);
    if (!r || !r.matches) return null;
    return r.matches[matchIdx] || null;
  }

  function findNextUpMatch(rounds) {
    if (!rounds || !Array.isArray(rounds)) return null;
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const round = rounds[rIdx];
      for (let mIdx = 0; mIdx < (round.matches || []).length; mIdx++) {
        const m = round.matches[mIdx];
        const p1Ready = m.p1 && m.p1.id && m.p1.name && m.p1.name !== 'TBD';
        const p2Ready = m.p2 && m.p2.id && m.p2.name && m.p2.name !== 'TBD';
        if (m.status === 'scheduled' && p1Ready && p2Ready) {
          return { match: m, rIdx, mIdx, roundTitle: round.title };
        }
      }
    }
    return null;
  }

  function renderBracketStudio() {
    const t = state.currentTournament;
    if (!t) return;

    const P = (t.participants || []).length;
    const hasParticipants = P > 0;
    const currentTotalMatches = (t.rounds || []).reduce((acc, r) => acc + (r.matches || []).length, 0);
    const expectedTotalMatches = P > 1 ? P - 1 : (P === 1 ? 1 : 0);

    // Generate or hydrate bracket tree if missing, lacking pairRange, or match count mismatch
    const needsHydration = hasParticipants && (
      !t.rounds ||
      t.rounds.length === 0 ||
      (!t.isLocked && currentTotalMatches !== expectedTotalMatches) ||
      t.rounds.some(r => r.matches.some(m => !m.pairRange))
    );

    if (needsHydration) {
      t.rounds = generateBracketTree(t.participants || [], t.rounds);
      saveTournamentState(false);
    } else if (!hasParticipants && t.rounds && t.rounds.length > 0) {
      t.rounds = [];
      saveTournamentState(false);
    } else if (P === 1 && (t.rounds.length !== 1 || t.rounds[0].matches.length !== 1 || !t.rounds[0].matches[0].p2?.isPlaceholder)) {
      t.rounds = generateBracketTree(t.participants, null);
      saveTournamentState(false);
    }

    renderBracketView(el.bracketRoundsContainer, el.bracketSvg, t.rounds, false);
    updateMatchProgressHUD(t.rounds, false);
    updateAutoLockTimerUI();
    applyCanvasTransform(el.bracketCanvas);
  }

  function getOrInitThirdPlaceMatch(t) {
    if (!t || !t.settings?.thirdPlaceMatch) return null;
    const numRounds = (t.rounds || []).length;
    if (numRounds < 2) return null; // Only applicable when semifinals exist (>= 4 teams)

    const sfRound = t.rounds[numRounds - 2];
    const sf1 = sfRound?.matches[0];
    const sf2 = sfRound?.matches[1];

    let p1 = null;
    let p2 = null;

    if (sf1 && sf1.winnerId) {
      const loser = sf1.winnerId === sf1.p1?.id ? sf1.p2 : sf1.p1;
      p1 = loser ? { ...loser, isPlaceholder: false } : { name: 'Loser SF1', isPlaceholder: true };
    } else {
      p1 = { name: 'Loser Semifinal 1', isPlaceholder: true };
    }

    if (sf2 && sf2.winnerId) {
      const loser = sf2.winnerId === sf2.p1?.id ? sf2.p2 : sf2.p1;
      p2 = loser ? { ...loser, isPlaceholder: false } : { name: 'Loser SF2', isPlaceholder: true };
    } else {
      p2 = { name: 'Loser Semifinal 2', isPlaceholder: true };
    }

    if (!t.thirdPlaceMatch) {
      t.thirdPlaceMatch = {
        id: 'match_bronze',
        isBronzeMatch: true,
        round: numRounds,
        matchIndex: 999,
        pairRange: [0, Math.pow(2, numRounds - 1)],
        feederTopId: sf1?.id || null,
        feederBotId: sf2?.id || null,
        p1,
        p2,
        score1: '',
        score2: '',
        winnerId: null,
        status: 'scheduled'
      };
    } else {
      t.thirdPlaceMatch.isBronzeMatch = true;
      if (!t.thirdPlaceMatch.winnerId) {
        if (!t.thirdPlaceMatch.p1 || t.thirdPlaceMatch.p1.isPlaceholder) {
          t.thirdPlaceMatch.p1 = p1;
        }
        if (!t.thirdPlaceMatch.p2 || t.thirdPlaceMatch.p2.isPlaceholder) {
          t.thirdPlaceMatch.p2 = p2;
        }
      }
    }

    return t.thirdPlaceMatch;
  }

  function renderBracketView(roundsContainer, svgEl, rounds, isLiveView = false) {
    roundsContainer.innerHTML = '';
    svgEl.innerHTML = '';

    const MATCH_WIDTH = 240;
    const MATCH_HEIGHT = 84;
    const COLUMN_GAP = 80;
    const SLOT_HEIGHT = 126; // Canonical vertical distance between consecutive leaf pairs
    const MIN_VERTICAL_GAP = 28;

    const roundMatchPositions = []; // [roundIdx][matchIdx]
    const matchPositionsMap = {};   // matchId -> { x, y, width, height, match }
    const nextUpInfo = findNextUpMatch(rounds);

    const t = isLiveView ? state.liveTournamentData : state.currentTournament;
    const bronzeMatch = getOrInitThirdPlaceMatch(t);

    // Prepare column definitions (Standard 1-Sided Left-to-Right layout)
    const numRounds = (rounds || []).length;
    const colDefs = (rounds || []).map((round, rIdx) => {
      const isFinal = rIdx === numRounds - 1;
      const matches = [...round.matches];
      if (isFinal && bronzeMatch) {
        matches.push(bronzeMatch);
      }
      return {
        roundIdx: rIdx,
        roundTitle: round.title,
        matches,
        isRight: false,
        isCenter: isFinal
      };
    });

    colDefs.forEach((colDef, cIdx) => {
      const { roundIdx: rIdx, roundTitle, matches } = colDef;
      const col = document.createElement('div');
      col.className = 'round-column';
      col.dataset.round = rIdx + 1;
      if (colDef.isCenter) col.classList.add('center-final');

      col.innerHTML = `
        <div class="round-header">
          <span class="round-title">${escapeHTML(roundTitle)}</span>
        </div>
        <div class="round-matches" id="round-matches-${cIdx}"></div>
      `;
      roundsContainer.appendChild(col);

      const matchesHolder = col.querySelector('.round-matches');
      roundMatchPositions[rIdx] = roundMatchPositions[rIdx] || [];

      // 1. Calculate target center Y for each match based on leaf pair range
      const items = matches.map((match) => {
        const origMIdx = match.isBronzeMatch ? 999 : rounds[rIdx].matches.findIndex(m => m.id === match.id);
        let targetY = 0;

        if (numRounds <= 1) {
          // Single match tournament (e.g. 2 participants): comfortably centered
          targetY = 80;
        } else if (match.isBronzeMatch) {
          // Bronze match: positioned directly below the Championship Final
          const finalMatch = rounds[rIdx].matches[0];
          let finalTargetY = 0;
          if (finalMatch && finalMatch.pairRange && Array.isArray(finalMatch.pairRange)) {
            finalTargetY = ((finalMatch.pairRange[0] + finalMatch.pairRange[1]) / 2) * SLOT_HEIGHT;
          }
          targetY = finalTargetY + MATCH_HEIGHT + 50;
        } else {
          // Standard 1-sided bracket node
          if (match.pairRange && Array.isArray(match.pairRange)) {
            const centerPair = (match.pairRange[0] + match.pairRange[1]) / 2;
            targetY = centerPair * SLOT_HEIGHT;
          } else {
            targetY = origMIdx * (MATCH_HEIGHT + MIN_VERTICAL_GAP) * Math.pow(2, rIdx);
          }
        }
        return { match, origMIdx, targetY };
      });

      // 2. Sort by targetY ascending to maintain strict top-to-bottom visual hierarchy
      items.sort((a, b) => a.targetY - b.targetY);

      // 3. Enforce strict non-overlapping vertical separation
      for (let i = 0; i < items.length; i++) {
        if (i === 0) {
          items[i].finalY = items[i].targetY;
        } else {
          const minAllowedY = items[i - 1].finalY + MATCH_HEIGHT + MIN_VERTICAL_GAP;
          items[i].finalY = Math.max(items[i].targetY, minAllowedY);
        }
      }

      let maxColY = 0;

      // 4. Render match cards and register exact anchor coordinates
      items.forEach(item => {
        const { match, origMIdx, finalY } = item;
        const posX = cIdx * (MATCH_WIDTH + COLUMN_GAP);

        const posObj = {
          id: match.id,
          x: posX,
          y: finalY,
          width: MATCH_WIDTH,
          height: MATCH_HEIGHT,
          match,
          isRight: !!colDef.isRight,
          isCenter: !!colDef.isCenter
        };

        roundMatchPositions[rIdx][origMIdx] = posObj;
        matchPositionsMap[match.id] = posObj;

        // Render Match Node Card
        const isNextUp = nextUpInfo && nextUpInfo.match.id === match.id;
        const node = createMatchNodeElement(match, rIdx, origMIdx, isLiveView, finalY, isNextUp);
        matchesHolder.appendChild(node);

        if (finalY + MATCH_HEIGHT > maxColY) {
          maxColY = finalY + MATCH_HEIGHT;
        }
      });

      matchesHolder.style.minHeight = `${maxColY + 40}px`;
    });

    // Draw SVG Connectors between rounds
    drawBracketConnectors(svgEl, matchPositionsMap, rounds);
  }

  function createMatchNodeElement(match, rIdx, mIdx, isLiveView, posY, isNextUp = false) {
    const t = state.currentTournament;
    const node = document.createElement('div');
    node.className = 'match-node';
    node.style.top = `${posY}px`;
    node.dataset.round = rIdx + 1;
    node.dataset.match = mIdx;
    node.dataset.id = match.id;

    // Highlight in-progress match if enabled
    if (state.highlightInProgress && match.status === 'in_progress') {
      node.classList.add('match-in-progress-highlight');
    }

    // Highlight upcoming next match
    if (isNextUp) {
      node.classList.add('match-up-next-highlight');
    }

    if (match.isBronzeMatch) {
      node.classList.add('is-bronze');
    }

    const p1 = match.p1 || { name: 'TBD', seed: '' };
    const p2 = match.p2 || { name: 'TBD', seed: '' };

    const p1IsWinner = match.winnerId && match.winnerId === p1.id;
    const p2IsWinner = match.winnerId && match.winnerId === p2.id;

    const p1Class = p1IsWinner ? 'winner' : (p2IsWinner ? 'loser' : '');
    const p2Class = p2IsWinner ? 'winner' : (p1IsWinner ? 'loser' : '');

    const statusBadgeClass = `match-status-tag ${match.status || 'scheduled'}`;
    const statusText = (match.status || 'scheduled').replace('_', ' ');
    const statusBadgeHtml = isNextUp
      ? `<span class="match-status-tag next_up" title="Pertandingan yang akan bertanding selanjutnya!"><span class="pulse-indicator-amber"></span> AKAN MAIN</span>`
      : `<span class="${statusBadgeClass}">${statusText}</span>`;

    const renderRow = (p, slot, score, pClass) => {
      const isSlotLocked = slot === 'p1' ? !!match.p1Locked : !!match.p2Locked;
      const isFeeder = !!(slot === 'p1' ? match.feederTopId : match.feederBotId);
      const isEmpty = !p || !p.id || p.isUnseeded || (p.isPlaceholder && !isFeeder);
      const rawName = (p?.name || '').trim();
      const isUnnamed = !isEmpty && !rawName;
      const displayName = isEmpty
        ? (isFeeder ? (p?.name || 'TBD') : '')
        : (rawName || '(Slot Kosong)');

      const partnersList = Array.isArray(p?.partners) && p.partners.length > 0
        ? p.partners
        : (p?.partner && p?.partner.name ? [p.partner] : []);
      const hasPartner = !isEmpty && partnersList.length > 0;
      const teamSize = 1 + partnersList.length;

      const editBtnHtml = (!isLiveView && !t?.isLocked && !isFeeder && !match.isBronzeMatch)
        ? `<button type="button" class="btn-slot-edit" data-slot="${slot}" data-round="${rIdx}" data-match="${mIdx}" title="Edit Nama Peserta">
            <i class="fa-solid fa-pen"></i>
          </button>`
        : '';

      const lockBtnHtml = (!isLiveView && !t?.isLocked && !isFeeder && !match.isBronzeMatch)
        ? `<button type="button" class="btn-slot-lock ${isSlotLocked ? 'locked' : ''}" data-slot="${slot}" data-round="${rIdx}" data-match="${mIdx}" title="${isSlotLocked ? 'Slot Terkunci (klik untuk buka)' : 'Kunci Slot (klik agar tidak terpengaruh acak/random)'}">
            <i class="fa-solid ${isSlotLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
          </button>`
        : (isSlotLocked ? `<span class="slot-locked-tag" title="Slot Terkunci"><i class="fa-solid fa-lock"></i></span>` : '');

      return `
        <div class="match-team-row ${pClass} ${isEmpty ? 'is-empty' : ''} ${isSlotLocked ? 'slot-locked' : ''}" data-slot="${slot}" data-round="${rIdx}" data-match="${mIdx}">
          <span class="team-seed">${!isEmpty ? (p?.seed || '') : ''}</span>
          <span class="team-name-text ${isEmpty ? 'empty-slot' : ''} ${(!isLiveView && !t?.isLocked && !isFeeder) ? 'editable' : ''}" title="${escapeHTML(rawName || (isEmpty ? '' : '(Slot Kosong)'))}${(!isLiveView && !t?.isLocked && !isFeeder) ? ' (Dobel klik untuk edit)' : ''}">
            ${isUnnamed ? '<span style="opacity:0.4; font-style:italic;">(Slot Kosong)</span>' : escapeHTML(displayName)}
            ${hasPartner ? `<span class="team-partner-tag" title="Mode Tim (${teamSize} Pemain)">${teamSize}P</span>` : ''}
          </span>
          <div class="slot-actions-cell" style="display:flex; align-items:center; gap:4px; margin-left:auto;">
            ${editBtnHtml}
            ${lockBtnHtml}
            <span class="team-score-badge">${score !== '' && score !== undefined ? score : ''}</span>
          </div>
        </div>
      `;
    };

    const matchLabel = match.isBronzeMatch ? '🥉 3RD PLACE (BRONZE)' : `MATCH ${mIdx + 1}`;
    node.innerHTML = `
      <div class="match-meta-strip ${match.isBronzeMatch ? 'bronze-meta-strip' : ''}">
        <span>${matchLabel}</span>
        ${statusBadgeHtml}
      </div>
      ${renderRow(p1, 'p1', match.score1, p1Class)}
      ${renderRow(p2, 'p2', match.score2, p2Class)}
    `;

    // Attach click listener for individual slot lock buttons
    node.querySelectorAll('.btn-slot-lock').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleToggleSlotLock(btn.dataset.round, btn.dataset.match, btn.dataset.slot);
      });
    });

    // Attach click listener for slot edit buttons
    node.querySelectorAll('.btn-slot-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        startEditingMatchSlot(parseInt(btn.dataset.round, 10), parseInt(btn.dataset.match, 10), btn.dataset.slot);
      });
    });

    // Double-click on team-name-text to edit slot name
    if (!isLiveView && !t?.isLocked) {
      node.querySelectorAll('.match-team-row').forEach(row => {
        const slot = row.dataset.slot;
        const isFeeder = !!(slot === 'p1' ? match.feederTopId : match.feederBotId);
        if (!isFeeder && !match.isBronzeMatch) {
          row.querySelector('.team-name-text')?.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            startEditingMatchSlot(rIdx, mIdx, slot);
          });
        }
      });
    }

    // Attach hover events for team member tooltip on match rows
    const row1 = node.querySelector('[data-slot="p1"]');
    const row2 = node.querySelector('[data-slot="p2"]');
    const p1Partners = Array.isArray(p1.partners) && p1.partners.length > 0 ? p1.partners : (p1.partner && p1.partner.name ? [p1.partner] : []);
    const p2Partners = Array.isArray(p2.partners) && p2.partners.length > 0 ? p2.partners : (p2.partner && p2.partner.name ? [p2.partner] : []);

    if (row1 && p1Partners.length > 0) {
      row1.addEventListener('mouseenter', () => showGlobalTooltip(row1, p1));
      row1.addEventListener('mouseleave', hideGlobalTooltip);
    }
    if (row2 && p2Partners.length > 0) {
      row2.addEventListener('mouseenter', () => showGlobalTooltip(row2, p2));
      row2.addEventListener('mouseleave', hideGlobalTooltip);
    }

    // Interactive Drag & Drop Seeding on Match Rows
    if (!isLiveView && !t?.isLocked) {
      const rows = node.querySelectorAll('.match-team-row');
      rows.forEach(row => {
        row.setAttribute('draggable', 'true');
        row.addEventListener('dragstart', handleMatchSlotDragStart);
        row.addEventListener('dragover', handleSlotDragOver);
        row.addEventListener('dragleave', handleSlotDragLeave);
        row.addEventListener('drop', handleSlotDrop);
      });
    }

    // Click to open Match Controller Modal
    if (!isLiveView) {
      node.addEventListener('click', (e) => {
        if (e.target.closest('.btn-slot-lock')) return;
        if (!t.isLocked) {
          showToast('Kunci bracket terlebih dahulu (Lock Bracket) untuk memulai pertandingan dan input skor!', 'warning');
          return;
        }
        openMatchControlModal(match, rIdx, mIdx);
      });
    }

    return node;
  }

  // Draw Smooth Orthogonal SVG Connectors between rounds using exact match coordinates
  function drawBracketConnectors(svgEl, matchPositionsMap, rounds) {
    const PADDING_OFFSET = 60;
    const HEADER_OFFSET = 48;

    rounds.forEach(round => {
      round.matches.forEach(match => {
        if (match.isBronzeMatch) return;
        const target = matchPositionsMap[match.id];
        if (!target) return;

        const targetSlot1Y = target.y + HEADER_OFFSET + 28 + PADDING_OFFSET;
        const targetSlot2Y = target.y + HEADER_OFFSET + 56 + PADDING_OFFSET;

        // Feeder for top slot
        if (match.feederTopId && matchPositionsMap[match.feederTopId]) {
          const f1 = matchPositionsMap[match.feederTopId];
          let startX, targetX;
          if (f1.x < target.x) {
            startX = f1.x + f1.width + PADDING_OFFSET;
            targetX = target.x + PADDING_OFFSET;
          } else {
            startX = f1.x + PADDING_OFFSET;
            targetX = target.x + target.width + PADDING_OFFSET;
          }
          const startY = f1.y + HEADER_OFFSET + 42 + PADDING_OFFSET;
          drawOrthogonalPath(svgEl, startX, startY, targetX, targetSlot1Y);
        }

        // Feeder for bottom slot
        if (match.feederBotId && matchPositionsMap[match.feederBotId]) {
          const f2 = matchPositionsMap[match.feederBotId];
          let startX, targetX;
          if (f2.x < target.x) {
            startX = f2.x + f2.width + PADDING_OFFSET;
            targetX = target.x + PADDING_OFFSET;
          } else {
            startX = f2.x + PADDING_OFFSET;
            targetX = target.x + target.width + PADDING_OFFSET;
          }
          const startY = f2.y + HEADER_OFFSET + 42 + PADDING_OFFSET;
          drawOrthogonalPath(svgEl, startX, startY, targetX, targetSlot2Y);
        }
      });
    });
  }

  function drawOrthogonalPath(svgEl, x1, y1, x2, y2) {
    const midX = (x1 + x2) / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'connector-line');
    path.setAttribute('d', `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`);
    svgEl.appendChild(path);
  }

  // ==================== DRAG AND DROP SEEDING ====================
  function handleParticipantDragStart(e) {
    const t = state.currentTournament;
    const participant = (t?.participants || []).find(p => p.id === this.dataset.id);
    if (!participant || !participant.name || !participant.name.trim()) {
      e.preventDefault();
      showToast('Slot masih kosong! Masukkan nama peserta terlebih dahulu sebelum memindahkannya ke bagan.', 'warning');
      return false;
    }

    state.draggedParticipant = {
      id: this.dataset.id,
      index: parseInt(this.dataset.idx, 10),
      name: participant.name.trim()
    };
    state.draggedSlot = null;
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.dataset.id);
  }

  function handleParticipantDragEnd() {
    this.classList.remove('dragging');
  }

  function handleMatchSlotDragStart(e) {
    state.draggedSlot = {
      round: parseInt(this.dataset.round, 10),
      match: parseInt(this.dataset.match, 10),
      slot: this.dataset.slot
    };
    state.draggedParticipant = null;
    e.dataTransfer.setData('text/plain', 'match-slot');
  }

  function handleSlotDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
  }

  function handleSlotDragLeave() {
    this.classList.remove('drag-over');
  }

  function handleSlotDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const targetRound = parseInt(this.dataset.round, 10);
    const targetMatch = parseInt(this.dataset.match, 10);
    const targetSlot = this.dataset.slot;

    const t = state.currentTournament;
    if (!t || t.isLocked) return;

    const roundData = t.rounds[targetRound];
    if (!roundData || !roundData.matches[targetMatch]) return;
    const match = roundData.matches[targetMatch];

    if (state.draggedParticipant) {
      // Assign dragged participant to this match slot
      const participant = t.participants.find(p => p.id === state.draggedParticipant.id);
      if (!participant || !participant.name || !participant.name.trim()) {
        showToast('Slot masih kosong! Masukkan nama peserta terlebih dahulu.', 'warning');
        return;
      }

      // Prevent duplicate assignment: clear from any other match slot first
      (t.rounds || []).forEach(r => {
        (r.matches || []).forEach(m => {
          if (m.p1 && m.p1.id === participant.id) {
            m.p1 = makeEmpty(m.p1.seed || '');
          }
          if (m.p2 && m.p2.id === participant.id) {
            m.p2 = makeEmpty(m.p2.seed || '');
          }
        });
      });

      match[targetSlot] = {
        id: participant.id,
        name: participant.name.trim(),
        seed: state.draggedParticipant.index + 1
      };
      showToast(`Assigned ${participant.name.trim()} to Round ${targetRound + 1} Match ${targetMatch + 1}!`, 'success');
      saveTournamentState(true);
      renderParticipantsDrawer();
      renderBracketStudio();
    } else if (state.draggedSlot) {
      // Swap slots between two matches
      const srcMatch = t.rounds[state.draggedSlot.round].matches[state.draggedSlot.match];
      const temp = srcMatch[state.draggedSlot.slot];
      srcMatch[state.draggedSlot.slot] = match[targetSlot];
      match[targetSlot] = temp;

      showToast('Swapped participant bracket seeds!', 'success');
      saveTournamentState(true);
      renderBracketStudio();
    }
  }

  // ==================== MATCH CONTROLLER (SCORE & DIRECT WIN) ====================
  function openMatchControlModal(match, rIdx, mIdx) {
    state.selectedMatchForEdit = { match, rIdx, mIdx };
    if (match.isBronzeMatch) {
      el.modalMatchTitle.textContent = 'Perebutan Juara 3 (Bronze Match)';
      el.modalMatchRound.textContent = '🥉 3rd Place Match';
    } else {
      el.modalMatchTitle.textContent = `Match ${mIdx + 1} Management`;
      el.modalMatchRound.textContent = state.currentTournament.rounds[rIdx]?.title || `Round ${rIdx + 1}`;
    }

    // Set Status active button
    const currentStatus = match.status || 'scheduled';
    el.modalMatchControl.querySelectorAll('.status-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === currentStatus);
    });

    const p1 = match.p1 || { name: 'TBD', seed: '' };
    const p2 = match.p2 || { name: 'TBD', seed: '' };

    el.modalP1Seed.textContent = p1.seed ? `#${p1.seed}` : '-';
    el.modalP1Name.textContent = p1.name;
    el.modalP1Score.value = match.score1 !== undefined && match.score1 !== '' ? match.score1 : 0;

    el.modalP2Seed.textContent = p2.seed ? `#${p2.seed}` : '-';
    el.modalP2Name.textContent = p2.name;
    el.modalP2Score.value = match.score2 !== undefined && match.score2 !== '' ? match.score2 : 0;

    // Disable win buttons if competitor is placeholder
    el.btnDirectWinP1.disabled = !!p1.isPlaceholder || !p1.name;
    el.btnDirectWinP2.disabled = !!p2.isPlaceholder || !p2.name;

    openModal(el.modalMatchControl);
  }

  function handleSaveMatchScores() {
    if (!state.selectedMatchForEdit) return;
    const { match, rIdx, mIdx } = state.selectedMatchForEdit;

    const s1 = parseInt(el.modalP1Score.value, 10) || 0;
    const s2 = parseInt(el.modalP2Score.value, 10) || 0;

    match.score1 = s1;
    match.score2 = s2;

    const activeStatusBtn = el.modalMatchControl.querySelector('.status-btn.active');
    match.status = activeStatusBtn ? activeStatusBtn.dataset.status : 'completed';

    if (s1 > s2) {
      advanceWinner(match, match.p1);
    } else if (s2 > s1) {
      advanceWinner(match, match.p2);
    }

    closeModal(el.modalMatchControl);
    saveTournamentState(true);
    renderBracketStudio();
    showToast('Match scores saved successfully!', 'success');
  }

  function handleDirectWin(playerSlot) {
    if (!state.selectedMatchForEdit) return;
    const { match, rIdx, mIdx } = state.selectedMatchForEdit;
    const winner = playerSlot === 'p1' ? match.p1 : match.p2;

    if (!winner || winner.isPlaceholder) {
      showToast('Cannot declare win for placeholder competitor!', 'error');
      return;
    }

    // Confirmation dialog before declaring direct win
    openConfirmModal(
      'Confirm Direct Win',
      `Are you sure you want to declare <strong>${escapeHTML(winner.name)}</strong> as the direct winner of this match? This will advance them to the next round.`,
      () => {
        if (playerSlot === 'p1') {
          match.score1 = match.score1 || 1;
          match.score2 = 0;
        } else {
          match.score1 = 0;
          match.score2 = match.score2 || 1;
        }
        match.status = 'completed';
        advanceWinner(match, winner);
        closeModal(el.modalMatchControl);
        saveTournamentState(true);
        renderBracketStudio();
        showToast(`🏆 ${winner.name} declared winner and advanced!`, 'success');
      }
    );
  }

  function advanceWinner(match, winner) {
    match.winnerId = winner.id;
    match.status = 'completed';

    if (match.isBronzeMatch) {
      showToast(`🥉 JUARA 3: ${winner.name}!`, 'success');
      return;
    }

    // Propagate to next round in single elimination tree
    const t = state.currentTournament;
    const currentRoundIdx = match.round - 1;
    const nextRound = t.rounds[currentRoundIdx + 1];

    // Check if this was a semifinal match and 3rd place match is enabled
    const isSemifinal = currentRoundIdx === (t.rounds || []).length - 2;
    if (isSemifinal && t.settings?.thirdPlaceMatch) {
      const bronzeMatch = getOrInitThirdPlaceMatch(t);
      if (bronzeMatch) {
        const loser = match.p1?.id === winner.id ? match.p2 : match.p1;
        const targetSlot = match.matchIndex === 0 ? 'p1' : 'p2';
        if (loser) {
          bronzeMatch[targetSlot] = {
            id: loser.id,
            name: loser.name,
            seed: loser.seed,
            partners: loser.partners,
            partner: loser.partner,
            isPlaceholder: false
          };
        }
      }
    }

    if (nextRound) {
      const targetMatchIdx = Math.floor(match.matchIndex / 2);
      const targetSlot = match.matchIndex % 2 === 0 ? 'p1' : 'p2';
      const targetMatch = nextRound.matches[targetMatchIdx];

      if (targetMatch) {
        targetMatch[targetSlot] = {
          id: winner.id,
          name: winner.name,
          seed: winner.seed,
          partners: winner.partners,
          partner: winner.partner,
          isPlaceholder: false
        };
      }
    } else {
      // Tournament finished! Champion declared!
      t.status = 'completed';
      showToast(`🎉 TOURNAMENT COMPLETE! CHAMPION: ${winner.name}!`, 'success');
    }
  }

  function handleResetMatchResult() {
    if (!state.selectedMatchForEdit) return;
    const { match } = state.selectedMatchForEdit;
    match.score1 = '';
    match.score2 = '';
    match.winnerId = null;
    match.status = 'scheduled';
    closeModal(el.modalMatchControl);
    saveTournamentState(true);
    renderBracketStudio();
    showToast('Match result reset to scheduled.', 'info');
  }

  // ==================== TOURNAMENT ACTIONS & MODALS ====================
  function handleToggleLock() {
    const t = state.currentTournament;
    if (!t) return;

    if (!t.isLocked) {
      openConfirmModal(
        'Lock Tournament Bracket?',
        'Locking the bracket will freeze participant seeding and enable match scoring and live winner advancement.',
        () => {
          t.isLocked = true;
          t.status = 'in_progress';
          saveTournamentState(true);
          setupStudioUI();
          renderBracketStudio();
          showToast('🔒 Bracket locked! Tournament is now In Progress.', 'success');
        }
      );
    } else {
      openConfirmModal(
        'Unlock Tournament Bracket?',
        'Unlocking allows you to re-order seeds and add participants, but may reset ongoing match progressions.',
        () => {
          t.isLocked = false;
          t.status = 'setup';
          saveTournamentState(true);
          setupStudioUI();
          renderBracketStudio();
          showToast('🔓 Bracket unlocked. Seeding editing enabled.', 'warning');
        }
      );
    }
  }

  function handleToggleHighlight() {
    state.highlightInProgress = !state.highlightInProgress;
    el.btnToggleHighlight.classList.toggle('active', state.highlightInProgress);
    const t = state.currentTournament;
    if (t) {
      t.inProgressHighlight = state.highlightInProgress;
      saveTournamentState(false);
    }
    renderBracketStudio();
    showToast(state.highlightInProgress ? '⚡ Live Focus enabled (pulsing live matches)' : 'Live Focus disabled');
  }

  let activeQrTournamentId = null;

  async function openQrModalForTournament(tournamentId) {
    activeQrTournamentId = tournamentId;
    const t = (state.tournaments && state.tournaments.find(item => item.id === tournamentId)) || state.currentTournament;
    refreshQrDeadlineUI(t);
    await refreshQrDisplay();
    openModal(el.modalQrCode);
  }

  async function refreshQrDisplay() {
    if (!activeQrTournamentId) return;
    const t = (state.tournaments && state.tournaments.find(item => item.id === activeQrTournamentId)) || state.currentTournament;
    const isTeam = !!(t?.settings?.isDoubles);
    try {
      const res = await fetch(`/api/tournaments/${activeQrTournamentId}/qr${isTeam ? '?isTeam=1' : ''}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      el.qrCodeDisplay.innerHTML = `<img src="${data.qrDataUrl}" alt="Registration QR Code">`;
      el.qrUrlText.value = data.registrationUrl;
      el.btnDownloadQr.href = data.qrDataUrl;
      el.btnDownloadQr.download = `${(data.tournamentName || 'tournament').replace(/\s+/g, '_')}_QR.png`;

      el.btnOpenRegPage.onclick = () => {
        window.open(data.registrationUrl, '_blank');
      };
    } catch (err) {
      showToast('Error generating QR: ' + err.message, 'error');
    }
  }

  function confirmDeleteTournament(tournamentId) {
    openConfirmModal(
      'Delete Tournament',
      'Are you sure you want to permanently delete this tournament? This action cannot be undone.',
      async () => {
        try {
          const res = await fetch(`/api/tournaments/${tournamentId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast('Tournament deleted successfully.', 'success');
            loadDashboard();
          }
        } catch (err) {
          showToast('Error deleting: ' + err.message, 'error');
        }
      }
    );
  }

  // ==================== PARTICIPANT MANAGEMENT ====================
  async function handleAddParticipant(e) {
    e.preventDefault();
    const name = el.newParticipantInput.value.trim();
    const t = state.currentTournament;
    if (!t) return;

    try {
      const res = await fetch(`/api/tournaments/${t.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        t.participants = data.tournament.participants;
        const newlyAdded = t.participants[t.participants.length - 1];
        el.newParticipantInput.value = '';
        // Automatically regenerate dynamic bracket tree to adapt to new participant count!
        t.rounds = generateBracketTree(t.participants, t.rounds);
        saveTournamentState(false);
        renderParticipantsDrawer();
        renderBracketStudio();
        showToast(name ? `Added participant: ${name}` : 'Added new slot', 'success');

      } else {
        showToast(data.error || 'Failed to add participant', 'error');
      }
    } catch (err) {
      showToast('Error adding participant: ' + err.message, 'error');
    }
  }

  function removeParticipant(participantId) {
    const t = state.currentTournament;
    if (!t || t.isLocked) return;

    t.participants = t.participants.filter(p => p.id !== participantId);
    // Dynamically re-balance bracket tree
    t.rounds = generateBracketTree(t.participants, t.rounds);
    saveTournamentState(true);
    renderParticipantsDrawer();
    renderBracketStudio();
    showToast('Participant removed.', 'info');
  }

  function startEditingParticipant(participantId) {
    const itemEl = el.participantsList.querySelector(`.participant-item[data-id="${participantId}"]`);
    if (!itemEl) return;
    const t = state.currentTournament;
    if (!t || t.isLocked) return;

    const p = (t.participants || []).find(part => part.id === participantId);
    if (!p) return;

    if (itemEl.classList.contains('is-editing')) return;

    itemEl.classList.add('is-editing');
    itemEl.setAttribute('draggable', 'false');

    const currentName = p.name || '';

    // Create wrapper for the input and actions
    const editContainer = document.createElement('div');
    editContainer.className = 'inline-edit-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'participant-inline-edit';
    input.value = currentName;
    input.placeholder = 'Nama peserta...';

    const btnSave = document.createElement('button');
    btnSave.type = 'button';
    btnSave.className = 'btn-inline-save';
    btnSave.title = 'Simpan';
    btnSave.innerHTML = '<i class="fa-solid fa-check"></i>';

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.className = 'btn-inline-cancel';
    btnCancel.title = 'Batal';
    btnCancel.innerHTML = '<i class="fa-solid fa-xmark"></i>';

    editContainer.appendChild(input);
    editContainer.appendChild(btnSave);
    editContainer.appendChild(btnCancel);

    itemEl.appendChild(editContainer);
    input.focus();
    input.select();

    let isFinished = false;

    const commitEdit = () => {
      if (isFinished) return;
      isFinished = true;

      const newName = input.value.trim();
      p.name = newName;
      p.playerName = newName;
      if (p.isTeam) {
        p.teamName = newName;
      }

      // Synchronize in tournament rounds
      if (t.rounds) {
        t.rounds.forEach(r => {
          (r.matches || []).forEach(m => {
            if (m.p1 && m.p1.id === p.id) {
              m.p1.name = newName;
              m.p1.playerName = newName;
              if (p.isTeam) m.p1.teamName = newName;
              if (newName) {
                m.p1.isPlaceholder = false;
                m.p1.isUnseeded = false;
              }
            }
            if (m.p2 && m.p2.id === p.id) {
              m.p2.name = newName;
              m.p2.playerName = newName;
              if (p.isTeam) m.p2.teamName = newName;
              if (newName) {
                m.p2.isPlaceholder = false;
                m.p2.isUnseeded = false;
              }
            }
          });
        });
      }

      if (t.thirdPlaceMatch) {
        if (t.thirdPlaceMatch.p1 && t.thirdPlaceMatch.p1.id === p.id) {
          t.thirdPlaceMatch.p1.name = newName;
        }
        if (t.thirdPlaceMatch.p2 && t.thirdPlaceMatch.p2.id === p.id) {
          t.thirdPlaceMatch.p2.name = newName;
        }
      }

      saveTournamentState(true);
      renderParticipantsDrawer();
      renderBracketStudio();
      if (newName !== currentName) {
        showToast(newName ? `Nama diperbarui: ${newName}` : 'Nama slot dikosongkan', 'success');
      }
    };

    const cancelEdit = () => {
      if (isFinished) return;
      isFinished = true;
      renderParticipantsDrawer();
    };

    btnSave.addEventListener('click', (e) => {
      e.stopPropagation();
      commitEdit();
    });

    btnCancel.addEventListener('click', (e) => {
      e.stopPropagation();
      cancelEdit();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (!isFinished && document.activeElement !== btnSave && document.activeElement !== btnCancel) {
          commitEdit();
        }
      }, 150);
    });
  }

  function startEditingMatchSlot(rIdx, mIdx, slot) {
    const t = state.currentTournament;
    if (!t || t.isLocked) return;

    const round = t.rounds[rIdx];
    if (!round) return;
    const match = round.matches[mIdx];
    if (!match) return;

    const p = match[slot];

    const node = document.querySelector(`.match-node[data-id="${match.id}"]`);
    if (!node) return;
    const row = node.querySelector(`[data-slot="${slot}"]`);
    if (!row) return;

    const nameSpan = row.querySelector('.team-name-text');
    if (!nameSpan || row.querySelector('.slot-inline-edit')) return;

    row.setAttribute('draggable', 'false');
    const currentName = (p && !p.isPlaceholder && !p.isUnseeded) ? (p.name || '') : '';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'slot-inline-edit';
    input.value = currentName;
    input.placeholder = 'Ketik nama peserta...';

    nameSpan.style.display = 'none';
    nameSpan.parentNode.insertBefore(input, nameSpan);
    input.focus();
    input.select();

    let isSaved = false;
    const commitSlotEdit = () => {
      if (isSaved) return;
      isSaved = true;
      const newName = input.value.trim();

      if (p && p.id && !p.isPlaceholder) {
        // Participant exists in tournament
        const part = (t.participants || []).find(item => item.id === p.id);
        if (part) {
          part.name = newName;
          part.playerName = newName;
          if (part.isTeam) part.teamName = newName;
        }
        p.name = newName;
        p.playerName = newName;
        if (p.isTeam) p.teamName = newName;
        if (newName) {
          p.isPlaceholder = false;
          p.isUnseeded = false;
        }
      } else if (newName) {
        // Create new participant and bind to this slot
        const newPart = {
          id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: newName,
          playerName: newName,
          teamName: newName,
          isTeam: false,
          partners: [],
          registeredAt: new Date().toISOString()
        };
        t.participants = t.participants || [];
        t.participants.push(newPart);
        match[slot] = {
          id: newPart.id,
          name: newName,
          seed: t.participants.length,
          isPlaceholder: false,
          isUnseeded: false
        };
      }

      saveTournamentState(true);
      renderParticipantsDrawer();
      renderBracketStudio();
      if (newName !== currentName) {
        showToast(newName ? `Slot diperbarui: ${newName}` : 'Slot dikosongkan', 'success');
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitSlotEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        isSaved = true;
        renderBracketStudio();
      }
    });

    input.addEventListener('blur', () => {
      commitSlotEdit();
    });
  }

  function handleAutoSeed() {
    performSeeding(false);
  }

  function handleRandomSeed() {
    performSeeding(true);
  }

  function handleToggleSlotLock(rIdx, mIdx, slot) {
    const t = state.currentTournament;
    if (!t || t.isLocked) return;
    const round = t.rounds[parseInt(rIdx, 10)];
    if (!round) return;
    const match = round.matches[parseInt(mIdx, 10)];
    if (!match) return;

    if (slot === 'p1') {
      match.p1Locked = !match.p1Locked;
      const isLocked = match.p1Locked;
      const pName = match.p1?.name && !match.p1.isPlaceholder ? match.p1.name : 'Slot 1';
      showToast(isLocked ? `🔒 ${pName} terkunci! (Aman dari Random Seed)` : `🔓 Slot 1 dibuka`, 'info');
    } else {
      match.p2Locked = !match.p2Locked;
      const isLocked = match.p2Locked;
      const pName = match.p2?.name && !match.p2.isPlaceholder ? match.p2.name : 'Slot 2';
      showToast(isLocked ? `🔒 ${pName} terkunci! (Aman dari Random Seed)` : `🔓 Slot 2 dibuka`, 'info');
    }

    saveTournamentState(false);
    renderBracketStudio();
  }

  function performSeeding(isRandom = false) {
    const t = state.currentTournament;
    if (!t || t.isLocked) return;

    if (!t.participants || t.participants.length < 1) {
      showToast('Mohon tambahkan peserta untuk melakukan seeding / pengacakan!', 'warning');
      return;
    }

    // Ensure bracket tree exists and matches participant count
    if (!t.rounds || t.rounds.length === 0) {
      t.rounds = generateBracketTree(t.participants, null, false);
    }

    // 1. Gather all leaf entry slots across Round 1 (play-ins) and Round 2 (BYEs)
    const entrySlots = [];
    t.rounds.forEach((round, rIdx) => {
      round.matches.forEach((m, mIdx) => {
        if (!m.feederTopId) {
          entrySlots.push({ roundIdx: rIdx, matchIdx: mIdx, slot: 'p1', isLocked: !!m.p1Locked, currentP: m.p1 });
        }
        if (!m.feederBotId) {
          entrySlots.push({ roundIdx: rIdx, matchIdx: mIdx, slot: 'p2', isLocked: !!m.p2Locked, currentP: m.p2 });
        }
      });
    });

    // 2. Identify which participants are locked in place
    const lockedParticipantIds = new Set();
    entrySlots.forEach(s => {
      if (s.isLocked && s.currentP && s.currentP.id && !s.currentP.isPlaceholder) {
        lockedParticipantIds.add(s.currentP.id);
      }
    });

    // 3. Collect available (unlocked) participants with valid names
    let pool = t.participants.filter(p => !lockedParticipantIds.has(p.id) && p.name && p.name.trim());

    if (pool.length === 0 && lockedParticipantIds.size === 0) {
      showToast('Semua slot masih kosong! Masukkan nama peserta terlebih dahulu untuk melakukan seeding.', 'warning');
      return;
    }

    if (isRandom) {
      // Fisher-Yates random shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }

    // 4. Assign into unlocked slots
    let pIdx = 0;
    entrySlots.forEach(s => {
      if (s.isLocked) return; // Keep locked slot untouched!

      const match = t.rounds[s.roundIdx].matches[s.matchIdx];
      if (pIdx < pool.length) {
        const assigned = { ...pool[pIdx], seed: pIdx + 1, isPlaceholder: false, isUnseeded: false };
        if (s.slot === 'p1') {
          match.p1 = assigned;
        } else {
          match.p2 = assigned;
        }
        pIdx++;
      } else {
        const emptySlot = { name: '', id: null, isPlaceholder: true, isUnseeded: true };
        if (s.slot === 'p1') {
          match.p1 = emptySlot;
        } else {
          match.p2 = emptySlot;
        }
      }
    });

    saveTournamentState(true);
    renderParticipantsDrawer();
    renderBracketStudio();
    showToast(isRandom ? '🎲 Bagan berhasil diacak secara random! (Slot terkunci tetap aman)' : '✨ Auto-Seed standar selesai diterapkan!', 'success');
  }

  // CSV Parsing Engine
  function parseCsv(text) {
    if (!text || !text.trim()) return [];
    const lines = text.split(/\r\n|\n|\r/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    function parseRow(rowStr) {
      const result = [];
      let cur = '';
      let inQuote = false;
      let delimiter = ',';
      if (rowStr.includes(';') && !rowStr.includes(',')) delimiter = ';';
      else if (rowStr.includes('\t') && !rowStr.includes(',')) delimiter = '\t';

      for (let i = 0; i < rowStr.length; i++) {
        const c = rowStr[i];
        if (c === '"') {
          if (inQuote && rowStr[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (c === delimiter && !inQuote) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    }

    const rows = lines.map(parseRow);
    if (rows.length === 0) return [];

    let startIndex = 0;
    const firstRowLower = rows[0].map(c => c.toLowerCase());
    const hasHeader = firstRowLower.some(c => c.includes('name') || c.includes('nama') || c === '#' || c.includes('dept') || c.includes('tim') || c.includes('team'));
    let colMap = { name: 0, wecom: 1, dept: 2, partnerName: -1, partnerWecom: -1, partnerDept: -1, teamName: -1 };

    if (hasHeader) {
      startIndex = 1;
      firstRowLower.forEach((col, idx) => {
        if (col.includes('rekan') || col.includes('partner')) {
          if (col.includes('wecom') || col.includes('wa') || col.includes('kontak') || col.includes('contact')) colMap.partnerWecom = idx;
          else if (col.includes('dept') || col.includes('departemen')) colMap.partnerDept = idx;
          else colMap.partnerName = idx;
        } else if (col.includes('tim') || col.includes('team')) {
          colMap.teamName = idx;
        } else if (col.includes('name') || col.includes('nama') || col.includes('player')) {
          colMap.name = idx;
        } else if (col.includes('wecom') || col.includes('wa') || col.includes('id') || col.includes('contact') || col.includes('company')) {
          colMap.wecom = idx;
        } else if (col.includes('dept') || col.includes('departemen') || col.includes('status')) {
          colMap.dept = idx;
        }
      });
    } else {
      if (/^\d+$/.test(rows[0][0]) && rows[0].length > 1) {
        colMap.name = 1;
        colMap.wecom = 2;
        colMap.dept = 3;
      }
    }

    const participants = [];
    for (let i = startIndex; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0 || !r.some(val => val.length > 0)) continue;

      const playerName = (r[colMap.name] || r[0] || '').trim();
      if (!playerName) continue;

      const wecom = colMap.wecom >= 0 && r[colMap.wecom] ? r[colMap.wecom].trim() : '';
      const dept = colMap.dept >= 0 && r[colMap.dept] ? r[colMap.dept].trim() : '';
      const partnerName = colMap.partnerName >= 0 && r[colMap.partnerName] ? r[colMap.partnerName].trim() : '';
      const partnerWecom = colMap.partnerWecom >= 0 && r[colMap.partnerWecom] ? r[colMap.partnerWecom].trim() : '';
      const partnerDept = colMap.partnerDept >= 0 && r[colMap.partnerDept] ? r[colMap.partnerDept].trim() : '';
      const rawTeamName = colMap.teamName >= 0 && r[colMap.teamName] ? r[colMap.teamName].trim() : '';

      const firstName = playerName.split(/\s+/)[0] || 'Player';
      const hasPartner = !!partnerName;
      const finalTeamName = rawTeamName || (hasPartner ? `TIM ${firstName}` : `TIM ${firstName}`);

      participants.push({
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: finalTeamName,
        teamName: finalTeamName,
        playerName: playerName,
        wecom: wecom,
        dept: dept,
        isTeam: hasPartner,
        partner: hasPartner ? {
          name: partnerName,
          wecom: partnerWecom,
          dept: partnerDept
        } : null,
        registeredAt: new Date().toISOString()
      });
    }

    return participants;
  }

  function setupCsvUploader() {
    if (!el.csvDropzone || !el.bulkCsvFile) return;

    el.csvDropzone.addEventListener('click', () => {
      el.bulkCsvFile.click();
    });

    el.csvDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.csvDropzone.classList.add('drag-over');
    });

    el.csvDropzone.addEventListener('dragleave', () => {
      el.csvDropzone.classList.remove('drag-over');
    });

    el.csvDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      el.csvDropzone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processCsvFile(files[0]);
      }
    });

    el.bulkCsvFile.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processCsvFile(files[0]);
      }
    });

    if (el.btnClearCsv) {
      el.btnClearCsv.addEventListener('click', (e) => {
        e.stopPropagation();
        clearCsvFile();
      });
    }
  }

  function processCsvFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCsv(text);
      state.parsedCsvParticipants = parsed;
      if (el.csvFileName) {
        el.csvFileName.innerHTML = `<i class="fa-solid fa-file-csv"></i> <strong>${escapeHTML(file.name)}</strong> (${parsed.length} peserta terdeteksi)`;
      }
      if (el.csvFileStatus) el.csvFileStatus.classList.remove('hidden');
      if (el.csvDropzone) el.csvDropzone.classList.add('has-file');
      showToast(`Berhasil membaca ${parsed.length} peserta dari ${file.name}!`, 'success');
    };
    reader.onerror = () => {
      showToast('Gagal membaca file CSV', 'error');
    };
    reader.readAsText(file);
  }

  function clearCsvFile() {
    state.parsedCsvParticipants = [];
    if (el.bulkCsvFile) el.bulkCsvFile.value = '';
    if (el.csvFileStatus) el.csvFileStatus.classList.add('hidden');
    if (el.csvDropzone) el.csvDropzone.classList.remove('has-file');
  }

  function handleBulkAdd(e) {
    e.preventDefault();
    const text = el.bulkParticipantsText ? el.bulkParticipantsText.value.trim() : '';
    const textParsed = text ? parseCsv(text) : [];
    const csvParsed = state.parsedCsvParticipants || [];

    const totalToImport = [...csvParsed, ...textParsed];
    if (totalToImport.length === 0) {
      showToast('Mohon upload file CSV atau masukkan data peserta.', 'warning');
      return;
    }

    const t = state.currentTournament;
    if (!t || t.isLocked) return;

    t.participants = t.participants || [];
    totalToImport.forEach(p => {
      t.participants.push(p);
    });

    t.rounds = generateBracketTree(t.participants);
    saveTournamentState(true);
    closeModal(el.modalBulkAdd);
    clearCsvFile();
    if (el.bulkParticipantsText) el.bulkParticipantsText.value = '';
    renderParticipantsDrawer();
    renderBracketStudio();
    showToast(`Berhasil mengimpor ${totalToImport.length} peserta ke bracket!`, 'success');
  }

  // ==================== STATE PERSISTENCE ====================
  async function saveTournamentState(notify = false) {
    const t = state.currentTournament;
    if (!t) return;

    try {
      const res = await fetch(`/api/tournaments/${t.id}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rounds: t.rounds,
          participants: t.participants,
          isLocked: t.isLocked,
          status: t.status,
          inProgressHighlight: t.inProgressHighlight,
          name: t.name,
          settings: t.settings,
          registrationDeadline: t.registrationDeadline || null,
          autoLockAt: t.autoLockAt || null
        })
      });
      const data = await res.json();
      if (data.success && notify) {
        // Saved quietly
      }
    } catch (err) {
      console.error('Error persisting tournament state:', err);
    }
  }

  // ==================== PUBLIC SPECTATOR LIVE VIEW ====================
  async function loadPublicLiveView(tournamentId) {
    switchView('live');
    fetchLiveTournament(tournamentId);

    // Set up auto polling every 3 seconds
    if (state.livePollingTimer) clearInterval(state.livePollingTimer);
    state.livePollingTimer = setInterval(() => {
      fetchLiveTournament(tournamentId, true);
    }, 3000);
  }

  async function fetchLiveTournament(tournamentId, isBackground = false) {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) throw new Error('Live tournament not found');
      const data = await res.json();
      const t = data.tournament;
      state.currentTournament = t;

      const needsHydration = !t.rounds || t.rounds.length === 0 || t.rounds.some(r => r.matches.some(m => !m.pairRange));
      if (needsHydration) {
        t.rounds = generateBracketTree(t.participants || [], t.rounds);
      }

      el.liveTournamentName.textContent = t.name;
      el.liveGameBadge.textContent = `${t.game || 'Esports'} • Live Spectator View`;

      // Check if tournament has officially started
      const hasMatchAction = (t.rounds || []).some(r => (r.matches || []).some(m => m.status === 'in_progress' || m.status === 'completed'));
      const isStarted = t.isLocked || t.status === 'in_progress' || hasMatchAction;

      if (el.liveNotStartedOverlay) {
        el.liveNotStartedOverlay.classList.toggle('hidden', isStarted);
      }
      if (el.liveCanvas) {
        el.liveCanvas.classList.toggle('bracket-blurred', !isStarted);
      }

      if (!isStarted) {
        if (el.notStartedParticipantCount) {
          el.notStartedParticipantCount.textContent = `${(t.participants || []).length} Tim Terdaftar`;
        }
        if (el.notStartedTimer) {
          if (t.autoLockAt) {
            const rem = Math.max(0, new Date(t.autoLockAt).getTime() - Date.now());
            if (rem > 0) {
              const mins = Math.floor(rem / 60000);
              const secs = Math.floor((rem % 60000) / 1000);
              el.notStartedTimer.textContent = `Auto-start: ${mins}m ${secs}s`;
            } else {
              el.notStartedTimer.textContent = 'Segera dimulai...';
            }
          } else if (t.registrationDeadline) {
            const rem = Math.max(0, new Date(t.registrationDeadline).getTime() - Date.now());
            if (rem > 0) {
              const mins = Math.floor(rem / 60000);
              const secs = Math.floor((rem % 60000) / 1000);
              el.notStartedTimer.textContent = `Pendaftaran tutup: ${mins}m ${secs}s`;
            } else {
              el.notStartedTimer.textContent = 'Pendaftaran ditutup';
            }
          } else {
            el.notStartedTimer.textContent = 'Menunggu persiapan panitia';
          }
        }
      }

      renderBracketView(el.liveRoundsContainer, el.liveSvg, t.rounds || [], true);
      updateMatchProgressHUD(t.rounds || [], true);
      if (!isBackground) {
        applyCanvasTransform(el.liveCanvas);
      }
    } catch (err) {
      if (!isBackground) showToast('Error loading live bracket: ' + err.message, 'error');
    }
  }

  // ==================== PUBLIC MOBILE REGISTRATION VIEW ====================
  async function loadPublicRegisterView(tournamentId) {
    switchView('register');
    if (el.registerView) el.registerView.scrollTop = 0;
    window.scrollTo(0, 0);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) throw new Error('Tournament not found');
      const data = await res.json();
      const t = data.tournament;
      state.currentTournament = t;

      el.registerTournamentName.textContent = t.name;
      el.registerTournamentMeta.textContent = `${t.game || 'Esports'} • Pendaftaran Dibuka`;

      const currentCount = (t.participants || []).length;
      if (el.registerCapacityText) {
        el.registerCapacityText.textContent = currentCount;
      }

      // Check if tournament specifies Mode Tim
      const isTeamTournament = !!(t.settings && (t.settings.isDoubles === true || t.settings.isDoubles === 'true' || t.settings.isDoubles === 1 || t.settings.isDoubles === '1'));

      // Hide or show Team Name input based on tournament setting
      if (el.regTeamNameGroup) {
        el.regTeamNameGroup.classList.toggle('hidden', !isTeamTournament);
      }

      // Hide or show Partner Section directly based on tournament setting
      if (el.regPartnerSection) {
        el.regPartnerSection.classList.toggle('hidden', !isTeamTournament);
      }

      if (!isTeamTournament && el.regPartnersDynamicContainer) {
        el.regPartnersDynamicContainer.innerHTML = '';
      }

      // Render dynamic teammate cards helper
      state.regTeammateCount = 1;
      function renderTeammateCards(count) {
        state.regTeammateCount = count;
        if (!el.regPartnersDynamicContainer) return;
        el.regPartnersDynamicContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
          const card = document.createElement('div');
          card.className = 'teammate-card';
          card.innerHTML = `
            <div class="teammate-card-header">
              <i class="fa-solid fa-user-plus"></i> Data Rekan #${i + 1}
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
              <label class="form-label" style="font-size: 11px;">Nama Lengkap Rekan #${i + 1} <span class="required">*</span></label>
              <input type="text" class="input-modern reg-partner-name" placeholder="Masukkan nama lengkap rekan #${i + 1}" required />
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
              <label class="form-label" style="font-size: 11px;">No. WeCom Rekan #${i + 1}</label>
              <input type="text" class="input-modern reg-partner-wecom" placeholder="No. WeCom / WA" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 11px;">Departemen (Dept) Rekan #${i + 1}</label>
              <input type="text" class="input-modern reg-partner-dept" placeholder="Contoh: Produksi, IT, HR" />
            </div>
          `;
          el.regPartnersDynamicContainer.appendChild(card);
        }
      }

      // Dropdown selection for teammate count
      if (el.regTeammateCountSelect) {
        el.regTeammateCountSelect.value = '1';
        el.regTeammateCountSelect.onchange = () => {
          const cnt = parseInt(el.regTeammateCountSelect.value, 10) || 1;
          renderTeammateCards(cnt);
        };
      }

      if (isTeamTournament) {
        renderTeammateCards(1);
      }

      el.publicRegisterForm.onsubmit = async (e) => {
        e.preventDefault();
        const playerName = el.regPlayerName ? el.regPlayerName.value.trim() : '';
        const wecom = el.regPlayerWecom ? el.regPlayerWecom.value.trim() : '';
        const dept = el.regPlayerDept ? el.regPlayerDept.value.trim() : '';
        const isTeam = isTeamTournament;
        const teamNameInput = (isTeam && el.regTeamName) ? el.regTeamName.value.trim() : '';

        if (!playerName) {
          showToast('Mohon isi Nama Lengkap pemain utama!', 'warning');
          return;
        }

        const partners = [];
        if (isTeam && el.regPartnersDynamicContainer) {
          const cards = el.regPartnersDynamicContainer.querySelectorAll('.teammate-card');
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const pName = (card.querySelector('.reg-partner-name')?.value || '').trim();
            const pWecom = (card.querySelector('.reg-partner-wecom')?.value || '').trim();
            const pDept = (card.querySelector('.reg-partner-dept')?.value || '').trim();

            if (!pName) {
              showToast(`Mohon isi Nama Lengkap untuk Rekan #${i + 1}!`, 'warning');
              card.querySelector('.reg-partner-name')?.focus();
              return;
            }
            partners.push({ name: pName, wecom: pWecom, dept: pDept });
          }
        }

        const firstName = playerName.split(/\s+/)[0] || 'Player';
        const finalDisplayName = isTeam ? (teamNameInput || `TIM ${firstName}`) : playerName;

        try {
          const regRes = await fetch(`/api/tournaments/${t.id}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: finalDisplayName,
              teamName: isTeam ? finalDisplayName : '',
              playerName,
              wecom,
              dept,
              isTeam,
              partners,
              partner: partners[0] || null
            })
          });
          const regData = await regRes.json();
          if (regData.success) {
            el.publicRegisterForm.classList.add('hidden');
            el.registerSuccessBox.classList.remove('hidden');
            showToast('Pendaftaran berhasil! Selamat bertanding.', 'success');
          } else {
            showToast('Pendaftaran gagal: ' + (regData.error || 'Terjadi kesalahan'), 'error');
          }
        } catch (err) {
          showToast('Pendaftaran gagal: ' + err.message, 'error');
        }
      };

      // Populate Live View URL in success box
      const liveUrl = `${window.location.origin}/?view=live&id=${t.id}`;
      if (el.successLiveUrl) el.successLiveUrl.value = liveUrl;
      if (el.btnCopySuccessLive) {
        el.btnCopySuccessLive.onclick = () => {
          navigator.clipboard.writeText(liveUrl).then(() => {
            showToast('Live View URL berhasil disalin!', 'success');
          });
        };
      }
      if (el.btnClosedViewLive) {
        el.btnClosedViewLive.onclick = () => navigateToLive(t.id);
      }

      // Check if registration is closed
      const isClosed = t.isLocked || (t.registrationDeadline && Date.now() > new Date(t.registrationDeadline).getTime());
      if (isClosed) {
        if (el.publicRegisterForm) el.publicRegisterForm.classList.add('hidden');
        if (el.registerClosedBox) el.registerClosedBox.classList.remove('hidden');
        if (el.regDeadlineText) el.regDeadlineText.textContent = 'Pendaftaran Telah Ditutup';
        if (el.regDeadlineBadge) {
          el.regDeadlineBadge.style.background = 'rgba(239, 68, 68, 0.15)';
          el.regDeadlineBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          el.regDeadlineBadge.style.color = '#f87171';
        }
      } else {
        if (el.publicRegisterForm) el.publicRegisterForm.classList.remove('hidden');
        if (el.registerClosedBox) el.registerClosedBox.classList.add('hidden');
        if (t.registrationDeadline) {
          const updateRegCountdown = () => {
            const rem = new Date(t.registrationDeadline).getTime() - Date.now();
            if (rem <= 0) {
              if (el.publicRegisterForm) el.publicRegisterForm.classList.add('hidden');
              if (el.registerClosedBox) el.registerClosedBox.classList.remove('hidden');
              if (el.regDeadlineText) el.regDeadlineText.textContent = 'Pendaftaran Telah Ditutup';
              return;
            }
            const hours = Math.floor(rem / 3600000);
            const mins = Math.floor((rem % 3600000) / 60000);
            const secs = Math.floor((rem % 60000) / 1000);
            const timeStr = hours > 0 ? `${hours}j ${mins}m ${secs}d` : `${mins}m ${secs}d`;
            if (el.regDeadlineText) el.regDeadlineText.textContent = `Ditutup dalam: ${timeStr}`;
          };
          updateRegCountdown();
          if (state.regCountdownTimer) clearInterval(state.regCountdownTimer);
          state.regCountdownTimer = setInterval(updateRegCountdown, 1000);
        } else {
          if (el.regDeadlineText) el.regDeadlineText.textContent = 'Pendaftaran Dibuka';
        }
      }

      el.btnViewLiveBracket.onclick = () => {
        navigateToLive(t.id);
      };
    } catch (err) {
      showToast('Error loading registration: ' + err.message, 'error');
    }
  }

  // ==================== MATCH PROGRESS CORNER HUD ====================
  function updateMatchProgressHUD(rounds, isLive = false) {
    if (!rounds || !Array.isArray(rounds)) return;
    let totalMatches = 0;
    let completedMatches = 0;
    const inProgressList = [];

    rounds.forEach(r => {
      if (!r.matches) return;
      r.matches.forEach(m => {
        totalMatches++;
        if (m.status === 'completed' || (m.winnerId && (m.score1 !== '' || m.score2 !== ''))) {
          completedMatches++;
        } else if (m.status === 'in_progress') {
          inProgressList.push({ match: m, roundTitle: r.title, roundNum: r.roundNumber });
        }
      });
    });

    const pct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

    const pctEl = isLive ? el.liveProgressPct : el.studioProgressPct;
    const fillEl = isLive ? el.liveProgressFill : el.studioProgressFill;
    const countEl = isLive ? el.liveProgressCount : el.studioProgressCount;
    const namesEl = isLive ? el.liveActiveNames : el.studioActiveNames;
    const upNextEl = isLive ? el.liveUpNextNames : el.studioUpNextNames;

    if (pctEl) pctEl.textContent = `${pct}%`;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (countEl) countEl.textContent = `${completedMatches} / ${totalMatches} Match Selesai (${pct}%)`;

    if (namesEl) {
      if (inProgressList.length > 0) {
        const active = inProgressList[0];
        const p1Name = active.match.p1?.name || 'TBD';
        const p2Name = active.match.p2?.name || 'TBD';
        const moreText = inProgressList.length > 1 ? ` <span style="font-size:10px; color:var(--text-muted);">(+${inProgressList.length - 1} match lain)</span>` : '';
        namesEl.innerHTML = `<strong>${escapeHTML(p1Name)}</strong> <span style="color:var(--accent-primary); font-weight:700;">VS</span> <strong>${escapeHTML(p2Name)}</strong>${moreText}<small style="color:var(--text-muted); display:block; font-size:10px; margin-top:2px;">${escapeHTML(active.roundTitle)}</small>`;
      } else if (completedMatches === totalMatches && totalMatches > 0) {
        namesEl.innerHTML = `<span style="color:var(--accent-gold); font-weight:600;"><i class="fa-solid fa-trophy"></i> Semua Match Selesai!</span>`;
      } else {
        namesEl.textContent = 'Belum ada match berjalan';
      }
    }

    if (upNextEl) {
      const nextUp = findNextUpMatch(rounds);
      if (nextUp) {
        const p1 = nextUp.match.p1?.name || 'TBD';
        const p2 = nextUp.match.p2?.name || 'TBD';
        upNextEl.innerHTML = `<strong>${escapeHTML(p1)}</strong> <span style="color:var(--accent-gold); font-weight:700;">VS</span> <strong>${escapeHTML(p2)}</strong> <small style="color:var(--text-muted); font-size:10px; display:block;">${escapeHTML(nextUp.roundTitle)} • Match #${nextUp.mIdx + 1}</small>`;
      } else if (completedMatches === totalMatches && totalMatches > 0) {
        upNextEl.textContent = 'Semua Match Selesai 🏆';
      } else {
        upNextEl.textContent = 'Menunggu giliran';
      }
    }
  }

  // ==================== AUTO-LOCK TIMER & DEADLINE ENGINE ====================
  function updateAutoLockTimerUI() {
    const t = state.currentTournament;
    if (!t || t.isLocked || !t.autoLockAt) {
      if (el.autolockCountdownBanner) el.autolockCountdownBanner.classList.add('hidden');
      return;
    }
    const target = new Date(t.autoLockAt).getTime();
    const now = Date.now();
    const rem = target - now;

    if (rem <= 0) {
      if (el.autolockCountdownBanner) el.autolockCountdownBanner.classList.add('hidden');
      if (!t.isLocked) {
        t.isLocked = true;
        t.status = 'in_progress';
        saveTournamentState(true);
        setupStudioUI();
        renderBracketStudio();
        showToast('⏰ Waktu habis! Bracket turnamen otomatis dikunci & pertandingan dimulai!', 'success');
      }
      return;
    }

    const mins = Math.floor(rem / 60000);
    const secs = Math.floor((rem % 60000) / 1000);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (el.autolockCountdownBanner) {
      el.autolockCountdownBanner.classList.remove('hidden');
      if (el.autolockCountdownText) el.autolockCountdownText.textContent = `Auto-lock dalam: ${timeStr}`;
    }
  }

  function refreshQrDeadlineUI(t) {
    if (!t || !el.qrDeadlineStatusBadge) return;
    if (t.registrationDeadline) {
      const rem = new Date(t.registrationDeadline).getTime() - Date.now();
      if (rem <= 0) {
        el.qrDeadlineStatusBadge.textContent = 'Ditutup';
        el.qrDeadlineStatusBadge.style.color = '#ef4444';
      } else {
        const mins = Math.round(rem / 60000);
        el.qrDeadlineStatusBadge.textContent = `Tutup ~${mins} mnt lagi`;
        el.qrDeadlineStatusBadge.style.color = '#fbbf24';
      }
    } else {
      el.qrDeadlineStatusBadge.textContent = 'Buka Terus';
      el.qrDeadlineStatusBadge.style.color = 'var(--text-muted)';
    }
  }


  // ==================== MATCH SEARCH & QUICK JUMP ====================
  function openMatchSearchModal() {
    if (!state.currentTournament || !state.currentTournament.rounds) {
      showToast('Bracket belum memiliki data match.', 'info');
      return;
    }
    state.activeSearchFilter = 'all';
    if (el.inputSearchMatch) el.inputSearchMatch.value = '';
    if (el.modalMatchSearch) {
      el.modalMatchSearch.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.filter === 'all');
      });
    }
    renderMatchSearchResults();
    openModal(el.modalMatchSearch);
    if (el.inputSearchMatch) el.inputSearchMatch.focus();
  }

  function renderMatchSearchResults() {
    if (!el.matchSearchResults || !state.currentTournament) return;
    const rounds = state.currentTournament.rounds || [];
    const query = el.inputSearchMatch ? el.inputSearchMatch.value.trim().toLowerCase() : '';
    const filter = state.activeSearchFilter || 'all';

    const allMatches = [];
    rounds.forEach((r, rIdx) => {
      (r.matches || []).forEach((m, mIdx) => {
        allMatches.push({ match: m, roundTitle: r.title, rIdx, mIdx });
      });
    });

    const filtered = allMatches.filter(item => {
      const { match, roundTitle } = item;
      const status = match.status || 'scheduled';
      if (filter !== 'all' && status !== filter) return false;

      if (!query) return true;
      const p1Name = (match.p1?.name || '').toLowerCase();
      const p2Name = (match.p2?.name || '').toLowerCase();
      const rName = (roundTitle || '').toLowerCase();
      const mNum = `match ${item.mIdx + 1}`;
      return p1Name.includes(query) || p2Name.includes(query) || rName.includes(query) || mNum.includes(query);
    });

    if (filtered.length === 0) {
      el.matchSearchResults.innerHTML = `
        <div style="text-align:center; padding: 28px; color: var(--text-muted); font-size: 13px;">
          <i class="fa-solid fa-filter-circle-xmark" style="font-size: 24px; margin-bottom: 8px; opacity:0.5; display:block;"></i>
          Tidak ada match yang cocok dengan pencarian.
        </div>
      `;
      return;
    }

    el.matchSearchResults.innerHTML = filtered.map(item => {
      const { match, roundTitle, rIdx, mIdx } = item;
      const p1 = match.p1 || { name: 'TBD' };
      const p2 = match.p2 || { name: 'TBD' };
      const status = match.status || 'scheduled';
      const statusLabel = status.replace('_', ' ');

      return `
        <div class="match-search-item" data-id="${match.id}" data-ridx="${rIdx}" data-midx="${mIdx}">
          <div class="match-search-header">
            <span>${escapeHTML(roundTitle)} • Match #${mIdx + 1}</span>
            <span class="status-indicator-pill ${status}">${statusLabel}</span>
          </div>
          <div class="match-search-teams">
            <div class="search-team-row ${match.winnerId === p1.id ? 'winner' : ''}">
              <span class="team-name">${escapeHTML(p1.name)}</span>
              <span class="team-score">${match.score1 !== '' && match.score1 !== undefined ? match.score1 : '-'}</span>
            </div>
            <div class="search-team-row ${match.winnerId === p2.id ? 'winner' : ''}">
              <span class="team-name">${escapeHTML(p2.name)}</span>
              <span class="team-score">${match.score2 !== '' && match.score2 !== undefined ? match.score2 : '-'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    el.matchSearchResults.querySelectorAll('.match-search-item').forEach(card => {
      card.addEventListener('click', () => {
        const rIdx = parseInt(card.dataset.ridx, 10);
        const mIdx = parseInt(card.dataset.midx, 10);
        closeModal(el.modalMatchSearch);
        focusAndOpenMatch(rIdx, mIdx);
      });
    });
  }

  function focusAndOpenMatch(rIdx, mIdx) {
    const t = state.currentTournament;
    if (!t || !t.rounds || !t.rounds[rIdx] || !t.rounds[rIdx].matches[mIdx]) return;
    const match = t.rounds[rIdx].matches[mIdx];

    // Highlight card in DOM
    const node = document.querySelector(`.match-node[data-id="${match.id}"]`);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      node.style.boxShadow = '0 0 0 3px var(--accent-primary), 0 0 20px rgba(59, 130, 246, 0.6)';
      setTimeout(() => {
        node.style.boxShadow = '';
      }, 2500);
    }

    if (state.currentView === 'studio') {
      if (t.isLocked) {
        openMatchControlModal(match, rIdx, mIdx);
      } else {
        showToast('Kunci bracket (Lock Bracket) terlebih dahulu untuk menginput skor pertandingan.', 'warning');
      }
    }
  }

  // ==================== CANVAS PAN & ZOOM ====================
  function applyCanvasTransform(canvasEl) {
    if (!canvasEl) return;
    canvasEl.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomLevel})`;
    const pct = `${Math.round(state.zoomLevel * 100)}%`;
    if (el.zoomLevelText) el.zoomLevelText.textContent = pct;
    if (el.liveZoomText) el.liveZoomText.textContent = pct;
  }

  function handleZoom(delta, canvasEl) {
    state.zoomLevel = Math.max(0.4, Math.min(2.0, state.zoomLevel + delta));
    applyCanvasTransform(canvasEl);
  }

  function setupCanvasDrag(containerEl, canvasEl) {
    containerEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('.match-node') || e.target.closest('.canvas-controls')) return;
      state.isDraggingCanvas = true;
      state.dragStartX = e.clientX - state.panX;
      state.dragStartY = e.clientY - state.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.isDraggingCanvas) return;
      state.panX = e.clientX - state.dragStartX;
      state.panY = e.clientY - state.dragStartY;
      applyCanvasTransform(canvasEl);
    });

    window.addEventListener('mouseup', () => {
      state.isDraggingCanvas = false;
    });

    containerEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
      handleZoom(zoomFactor, canvasEl);
    }, { passive: false });
  }

  // ==================== MODAL HELPERS ====================
  function openModal(modalEl) {
    modalEl.classList.remove('hidden');
  }

  function closeModal(modalEl) {
    modalEl.classList.add('hidden');
  }

  function openConfirmModal(title, message, onConfirm) {
    el.confirmTitle.textContent = title;
    el.confirmMessage.innerHTML = message;
    openModal(el.modalConfirm);

    el.btnConfirmAction.onclick = () => {
      closeModal(el.modalConfirm);
      if (onConfirm) onConfirm();
    };
  }

  function applyTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    state.currentTheme = themeName;
    document.querySelectorAll('.theme-card').forEach(c => {
      c.classList.toggle('active', c.dataset.theme === themeName);
    });
  }

  // ==================== EVENT LISTENERS SETUP ====================
  function setupEventListeners() {
    // Navigation
    if (el.btnBackDashboard) el.btnBackDashboard.addEventListener('click', loadDashboard);

    // Corner HUD widget collapse/expand toggles
    const studioHud = document.getElementById('studio-match-progress');
    const btnStudioHudToggle = document.getElementById('btn-studio-hud-toggle');
    if (btnStudioHudToggle && studioHud) {
      btnStudioHudToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        studioHud.classList.toggle('collapsed');
      });
    }

    const liveHud = document.getElementById('live-match-progress');
    const btnLiveHudToggle = document.getElementById('btn-live-hud-toggle');
    if (btnLiveHudToggle && liveHud) {
      btnLiveHudToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        liveHud.classList.toggle('collapsed');
      });
    }

    // Dashboard Search & Filters
    if (el.dashboardSearchInput) el.dashboardSearchInput.addEventListener('input', renderDashboardTournaments);
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderDashboardTournaments();
      });
    });

    // Create Tournament Modal
    const handleOpenCreateModal = () => {
      if (el.formCreateTournament) el.formCreateTournament.reset();
      if (el.createIsDoubles) el.createIsDoubles.checked = false;
      openModal(el.modalCreateTournament);
    };
    el.btnOpenCreateModal.addEventListener('click', handleOpenCreateModal);
    el.btnEmptyCreate.addEventListener('click', handleOpenCreateModal);

    el.formCreateTournament.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('create-name').value.trim();
      const game = document.getElementById('create-game').value.trim();
      const type = document.getElementById('create-type').value;
      const maxParticipants = parseInt(document.getElementById('create-size').value, 10) || 8;
      const isDoubles = !!(el.createIsDoubles && el.createIsDoubles.checked);

      // Start with empty participant list (no dummy teams)
      const initialTeams = [];

      try {
        const res = await fetch('/api/tournaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            game,
            type,
            maxParticipants,
            settings: { isDoubles },
            participants: initialTeams
          })
        });
        const data = await res.json();
        if (data.success) {
          closeModal(el.modalCreateTournament);
          showToast('Tournament created successfully!', 'success');
          navigateToStudio(data.tournament.id);
        }
      } catch (err) {
        showToast('Error creating tournament: ' + err.message, 'error');
      }
    });

    // Editable Tournament Name
    el.btnEditTitle.addEventListener('click', () => {
      el.inputEditTournamentName.value = state.currentTournament?.name || '';
      openModal(el.modalEditName);
    });
    el.studioTournamentName.addEventListener('click', () => {
      el.inputEditTournamentName.value = state.currentTournament?.name || '';
      openModal(el.modalEditName);
    });

    el.formEditName.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = el.inputEditTournamentName.value.trim();
      if (!newName || !state.currentTournament) return;
      state.currentTournament.name = newName;
      el.studioTournamentName.textContent = newName;
      saveTournamentState(false);
      closeModal(el.modalEditName);
      showToast('Tournament title updated!', 'success');
    });

    // Studio Header Action Buttons
    el.btnToggleLock.addEventListener('click', handleToggleLock);
    el.btnToggleHighlight.addEventListener('click', handleToggleHighlight);
    el.btnLiveHighlight.addEventListener('click', handleToggleHighlight);
    el.btnOpenQrModal.addEventListener('click', () => openQrModalForTournament(state.currentTournament.id));
    el.btnOpenLiveView.addEventListener('click', () => navigateToLive(state.currentTournament.id));

    // Drawer Tabs
    document.querySelectorAll('.rail-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rail-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const panelId = btn.dataset.panel;
        document.querySelectorAll('.drawer-panel').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(`panel-${panelId}`);
        if (target) target.classList.add('active');

        el.studioDrawer.classList.remove('collapsed');
      });
    });

    el.btnDrawerCollapse.addEventListener('click', () => {
      el.studioDrawer.classList.toggle('collapsed');
    });

    // Add Participant, Auto-Seed & Random Seed
    el.addParticipantForm.addEventListener('submit', handleAddParticipant);
    el.btnAutoSeed.addEventListener('click', handleAutoSeed);
    if (el.btnRandomSeed) el.btnRandomSeed.addEventListener('click', handleRandomSeed);
    el.btnBulkAdd.addEventListener('click', () => openModal(el.modalBulkAdd));
    el.formBulkAdd.addEventListener('submit', handleBulkAdd);

    // Settings
    el.settingGameInput.addEventListener('change', () => {
      if (state.currentTournament) {
        state.currentTournament.game = el.settingGameInput.value.trim();
        saveTournamentState(false);
      }
    });

    el.settingBronzeMatch.addEventListener('change', () => {
      if (state.currentTournament) {
        state.currentTournament.settings = state.currentTournament.settings || {};
        state.currentTournament.settings.thirdPlaceMatch = el.settingBronzeMatch.checked;
        if (el.settingBronzeMatch.checked) {
          getOrInitThirdPlaceMatch(state.currentTournament);
        }
        saveTournamentState(false);
        renderBracketStudio();
        showToast(el.settingBronzeMatch.checked ? '🥉 Perebutan Juara 3 (Bronze Match) ditampilkan di bawah Final!' : 'Perebutan Juara 3 disembunyikan', 'info');
      }
    });

    el.btnResetScores.addEventListener('click', () => {
      openConfirmModal(
        'Reset Match Scores?',
        'This will clear all recorded scores and winner advancements in the bracket.',
        () => {
          const t = state.currentTournament;
          t.rounds = generateBracketTree(t.participants);
          t.status = 'setup';
          t.isLocked = false;
          saveTournamentState(true);
          setupStudioUI();
          renderBracketStudio();
          showToast('Match scores reset to initial state.', 'info');
        }
      );
    });

    // Theme Switcher
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const theme = card.dataset.theme;
        applyTheme(theme);
        if (state.currentTournament) {
          state.currentTournament.settings = state.currentTournament.settings || {};
          state.currentTournament.settings.theme = theme;
          saveTournamentState(false);
        }
      });
    });

    // Canvas Pan and Zoom Controls
    setupCanvasDrag(el.canvasContainer, el.bracketCanvas);
    setupCanvasDrag(el.liveCanvasContainer, el.liveCanvas);

    el.btnZoomIn.addEventListener('click', () => handleZoom(0.15, el.bracketCanvas));
    el.btnZoomOut.addEventListener('click', () => handleZoom(-0.15, el.bracketCanvas));
    el.btnZoomReset.addEventListener('click', () => {
      state.zoomLevel = 1.0;
      state.panX = 40;
      state.panY = 40;
      applyCanvasTransform(el.bracketCanvas);
    });
    el.btnCenterBracket.addEventListener('click', () => {
      state.panX = 60;
      state.panY = 60;
      applyCanvasTransform(el.bracketCanvas);
    });

    // Live Canvas Controls
    el.btnLiveZoomIn.addEventListener('click', () => handleZoom(0.15, el.liveCanvas));
    el.btnLiveZoomOut.addEventListener('click', () => handleZoom(-0.15, el.liveCanvas));
    el.btnLiveCenter.addEventListener('click', () => {
      state.panX = 60;
      state.panY = 60;
      applyCanvasTransform(el.liveCanvas);
    });

    // Match Control Modal
    el.modalMatchControl.querySelectorAll('.status-btn').forEach(b => {
      b.addEventListener('click', () => {
        el.modalMatchControl.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
      });
    });
    el.btnSaveMatchScore.addEventListener('click', handleSaveMatchScores);
    el.btnDirectWinP1.addEventListener('click', () => handleDirectWin('p1'));
    el.btnDirectWinP2.addEventListener('click', () => handleDirectWin('p2'));
    el.btnClearMatchResult.addEventListener('click', handleResetMatchResult);

    // QR Modal Copy URL & Doubles Mode Toggle
    el.btnCopyQrUrl.addEventListener('click', () => {
      navigator.clipboard.writeText(el.qrUrlText.value).then(() => {
        showToast('Registration URL copied to clipboard!', 'success');
      });
    });



    // Match Search & Jump
    if (el.btnOpenMatchSearch) {
      el.btnOpenMatchSearch.addEventListener('click', openMatchSearchModal);
    }
    if (el.btnLiveMatchSearch) {
      el.btnLiveMatchSearch.addEventListener('click', openMatchSearchModal);
    }
    if (el.inputSearchMatch) {
      el.inputSearchMatch.addEventListener('input', renderMatchSearchResults);
    }
    if (el.modalMatchSearch) {
      el.modalMatchSearch.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          el.modalMatchSearch.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.activeSearchFilter = pill.dataset.filter;
          renderMatchSearchResults();
        });
      });
    }

    // QR Deadline Preset & Save
    if (el.qrDeadlinePreset) {
      el.qrDeadlinePreset.addEventListener('change', () => {
        if (el.qrDeadlineCustom) {
          el.qrDeadlineCustom.classList.toggle('hidden', el.qrDeadlinePreset.value !== 'custom');
        }
      });
    }

    if (el.btnSaveQrDeadline) {
      el.btnSaveQrDeadline.addEventListener('click', () => {
        const t = state.currentTournament;
        if (!t) return;
        const val = el.qrDeadlinePreset.value;
        if (val === 'none') {
          t.registrationDeadline = null;
        } else if (val === 'custom') {
          if (!el.qrDeadlineCustom.value) {
            showToast('Pilih tanggal dan jam custom terlebih dahulu!', 'warning');
            return;
          }
          t.registrationDeadline = new Date(el.qrDeadlineCustom.value).toISOString();
        } else {
          const mins = parseInt(val, 10);
          t.registrationDeadline = new Date(Date.now() + mins * 60000).toISOString();
        }
        saveTournamentState(false);
        refreshQrDeadlineUI(t);
        showToast('Batas waktu pendaftaran QR berhasil disimpan!', 'success');
      });
    }

    // Auto-Lock Bracket Timer
    if (el.btnSaveAutoLock) {
      el.btnSaveAutoLock.addEventListener('click', () => {
        const t = state.currentTournament;
        if (!t) return;
        const val = el.settingAutoLockSelect.value;
        if (val === 'none') {
          t.autoLockAt = null;
        } else if (val === 'sync_qr') {
          if (!t.registrationDeadline) {
            showToast('Batas waktu QR belum diatur. Atur waktu QR terlebih dahulu atau pilih menit.', 'warning');
            return;
          }
          t.autoLockAt = t.registrationDeadline;
        } else {
          const mins = parseInt(val, 10);
          t.autoLockAt = new Date(Date.now() + mins * 60000).toISOString();
        }
        saveTournamentState(false);
        updateAutoLockTimerUI();
        showToast('Timer auto-lock bracket berhasil disimpan!', 'success');
      });
    }

    // Initialize CSV Uploader (drag-and-drop & file selection)
    setupCsvUploader();

    // Generic Modal Close Buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById(btn.dataset.close);
        if (modal) closeModal(modal);
      });
    });

    // Close modal when clicking on overlay background
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    });
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
