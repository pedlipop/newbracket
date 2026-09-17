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
    isDraggingSlot: false,
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
    regTeammateCount: 1,
    lang: localStorage.getItem('cngr_lang') || 'id',
    drawerParticipants: { search: '', page: 1, pageSize: 30 },
    reportFilter: { search: '', filter: 'all', page: 1, pageSize: 30 },
    queueCardsCollapsed: new Set(),
    queueCompactAll: false
  };

  // ==================== I18N TRANSLATION DICTIONARY ====================
  const I18N = {
    id: {
      portal_title: 'CNGR TOURNAMENT HUB',
      portal_sub: 'Live Spectator & Bracket Portal',
      portal_badge: '<span class="pulse-dot"></span> LIVE COMPETITION HUB',
      portal_hero_title: 'Jadwal & Bagan Pertandingan',
      portal_hero_desc: 'Pantau bracket langsung, skor pertandingan realtime, dan pendaftaran turnamen.',
      portal_search_ph: 'Cari nama turnamen atau cabang lomba...',
      filter_all: 'Semua',
      filter_in_progress: '🔴 Sedang Main',
      filter_setup: '⏳ Pendaftaran / Segera',
      filter_completed: '🏆 Selesai',
      portal_empty_title: 'Belum Ada Turnamen',
      portal_empty_desc: 'Turnamen yang dibuat panitia akan tampil di sini.',
      dash_title: 'CNGR BRACKET ENGINE',
      dash_sub: 'Tournament Studio & Live Hub',
      dash_create_btn: 'Create Tournament',
      dash_search_ph: 'Search tournaments by name or game...',
      dash_empty_title: 'No Tournaments Found',
      dash_empty_desc: 'Get started by creating your first tournament bracket with QR registration!',
      studio_back_dash: 'Dashboard',
      studio_search_btn: 'Cari Match',
      studio_focus_btn: 'Live Focus',
      studio_lock_btn: 'Lock Bracket',
      studio_unlock_btn: 'Unlock Bracket',
      studio_qr_btn: 'Player QR',
      studio_live_btn: 'Live Spectator',
      nav_teams: 'Teams',
      nav_format: 'Format',
      nav_themes: 'Themes',
      drawer_participants: 'Participants',
      btn_auto_seed: 'Auto-Seed',
      btn_random_seed: 'Random Seed',
      btn_bulk_add: 'Bulk Add',
      ph_add_participant: 'Add team/player name...',
      drag_hint: 'Drag any participant onto a bracket slot to assign or swap seeds!',
      drawer_settings: 'Tournament Settings',
      label_category_game: 'Tournament Category / Game',
      ph_setting_game: 'e.g. Valorant, MLBB, Tekken 8',
      label_bracket_format: 'Bracket Format',
      opt_single_elim: 'Single Elimination',
      opt_double_elim: 'Double Elimination',
      hint_format_locked: 'Format is locked during active bracket generation.',
      label_bronze_match: 'Include 3rd Place (Bronze) Match',
      label_autolock: 'Auto-Lock Bracket Timer',
      hint_autolock: 'Kunci bracket secara otomatis setelah timer habis agar pertandingan langsung segera dimulai.',
      autolock_none: 'Mati (Kunci Manual)',
      autolock_3m: '3 Menit Lagi',
      autolock_5m: '5 Menit Lagi',
      autolock_10m: '10 Menit Lagi',
      autolock_15m: '15 Menit Lagi',
      autolock_30m: '30 Menit Lagi',
      autolock_sync_qr: 'Sesuai Batas Waktu QR',
      btn_set_timer: 'Set Timer',
      title_reset_tournament: 'Reset Tournament',
      desc_reset_tournament: 'Reset all match scores and restore bracket to initial setup.',
      btn_reset_scores: 'Reset Match Scores',
      drawer_themes: 'Aesthetic Themes',
      theme_dark: 'Modern Esports (Dark)',
      theme_cyber: 'Midnight Neon',
      theme_light: 'Clean Minimal (Light)',
      hud_title: 'Progres Match',
      hud_active: 'Match Berlangsung:',
      hud_next: 'Akan Main Selanjutnya:',
      live_all_tournaments: 'Semua Turnamen',
      live_spectator_sub: 'Official Spectator View',
      live_tag: '<span class="pulse-dot"></span> LIVE UPDATES',
      live_search_btn: 'Cari',
      live_focus_btn: 'Live Focus',
      not_started_badge: 'SEGERA DIMULAI',
      not_started_title: 'Permainan Belum Dimulai',
      not_started_desc: 'Bagan pertandingan (bracket) sedang dipersiapkan oleh panitia. Halaman ini akan otomatis terupdate begitu pertandingan dimulai.',
      not_started_waiting: 'Menunggu Pembukaan',
      reg_badge: 'PARTICIPANT REGISTRATION',
      reg_title: 'Tournament Registration',
      reg_desc: 'Daftarkan tim Anda untuk masuk ke bagan turnamen.',
      reg_registered_badge: 'Peserta Telah Terdaftar',
      reg_open_badge: 'Pendaftaran Dibuka',
      reg_closed_title: 'Pendaftaran Telah Ditutup',
      reg_closed_desc: 'Batas waktu pendaftaran telah berakhir atau bagan pertandingan telah dikunci oleh panitia.',
      reg_view_live_btn: 'Lihat Live Bracket Pertandingan',
      reg_team_name_label: 'Nama Tim (Opsional - jika kosong otomatis TIM [Nama Depan])',
      reg_team_name_ph: 'Contoh: Garuda Team (Opsional)',
      reg_main_player_title: 'Data Pemain Utama',
      reg_main_player_name: 'Nama Lengkap Pemain Utama',
      reg_main_player_ph: 'Masukkan nama lengkap pemain utama',
      reg_wecom_label: 'No. Wecom',
      reg_wecom_ph: 'No. Wecom / WA',
      reg_dept_label: 'Departemen (Dept)',
      reg_dept_ph: 'Contoh: Produksi, IT, HR',
      reg_partner_title: 'Data Rekan Satu Tim',
      reg_partner_count_label: 'Jumlah Rekan Tim:',
      reg_submit_btn: 'Submit Pendaftaran',
      reg_success_title: 'Pendaftaran Berhasil Terkonfirmasi!',
      reg_success_desc: 'Anda resmi terdaftar dalam bagan pertandingan turnamen. Pantau live bracket pertandingan melalui link di bawah:',
      btn_copy: 'Salin',
      btn_open_live_now: 'Buka Live Bracket Sekarang',
      modal_create_title: 'Create New Tournament',
      label_tourn_name: 'Tournament Title',
      ph_tourn_name: 'e.g. Valorant Championship Cup',
      label_tourn_game: 'Game / Category',
      ph_tourn_game: 'e.g. Valorant, MLBB, Tekken 8, Badminton',
      label_tourn_format: 'Format',
      label_tourn_size: 'Initial Participants',
      label_tourn_doubles: 'Mode Ganda / Tim (2 Pemain per Tim)',
      btn_cancel: 'Cancel',
      btn_create_tournament: 'Create Tournament',
      modal_qr_title: 'Participant Registration QR',
      modal_qr_instructions: 'Scan this QR code with a phone to register participants directly into the tournament.',
      btn_copy_link: 'Copy Link',
      label_qr_reg_status: 'Status Pendaftaran Form:',
      btn_close_reg_now: 'Tutup Pendaftaran Sekarang',
      btn_open_reg_now: 'Buka Pendaftaran Kembali',
      label_qr_deadline: 'Batas Waktu Otomatis Ditutup:',
      opt_deadline_none: 'Tanpa Batas Waktu (Buka Terus)',
      opt_deadline_5m: '5 Menit Lagi',
      opt_deadline_15m: '15 Menit Lagi',
      opt_deadline_30m: '30 Menit Lagi',
      opt_deadline_1h: '1 Jam Lagi',
      opt_deadline_2h: '2 Jam Lagi',
      opt_deadline_custom: 'Pilih Waktu Custom...',
      btn_save: 'Simpan',
      btn_download_qr: 'Download QR Image',
      btn_open_reg_page: 'Open Registration Page',
      modal_match_details: 'Pengaturan Pertandingan & Skor',
      label_match_status: 'Status Pertandingan:',
      status_scheduled: 'Belum Mulai',
      status_in_progress: 'Sedang Main',
      status_completed: 'Selesai',
      label_score_points: 'Skor / Poin',
      btn_direct_win: 'Menang Langsung 👑',
      btn_reset_match: 'Reset Skor Pertandingan',
      btn_save_score: 'Simpan Skor Pertandingan',
      label_match_note: 'Catatan Pertandingan (Opsional)',
      nav_logs: 'Log Bagan',
      drawer_logs: 'Riwayat / Log Bagan',
      modal_confirm_title: 'Confirmation',
      btn_confirm: 'Confirm',
      modal_edit_name_title: 'Edit Tournament Name',
      btn_save_changes: 'Save Changes',
      modal_bulk_title: 'Bulk Add Participants',
      label_upload_csv: 'Upload File CSV',
      dropzone_prompt: 'Klik atau tarik file CSV ke sini',
      csv_format_hint: 'Format: Nama Lengkap, No Wecom, Dept, [Nama Rekan, Wecom Rekan, Dept Rekan, Nama Tim]',
      or_paste_text: 'ATAU PASTE TEKS / CSV MANUAL',
      label_participant_list: 'Daftar Peserta (Satu per baris atau teks CSV):',
      btn_import_participants: 'Import Peserta',
      modal_search_title: 'Cari Pertandingan (Match)',
      modal_search_sub: 'Cari tim, pemain, ronde, atau status untuk langsung lompat ke match',
      search_match_ph: 'Ketik nama tim / pemain / nomor match...',
      status_next_up: 'Akan Bermain',
      btn_quick_save_status: 'Simpan Status',
      nav_reports: 'Laporan',
      btn_participant_report: 'Laporan Peserta',
      btn_full_report: 'Laporan Pendaftar Link',
      btn_back_to_bracket: 'Kembali ke Bagan',
      report_title: 'Laporan Pendaftar Turnamen',
      report_stat_teams: 'Total Pendaftar / Tim',
      report_stat_athletes: 'Total Atlet / Pemain',
      report_stat_seeded: 'Masuk di Bagan',
      report_stat_unseeded: 'Belum Masuk Bagan',
      btn_export_csv: 'Export Excel / CSV',
      btn_print_report: 'Cetak',
      ph_search_participants: 'Cari nama peserta / seed...',
      ph_search_report: 'Cari tim, pemain, divisi, atau WeCom...',
      filter_seeded: 'Sudah di Bagan',
      filter_unseeded: 'Belum di Bagan',
      th_team_name: 'Nama Tim / Peserta',
      th_captain: 'Ketua / Pemain',
      th_dept: 'Divisi / Dept',
      th_contact: 'Kontak / WeCom',
      th_members: 'Anggota Tim',
      th_reg_time: 'Waktu Mendaftar',
      th_bracket_status: 'Status Bagan',
      th_action: 'Aksi',
      modal_edit_participant_title: 'Edit Data Pendaftar',
      modal_edit_participant_sub: 'Perbarui informasi peserta agar tampil jelas dan akurat di bagan pertandingan.',
      label_team_or_display: 'Nama Tampilan di Bagan / Nama Tim:',
      label_captain_player: 'Nama Pemain Utama / Ketua:',
      label_department: 'Departemen / Divisi:',
      label_wecom_contact: 'No. WeCom / Kontak:',
      label_teammates_list: 'Rekan / Anggota Tim:',
      btn_add_partner: 'Tambah Rekan',
      btn_save_changes: 'Simpan Perubahan',
      btn_edit: 'Edit',
      report_empty_title: 'Tidak Ada Data Pendaftar',
      report_empty_desc: 'Belum ada peserta yang mendaftar melalui link atau form.',
      queue_drawer_title: 'Urutan & Antrian Pertandingan',
      queue_drawer_sub: 'Order of Play, Pengaturan Antrian & Riwayat Match',
      tab_queue_active: 'Antrian & Sedang Main',
      tab_queue_finished: 'Pertandingan Selesai',
      queue_in_progress_title: 'Sedang Berlangsung (In Progress)',
      queue_next_up_divider: 'AKAN MAIN SELANJUTNYA (ANTRIAN TANDING)',
      queue_next_up_title: 'Antrian & Urutan Pertandingan',
      queue_helper_text: 'Gunakan tombol panah atau ganti nomor urut untuk mengubah giliran tanding jika ada match yang tertunda (delay).',
      queue_finished_title: 'Daftar Pertandingan Selesai',
      hud_order_btn: 'Antrian',
      btn_delay_match: 'Tunda',
      btn_start_match: 'Mulai Tanding',
      btn_toggle_compact: 'Mode Ringkas',
      btn_expand_all: 'Mode Detail',
      hint_compact_hover: 'Klik untuk buka detail / Hover untuk info pendaftar'
    },
    zh: {
      portal_title: 'CNGR 赛事中心',
      portal_sub: '实时对阵与观赛平台',
      portal_badge: '<span class="pulse-dot"></span> 实时赛事中心',
      portal_hero_title: '比赛赛程与对阵图',
      portal_hero_desc: '实时查看对阵表、实时比分及比赛扫码报名。',
      portal_search_ph: '搜索比赛名称或项目...',
      filter_all: '全部',
      filter_in_progress: '🔴 进行中',
      filter_setup: '⏳ 报名中 / 即将开始',
      filter_completed: '🏆 已结束',
      portal_empty_title: '暂无赛事',
      portal_empty_desc: '管理员创建的比赛将在此处显示。',
      dash_title: 'CNGR 赛事引擎',
      dash_sub: '赛事工作台与实时中心',
      dash_create_btn: '创建新比赛',
      dash_search_ph: '搜索比赛名称或游戏项目...',
      dash_empty_title: '未找到比赛',
      dash_empty_desc: '立即创建您的第一个比赛对阵图并生成扫码报名！',
      studio_back_dash: '控制面板',
      studio_search_btn: '搜索比赛',
      studio_focus_btn: '实时焦点',
      studio_lock_btn: '锁定对阵',
      studio_unlock_btn: '解锁对阵',
      studio_qr_btn: '选手扫码',
      studio_live_btn: '观赛页面',
      nav_teams: '队伍名单',
      nav_format: '赛制结构',
      nav_themes: '主题风格',
      drawer_participants: '参赛人员',
      btn_auto_seed: '自动排序',
      btn_random_seed: '随机抽签',
      btn_bulk_add: '批量导入',
      ph_add_participant: '输入队伍或选手姓名...',
      drag_hint: '拖拽选手到对阵槽位即可分配或调换种子位置！',
      drawer_settings: '比赛设置',
      label_category_game: '比赛项目 / 类别',
      ph_setting_game: '例如：英雄联盟、羽毛球、乒乓球',
      label_bracket_format: '赛制结构',
      opt_single_elim: '单败淘汰制 (Single Elimination)',
      opt_double_elim: '双败淘汰制 (Double Elimination)',
      hint_format_locked: '对阵生成后赛制已锁定。',
      label_bronze_match: '包含季军赛（争夺第三名）',
      label_autolock: '自动锁定对阵倒计时',
      hint_autolock: '倒计时结束后自动锁定对阵图并正式开始比赛。',
      autolock_none: '关闭（手动锁定）',
      autolock_3m: '3 分钟后',
      autolock_5m: '5 分钟后',
      autolock_10m: '10 分钟后',
      autolock_15m: '15 分钟后',
      autolock_30m: '30 分钟后',
      autolock_sync_qr: '与二维码截止时间同步',
      btn_set_timer: '保存倒计时',
      title_reset_tournament: '重置比赛',
      desc_reset_tournament: '重置所有比分并将对阵图恢复至初始状态。',
      btn_reset_scores: '重置所有比分',
      drawer_themes: '主题风格',
      theme_dark: '现代电竞深色 (Dark)',
      theme_cyber: '午夜霓虹 (Neon)',
      theme_light: '清爽简约浅色 (Light)',
      hud_title: '比赛进度',
      hud_active: '正在进行的比赛:',
      hud_next: '接下来进行:',
      live_all_tournaments: '全部比赛',
      live_spectator_sub: '官方实时观赛',
      live_tag: '<span class="pulse-dot"></span> 实时动态',
      live_search_btn: '搜索',
      live_focus_btn: '焦点高亮',
      not_started_badge: '即将开始',
      not_started_title: '比赛尚未开始',
      not_started_desc: '裁判与组委会正在编排对阵图。比赛一旦开始，本页面将自动刷新并展示实时赛程。',
      not_started_waiting: '等待开赛',
      reg_badge: '参赛选手登记报名',
      reg_title: '比赛选手报名表',
      reg_desc: '请填写报名信息以录入比赛对阵图。',
      reg_registered_badge: '位选手/队伍已报名',
      reg_open_badge: '报名正在进行',
      reg_closed_title: '报名已截止',
      reg_closed_desc: '报名时间已截止，或裁判组已锁定对阵名单。',
      reg_view_live_btn: '查看实时对阵图',
      reg_team_name_label: '战队/队伍名称（选填，留空默认使用队长名字）',
      reg_team_name_ph: '例如：CNGR 先锋队（选填）',
      reg_main_player_title: '队长 / 主选手信息',
      reg_main_player_name: '队长/主选手姓名',
      reg_main_player_ph: '请输入主选手完整姓名',
      reg_wecom_label: '企业微信 / 手机号',
      reg_wecom_ph: '请输入企业微信或手机号',
      reg_dept_label: '所属部门',
      reg_dept_ph: '例如：生产部、信息部、HR',
      reg_partner_title: '队友队员信息',
      reg_partner_count_label: '队员人数：',
      reg_submit_btn: '提交报名信息',
      reg_success_title: '报名成功！',
      reg_success_desc: '您的参赛报名已成功确认！您可以通过下方链接随时查看实时比赛对阵及对决进展：',
      btn_copy: '复制',
      btn_open_live_now: '立即进入实时观赛对阵图',
      modal_create_title: '创建新比赛',
      label_tourn_name: '比赛名称',
      ph_tourn_name: '例如：CNGR 电子竞技争霸赛',
      label_tourn_game: '项目 / 类别',
      ph_tourn_game: '例如：王者荣耀、英雄联盟、羽毛球',
      label_tourn_format: '赛制',
      label_tourn_size: '初始队伍规模',
      label_tourn_doubles: '团队 / 多人赛模式（每队多名选手）',
      btn_cancel: '取消',
      btn_create_tournament: '创建比赛',
      modal_qr_title: '选手扫码报名二维码',
      modal_qr_instructions: '使用手机扫码即可直接录入选手信息并加入对阵图。',
      btn_copy_link: '复制链接',
      label_qr_reg_status: '报名表单通道状态：',
      btn_close_reg_now: '立即关闭报名通道',
      btn_open_reg_now: '重新开启报名通道',
      label_qr_deadline: '报名截止时间设置：',
      opt_deadline_none: '不设截止时间（长期开启）',
      opt_deadline_5m: '5分钟后截止',
      opt_deadline_15m: '15分钟后截止',
      opt_deadline_30m: '30分钟后截止',
      opt_deadline_1h: '1小时后截止',
      opt_deadline_2h: '2小时后截止',
      opt_deadline_custom: '自定义截止时间...',
      btn_save: '保存',
      btn_download_qr: '下载二维码图片',
      btn_open_reg_page: '打开报名网页',
      modal_match_details: '比赛详情与比分录入',
      label_match_status: '比赛状态:',
      status_scheduled: '未开始',
      status_in_progress: '进行中',
      status_completed: '已结束',
      label_score_points: '比分 / 得分',
      btn_direct_win: '判定获胜 👑',
      btn_reset_match: '重置本场比分',
      btn_save_score: '保存比分与晋级',
      modal_confirm_title: '请确认操作',
      btn_confirm: '确认',
      modal_edit_name_title: '修改比赛名称',
      btn_save_changes: '保存更改',
      modal_bulk_title: '批量导入参赛人员',
      label_upload_csv: '上传 CSV 文件',
      dropzone_prompt: '点击或将 CSV 文件拖拽到此处',
      csv_format_hint: '格式: 姓名, 企业微信/手机, 部门, [队友姓名, 队友微信号, 队友部门, 队名]',
      or_paste_text: '或直接粘贴名单文本 / CSV',
      label_participant_list: '选手名单（每行一位，支持逗号分隔）：',
      btn_import_participants: '确认导入名单',
      modal_search_title: '搜索对战比赛',
      modal_search_sub: '可搜索选手、队伍名称、轮次或比赛状态快速定位',
      search_match_ph: '输入战队名称、选手姓名或场次...',
      status_next_up: '即将开赛',
      btn_quick_save_status: '保存状态',
      nav_reports: '报名报表',
      btn_participant_report: '选手名单',
      btn_full_report: '报名名单报表',
      btn_back_to_bracket: '返回对阵图',
      report_title: '赛事选手报名报表',
      report_stat_teams: '报名总数 / 队伍',
      report_stat_athletes: '参赛选手数',
      report_stat_seeded: '已分配对阵',
      report_stat_unseeded: '未分配对阵',
      btn_export_csv: '导出 Excel / CSV',
      btn_print_report: '打印报表',
      ph_search_participants: '搜索选手姓名或签号...',
      ph_search_report: '搜索队伍、选手、部门或微信号...',
      filter_seeded: '已分配对阵',
      filter_unseeded: '未分配对阵',
      th_team_name: '队伍 / 选手名称',
      th_captain: '队长 / 主力选手',
      th_dept: '部门 / 车间',
      th_contact: '联系方式 / 微信号',
      th_members: '队伍成员',
      th_reg_time: '报名时间',
      th_bracket_status: '对阵状态',
      th_action: '操作',
      modal_edit_participant_title: '编辑选手信息',
      modal_edit_participant_sub: '更新报名选手资料，以便在对阵图及选手中清晰显示。',
      label_team_or_display: '对阵图显示名称 / 战队名称:',
      label_captain_player: '主力选手 / 队长姓名:',
      label_department: '所属部门 / 车间:',
      label_wecom_contact: '企业微信 / 联系方式:',
      label_teammates_list: '队友名单 (双人/团队):',
      btn_add_partner: '添加队友',
      btn_save_changes: '保存更改',
      btn_edit: '编辑',
      report_empty_title: '暂无报名数据',
      report_empty_desc: '暂无选手通过报名链接或表单提交报名。',
      label_match_note: '比赛备注（选填）',
      nav_logs: '对阵日志',
      drawer_logs: '对阵变更日志',
      queue_drawer_title: '比赛出场顺序与队列',
      queue_drawer_sub: '出场顺序 (Order of Play)、队列调整与已完赛记录',
      tab_queue_active: '待开赛与进行中',
      tab_queue_finished: '已完赛记录',
      queue_in_progress_title: '正在进行的比赛 (In Progress)',
      queue_next_up_divider: '接下来出场（比赛队列）',
      queue_next_up_title: '出场顺序与比赛队列',
      queue_helper_text: '如有比赛延迟，可使用上下箭头或更改序号调整出场顺序。',
      queue_finished_title: '已完成比赛列表',
      hud_order_btn: '队列',
      btn_delay_match: '延后',
      btn_start_match: '开始比赛',
      btn_toggle_compact: '精简模式',
      btn_expand_all: '详细模式',
      hint_compact_hover: '点击展开详情 / 悬停查看选手资料'
    }
  };

  function t(key) {
    const lang = state.lang || 'id';
    return (I18N[lang] && I18N[lang][key]) || (I18N.id && I18N.id[key]) || key;
  }

  function setLanguage(lang) {
    state.lang = lang;
    localStorage.setItem('cngr_lang', lang);
    const isZh = lang === 'zh';

    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      const val = t(key);
      if (val) {
        if (val.includes('<') && val.includes('>')) {
          element.innerHTML = val;
        } else {
          element.textContent = val;
        }
      }
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(element => {
      const key = element.dataset.i18nPh;
      const val = t(key);
      if (val) element.placeholder = val;
    });

    document.querySelectorAll('.lang-toggle-text').forEach(element => {
      element.textContent = isZh ? '🇮🇩 ID' : '🇨🇳 中文';
    });

    // Re-render current view with new translations
    if (state.currentView === 'portal') {
      renderViewerPortalTournaments();
    } else if (state.currentView === 'dashboard') {
      renderDashboardTournaments();
    } else if (state.currentView === 'studio' && state.currentTournament) {
      setupStudioUI();
      renderParticipantsDrawer();
      renderBracketStudio();
    } else if (state.currentView === 'live' && state.currentTournament) {
      el.liveTournamentName.textContent = state.currentTournament.name;
      el.liveGameBadge.textContent = isZh ? `${state.currentTournament.game || '电竞'} • 官方实时观赛` : `${state.currentTournament.game || 'Esports'} • Live Spectator View`;
      renderBracketView(el.liveRoundsContainer, el.liveSvg, state.currentTournament.rounds || [], true);
      updateMatchProgressHUD(state.currentTournament.rounds || [], true);
    } else if (state.currentView === 'register' && state.currentTournament) {
      loadPublicRegisterView(state.currentTournament.id);
    }
  }

  // DOM Elements Cache
  const el = {};

  function initElements() {
    // Views
    el.portalView = document.getElementById('portal-view');
    el.dashboardView = document.getElementById('dashboard-view');
    el.studioView = document.getElementById('studio-view');
    el.liveView = document.getElementById('live-view');
    el.registerView = document.getElementById('register-view');

    // Public Viewer Portal
    el.portalTournamentsGrid = document.getElementById('portal-tournaments-grid');
    el.portalSearchInput = document.getElementById('portal-search-input');
    el.portalEmptyState = document.getElementById('portal-empty-state');

    // Dashboard (Admin)
    el.tournamentsGrid = document.getElementById('tournaments-grid');
    el.dashboardSearchInput = document.getElementById('dashboard-search-input');
    el.dashboardEmptyState = document.getElementById('dashboard-empty-state');
    el.btnOpenCreateModal = document.getElementById('btn-open-create-modal');
    el.btnEmptyCreate = document.getElementById('btn-empty-create');

    // Live View Header
    el.btnLiveBackPortal = document.getElementById('btn-live-back-portal');

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
    el.drawerResizeHandle = document.getElementById('drawer-resize-handle');
    el.btnFloatingDrawerToggle = document.getElementById('btn-floating-drawer-toggle');
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

    // Drawer Participant Search & Pagination
    el.drawerParticipantSearch = document.getElementById('drawer-participant-search');
    el.btnClearDrawerSearch = document.getElementById('btn-clear-drawer-search');
    el.drawerPagination = document.getElementById('drawer-pagination');
    el.drawerPageInfo = document.getElementById('drawer-page-info');
    el.drawerPageIndicator = document.getElementById('drawer-page-indicator');
    el.btnDrawerPrevPage = document.getElementById('btn-drawer-prev-page');
    el.btnDrawerNextPage = document.getElementById('btn-drawer-next-page');
    el.drawerPageSizeSelect = document.getElementById('drawer-page-size-select');
    el.btnDrawerFullReport = document.getElementById('btn-drawer-full-report');

    // Studio Reports View
    el.btnStudioOpenReport = document.getElementById('btn-studio-open-report');
    el.railBtnReports = document.getElementById('rail-btn-reports');
    el.studioReportView = document.getElementById('studio-report-view');
    el.btnCloseReportView = document.getElementById('btn-close-report-view');
    el.btnReportExportCsv = document.getElementById('btn-report-export-csv');
    el.btnReportPrint = document.getElementById('btn-report-print');
    el.reportTournamentSubtitle = document.getElementById('report-tournament-subtitle');
    el.reportStatTeams = document.getElementById('report-stat-teams');
    el.reportStatAthletes = document.getElementById('report-stat-athletes');
    el.reportStatSeeded = document.getElementById('report-stat-seeded');
    el.reportStatUnseeded = document.getElementById('report-stat-unseeded');
    el.reportSearchInput = document.getElementById('report-search-input');
    el.reportTableBody = document.getElementById('report-table-body');
    el.reportEmptyState = document.getElementById('report-empty-state');
    el.reportPagination = document.getElementById('report-pagination');
    el.reportPageInfo = document.getElementById('report-page-info');
    el.reportTopPageInfo = document.getElementById('report-top-page-info');
    el.btnReportPrevPage = document.getElementById('btn-report-prev-page');
    el.btnReportNextPage = document.getElementById('btn-report-next-page');
    el.btnReportTopPrevPage = document.getElementById('btn-report-top-prev-page');
    el.btnReportTopNextPage = document.getElementById('btn-report-top-next-page');
    el.reportPageIndicator = document.getElementById('report-page-indicator');
    el.reportPageSizeSelect = document.getElementById('report-page-size-select');
    el.btnQuickStatusSave = document.getElementById('btn-quick-status-save');

    // Modal Edit Participant from Reports
    el.modalEditReportParticipant = document.getElementById('modal-edit-report-participant');
    el.formEditReportParticipant = document.getElementById('form-edit-report-participant');
    el.editReportParticipantId = document.getElementById('edit-report-participant-id');
    el.editReportName = document.getElementById('edit-report-name');
    el.editReportPlayer = document.getElementById('edit-report-player');
    el.editReportDept = document.getElementById('edit-report-dept');
    el.editReportWecom = document.getElementById('edit-report-wecom');
    el.btnAddEditPartner = document.getElementById('btn-add-edit-partner');
    el.editReportPartnersContainer = document.getElementById('edit-report-partners-container');

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
    el.cardMatchP1 = document.getElementById('match-card-p1');
    el.modalP2Seed = document.getElementById('modal-p2-seed');
    el.modalP2Name = document.getElementById('modal-p2-name');
    el.modalP2Score = document.getElementById('modal-p2-score');
    el.btnDirectWinP2 = document.getElementById('btn-direct-win-p2');
    el.cardMatchP2 = document.getElementById('match-card-p2');
    el.btnSaveMatchScore = document.getElementById('btn-save-match-score');
    el.btnClearMatchResult = document.getElementById('btn-clear-match-result');
    el.modalMatchNote = document.getElementById('modal-match-note');
    el.modalMatchWaitingNotice = document.getElementById('modal-match-waiting-notice');
    el.modalMatchWaitingText = document.getElementById('modal-match-waiting-text');

    // Drawer Logs Elements
    el.railBtnLogs = document.getElementById('rail-btn-logs');
    el.panelLogs = document.getElementById('panel-logs');
    el.logsContainer = document.getElementById('logs-container');
    el.logsCountBadge = document.getElementById('logs-count-badge');
    el.btnExportLogs = document.getElementById('btn-export-logs');

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
    el.studioActiveTitle = document.getElementById('studio-active-title');
    el.studioActiveNames = document.getElementById('studio-active-names');
    el.studioUpNextTitle = document.getElementById('studio-up-next-title');
    el.studioUpNextNames = document.getElementById('studio-up-next-names');

    el.liveProgressPct = document.getElementById('live-progress-pct');
    el.liveProgressFill = document.getElementById('live-progress-fill');
    el.liveProgressCount = document.getElementById('live-progress-count');
    el.liveActiveTitle = document.getElementById('live-active-title');
    el.liveActiveNames = document.getElementById('live-active-names');
    el.liveUpNextTitle = document.getElementById('live-up-next-title');
    el.liveUpNextNames = document.getElementById('live-up-next-names');

    // QR Deadline & Registration Toggle Elements
    el.qrRegStatusBadge = document.getElementById('qr-reg-status-badge');
    el.btnToggleRegStatus = document.getElementById('btn-toggle-reg-status');
    el.btnToggleRegText = document.getElementById('btn-toggle-reg-text');
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

    // Match Queue Drawer Elements
    el.matchQueueDrawerOverlay = document.getElementById('match-queue-drawer-overlay');
    el.matchQueueDrawer = document.getElementById('match-queue-drawer');
    el.btnCloseQueueDrawer = document.getElementById('btn-close-queue-drawer');
    el.btnQueueTabActive = document.getElementById('btn-queue-tab-active');
    el.btnQueueTabFinished = document.getElementById('btn-queue-tab-finished');
    el.queuePanelActive = document.getElementById('queue-panel-active');
    el.queuePanelFinished = document.getElementById('queue-panel-finished');
    el.queueActiveCount = document.getElementById('queue-active-count');
    el.queueFinishedCount = document.getElementById('queue-finished-count');
    el.inProgressBadgeCount = document.getElementById('in-progress-badge-count');
    el.nextUpBadgeCount = document.getElementById('next-up-badge-count');
    el.finishedBadgeCount = document.getElementById('finished-badge-count');
    el.queueInProgressList = document.getElementById('queue-in-progress-list');
    el.queueNextUpList = document.getElementById('queue-next-up-list');
    el.queueFinishedList = document.getElementById('queue-finished-list');
    el.btnToggleCompactAll = document.getElementById('btn-toggle-compact-all');
    el.btnToggleCompactAllText = document.getElementById('btn-toggle-compact-all-text');

    el.toastContainer = document.getElementById('toast-container');
  }

  // ==================== ROUTING & INITIALIZATION ====================
  async function initApp() {
    initElements();
    setupEventListeners();
    setupDrawerResize();
    setLanguage(state.lang);
    handleRoute();
    window.addEventListener('popstate', handleRoute);
    setInterval(updateAutoLockTimerUI, 1000);
  }

  function handleRoute() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const tournamentId = params.get('id');

    if (view === 'studio' && tournamentId) {
      loadTournamentStudio(tournamentId);
    } else if (view === 'live' && tournamentId) {
      loadPublicLiveView(tournamentId);
    } else if (view === 'register' && tournamentId) {
      loadPublicRegisterView(tournamentId);
    } else if (view === 'admin' || view === 'dashboard') {
      loadDashboard();
    } else {
      // Default: Public Spectator Landing Page
      loadViewerPortal();
    }
  }

  function switchView(viewName) {
    state.currentView = viewName;
    if (el.portalView) el.portalView.classList.add('hidden');
    if (el.dashboardView) el.dashboardView.classList.add('hidden');
    if (el.studioView) el.studioView.classList.add('hidden');
    if (el.liveView) el.liveView.classList.add('hidden');
    if (el.registerView) el.registerView.classList.add('hidden');

    if (state.livePollingTimer) {
      clearInterval(state.livePollingTimer);
      state.livePollingTimer = null;
    }

    if (viewName === 'portal' && el.portalView) el.portalView.classList.remove('hidden');
    if (viewName === 'dashboard' && el.dashboardView) el.dashboardView.classList.remove('hidden');
    if (viewName === 'studio' && el.studioView) el.studioView.classList.remove('hidden');
    if (viewName === 'live' && el.liveView) el.liveView.classList.remove('hidden');
    if (viewName === 'register' && el.registerView) {
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

  // ==================== VIEWER PORTAL VIEW (PUBLIC LANDING PAGE) ====================
  async function loadViewerPortal() {
    switchView('portal');
    window.history.replaceState({}, '', '/');
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      state.tournaments = data.tournaments || [];
      renderViewerPortalTournaments();
    } catch (err) {
      showToast('Gagal memuat turnamen: ' + err.message, 'error');
    }
  }

  function renderViewerPortalTournaments() {
    if (!el.portalTournamentsGrid) return;
    const search = (el.portalSearchInput ? el.portalSearchInput.value : '').trim().toLowerCase();
    const activeChip = document.querySelector('.portal-filter.active');
    const filter = activeChip ? activeChip.dataset.filter : 'all';
    const isZh = state.lang === 'zh';

    let filtered = state.tournaments.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search) || (t.game && t.game.toLowerCase().includes(search));
      const matchFilter = filter === 'all' || t.status === filter;
      return matchSearch && matchFilter;
    });

    if (filtered.length === 0) {
      el.portalTournamentsGrid.innerHTML = '';
      if (el.portalEmptyState) el.portalEmptyState.classList.remove('hidden');
      return;
    }

    if (el.portalEmptyState) el.portalEmptyState.classList.add('hidden');

    el.portalTournamentsGrid.innerHTML = filtered.map(t => {
      const isLive = t.status === 'in_progress';
      const isCompleted = t.status === 'completed';
      const isSetup = t.status === 'setup';
      const isDoubles = !!(t.settings && (t.settings.isDoubles === true || t.settings.isDoubles === 'true' || t.settings.isDoubles === 1 || t.settings.isDoubles === '1'));
      const formatLabel = isDoubles ? (isZh ? '团队 / 双人赛' : 'Mode Tim / Ganda') : (isZh ? '个人 / 单人赛' : 'Individu / Single');
      const participantCount = t.participants ? t.participants.length : 0;
      const maxSlots = t.maxParticipants || 8;
      const participantsUnit = isZh ? '支队伍/选手' : 'Tim/Pemain';
      const watchText = isZh ? '观看实时对阵' : 'Tonton Live Bracket';
      const registerText = isZh ? '立即报名' : 'Daftar';

      let statusBadge = '';
      if (isLive) {
        statusBadge = isZh
          ? '<span class="badge badge-in-progress"><span class="pulse-dot"></span> 进行中</span>'
          : '<span class="badge badge-in-progress"><span class="pulse-dot"></span> SEDANG MAIN</span>';
      } else if (isCompleted) {
        statusBadge = isZh
          ? '<span class="badge badge-completed"><i class="fa-solid fa-trophy"></i> 已结束</span>'
          : '<span class="badge badge-completed"><i class="fa-solid fa-trophy"></i> SELESAI</span>';
      } else {
        statusBadge = isZh
          ? '<span class="badge badge-setup"><i class="fa-solid fa-clock"></i> 报名中</span>'
          : '<span class="badge badge-setup"><i class="fa-solid fa-clock"></i> PENDAFTARAN</span>';
      }

      return `
        <div class="portal-card status-${t.status || 'setup'}">
          <div>
            <div class="portal-card-top">
              ${statusBadge}
              <span class="portal-card-game">${escapeHTML(t.game || (isZh ? '综合项目' : 'Esports'))}</span>
            </div>
            <h3 class="portal-card-title">${escapeHTML(t.name)}</h3>
            <div class="portal-card-meta">
              <span><i class="fa-solid fa-users"></i> ${participantCount} / ${maxSlots} ${participantsUnit}</span>
              <span><i class="fa-solid fa-shield"></i> ${formatLabel}</span>
            </div>
          </div>

          <div class="portal-card-actions">
            <a href="?view=live&id=${t.id}" class="btn btn-primary btn-portal-watch" data-id="${t.id}">
              <i class="fa-solid fa-play"></i> ${watchText}
            </a>
            ${isSetup ? `
              <a href="?view=register&id=${t.id}" class="btn btn-secondary btn-portal-register" data-id="${t.id}">
                <i class="fa-solid fa-user-plus"></i> ${registerText}
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners to portal card action buttons
    el.portalTournamentsGrid.querySelectorAll('.btn-portal-watch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        e.stopPropagation();
        navigateToLive(btn.dataset.id);
      });
    });

    el.portalTournamentsGrid.querySelectorAll('.btn-portal-register').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        e.stopPropagation();
        window.history.pushState({}, '', `?view=register&id=${btn.dataset.id}`);
        loadPublicRegisterView(btn.dataset.id);
      });
    });
  }

  // ==================== DASHBOARD VIEW (ADMIN) ====================
  async function loadDashboard() {
    switchView('dashboard');
    window.history.replaceState({}, '', '?view=admin');

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
    const activeChip = document.querySelector('.filter-chip:not(.portal-filter).active');
    const filter = activeChip ? activeChip.dataset.filter : 'all';
    const isZh = state.lang === 'zh';

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
      let statusText = (t.status || 'setup').replace('_', ' ').toUpperCase();
      if (isZh) {
        if (t.status === 'in_progress') statusText = '进行中';
        else if (t.status === 'completed') statusText = '已结束';
        else statusText = '准备中';
      }
      const typeLabel = (t.type === 'double_elimination')
        ? (isZh ? '双败淘汰制' : 'Double Elimination')
        : (isZh ? '单败淘汰制' : 'Single Elimination');
      const studioLabel = isZh ? '工作台' : 'Studio';
      const liveLabel = isZh ? '观赛直播' : 'Live';

      const isRegClosed = !!(t.isLocked || t.isRegistrationClosed || (t.registrationDeadline && Date.now() > new Date(t.registrationDeadline).getTime()));
      const regBadge = isRegClosed
        ? `<span class="badge" style="font-size:10px; padding:2px 6px; border-radius:4px; background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);"><i class="fa-solid fa-lock"></i> ${isZh ? '报名已关闭' : 'Reg Tutup'}</span>`
        : `<span class="badge" style="font-size:10px; padding:2px 6px; border-radius:4px; background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.3);"><i class="fa-solid fa-door-open"></i> ${isZh ? '报名开放' : 'Reg Buka'}</span>`;

      return `
        <div class="tournament-card" data-id="${t.id}">
          <div class="card-header">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span class="badge ${statusClass}">${statusText}</span>
              ${regBadge}
            </div>
            <div class="card-menu">
              <button class="btn-card-delete btn-icon-subtle" data-id="${t.id}" title="${isZh ? '删除比赛' : 'Delete tournament'}">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div class="card-body">
            <h3 class="card-title">${escapeHTML(t.name)}</h3>
            <span class="card-game">${escapeHTML(t.game || (isZh ? '常规比赛' : 'Generic Tournament'))}</span>
            <div class="card-meta">
              <span><i class="fa-solid fa-sitemap"></i> ${typeLabel}</span>
              <span><i class="fa-solid fa-users"></i> ${pCount} / ${t.maxParticipants || 8}</span>
            </div>
          </div>
          <div class="card-footer">
            <a href="?view=studio&id=${t.id}" class="btn btn-secondary btn-card-open" data-id="${t.id}">
              <i class="fa-solid fa-pen-to-square"></i> ${studioLabel}
            </a>
            <a href="?view=studio&id=${t.id}&tab=report" class="btn btn-tool btn-card-report" data-id="${t.id}" title="${isZh ? '查看报名报表' : 'Laporan Pendaftar'}">
              <i class="fa-solid fa-clipboard-user"></i> ${isZh ? '报表' : 'Laporan'}
            </a>
            <button class="btn btn-tool btn-card-qr" data-id="${t.id}" title="${isZh ? '显示报名二维码' : 'Show Registration QR'}">
              <i class="fa-solid fa-qrcode"></i> QR
            </button>
            <a href="?view=live&id=${t.id}" class="btn btn-tool btn-card-live" data-id="${t.id}" title="${isZh ? '打开实时观赛页面' : 'Open Live Spectator View'}">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> ${liveLabel}
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Attach card event listeners
    el.tournamentsGrid.querySelectorAll('.btn-card-open').forEach(b => {
      b.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        navigateToStudio(b.dataset.id);
      });
    });
    el.tournamentsGrid.querySelectorAll('.btn-card-report').forEach(b => {
      b.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        navigateToStudio(b.dataset.id);
        setTimeout(() => openStudioReportView(b.dataset.id), 120);
      });
    });
    el.tournamentsGrid.querySelectorAll('.btn-card-live').forEach(b => {
      b.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        navigateToLive(b.dataset.id);
      });
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
      if (reconcileFeederAdvancements(state.currentTournament)) {
        saveTournamentState(false);
      }
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

    if (el.btnOpenLiveView) {
      el.btnOpenLiveView.href = `?view=live&id=${t.id}`;
    }

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

    // Disable auto-seed & random-seed once bracket has started or is locked
    const isSeedingLocked = t.isLocked || t.status === 'in_progress';
    if (el.btnAutoSeed) {
      el.btnAutoSeed.disabled = isSeedingLocked;
      el.btnAutoSeed.style.opacity = isSeedingLocked ? '0.5' : '1';
      el.btnAutoSeed.style.cursor = isSeedingLocked ? 'not-allowed' : 'pointer';
      el.btnAutoSeed.title = isSeedingLocked ? 'Auto-seed dinonaktifkan saat turnamen berjalan' : 'Tempatkan peserta sesuai urutan seed standar';
    }
    if (el.btnRandomSeed) {
      el.btnRandomSeed.disabled = isSeedingLocked;
      el.btnRandomSeed.style.opacity = isSeedingLocked ? '0.5' : '1';
      el.btnRandomSeed.style.cursor = isSeedingLocked ? 'not-allowed' : 'pointer';
      el.btnRandomSeed.title = isSeedingLocked ? 'Random seed dinonaktifkan saat turnamen berjalan' : 'Acak penempatan tim secara random';
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

    // Reconstruct logs if empty and render logs drawer
    if (!t.logs || t.logs.length === 0) {
      reconstructInitialLogs(t);
    }
    renderLogsDrawer();

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

    const isZh = state.lang === 'zh';
    const mainPlayerName = p.playerName || p.name || '';
    const mainDept = p.dept || '';
    const mainWecom = p.wecom || p.contact || '';
    const hasAnyInfo = !!(mainPlayerName || mainDept || mainWecom || partnersList.length > 0);
    if (!hasAnyInfo) return;

    ensureGlobalTooltip();

    let contentHtml = '';
    if (partnersList.length > 0 || p.isTeam) {
      contentHtml = `
        <div class="tooltip-header-strip">
          <i class="fa-solid fa-users"></i> ${isZh ? '团队成员登记信息' : 'Informasi Tim Pendaftar'}
        </div>
        <div class="tooltip-team-banner">
          <span class="team-label">${isZh ? '战队名称:' : 'Tim:'}</span>
          <span class="team-name">${escapeHTML(p.name)}</span>
        </div>
        <div class="tooltip-person-block">
          <div class="person-role-tag">${isZh ? '队长 / 主力选手' : 'Pemain Utama'}</div>
          <div class="person-name">${escapeHTML(mainPlayerName || p.name)}</div>
          ${mainDept ? `<div class="person-meta-item"><i class="fa-solid fa-building"></i> ${escapeHTML(mainDept)}</div>` : ''}
          ${mainWecom ? `<div class="person-meta-item"><i class="fa-solid fa-address-book"></i> No. WeCom: ${escapeHTML(mainWecom)}</div>` : ''}
        </div>
        ${partnersList.map((partner, pIdx) => `
          <div class="tooltip-person-block partner-block">
            <div class="person-role-tag partner">${isZh ? `队员 #${pIdx + 1}` : `Rekan #${pIdx + 1}`}</div>
            <div class="person-name partner-highlight">${escapeHTML(partner.name)}</div>
            ${partner.dept ? `<div class="person-meta-item"><i class="fa-solid fa-building"></i> ${escapeHTML(partner.dept)}</div>` : ''}
            ${partner.wecom ? `<div class="person-meta-item"><i class="fa-solid fa-address-book"></i> No. WeCom: ${escapeHTML(partner.wecom)}</div>` : ''}
          </div>
        `).join('')}
      `;
    } else {
      contentHtml = `
        <div class="tooltip-header-strip">
          <i class="fa-solid fa-id-card"></i> ${isZh ? '选手登记信息' : 'Data Pendaftaran Peserta'}
        </div>
        <div class="tooltip-person-block">
          <div class="person-name primary-highlight">${escapeHTML(mainPlayerName || p.name)}</div>
          ${mainDept ? `<div class="person-meta-item"><i class="fa-solid fa-building"></i> ${escapeHTML(mainDept)}</div>` : ''}
          ${mainWecom ? `<div class="person-meta-item"><i class="fa-solid fa-address-book"></i> No. WeCom: ${escapeHTML(mainWecom)}</div>` : ''}
          ${p.registeredAt ? `<div class="person-meta-item time"><i class="fa-regular fa-clock"></i> ${new Date(p.registeredAt).toLocaleDateString()}</div>` : ''}
        </div>
      `;
    }

    globalTooltipEl.innerHTML = contentHtml;
    globalTooltipEl.classList.remove('hidden');

    const rect = targetEl.getBoundingClientRect();
    const cardWidth = rect.width;

    // Maintain exact width of the card
    globalTooltipEl.style.width = `${cardWidth}px`;
    globalTooltipEl.style.minWidth = `${cardWidth}px`;
    globalTooltipEl.style.maxWidth = `${cardWidth}px`;
    globalTooltipEl.style.boxSizing = 'border-box';

    // Measure height after width has been set and innerHTML applied
    const tooltipRect = globalTooltipEl.getBoundingClientRect();

    let top = rect.top - tooltipRect.height - 6;
    let left = rect.left;

    if (top < 10) {
      top = rect.bottom + 6;
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = Math.max(10, window.innerHeight - tooltipRect.height - 10);
    }
    if (left < 10) left = 10;
    if (left + cardWidth > window.innerWidth - 10) {
      left = window.innerWidth - cardWidth - 10;
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
      if (el.drawerPagination) el.drawerPagination.style.display = 'none';
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

    // 1. Filter by search query
    const query = (state.drawerParticipants.search || '').trim().toLowerCase();
    const indexedParticipants = participants.map((p, idx) => ({ p, idx }));
    const filtered = query
      ? indexedParticipants.filter(({ p, idx }) => {
        const nameMatch = (p.name || '').toLowerCase().includes(query);
        const playerMatch = (p.playerName || '').toLowerCase().includes(query);
        const deptMatch = (p.dept || '').toLowerCase().includes(query);
        const seedMatch = String(idx + 1) === query || `#${idx + 1}` === query;
        return nameMatch || playerMatch || deptMatch || seedMatch;
      })
      : indexedParticipants;

    // 2. Pagination calculation
    const totalItems = filtered.length;
    const rawPageSize = state.drawerParticipants.pageSize;
    const pageSize = rawPageSize === 'all' ? totalItems : (parseInt(rawPageSize, 10) || 16);
    const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)));

    if (state.drawerParticipants.page > totalPages) state.drawerParticipants.page = totalPages;
    if (state.drawerParticipants.page < 1) state.drawerParticipants.page = 1;
    const page = state.drawerParticipants.page;

    const startIndex = (page - 1) * pageSize;
    const pagedItems = rawPageSize === 'all' ? filtered : filtered.slice(startIndex, startIndex + pageSize);

    // 3. Update pagination UI
    if (el.drawerPagination) {
      el.drawerPagination.style.display = totalItems > 0 ? 'flex' : 'none';
      const endItem = Math.min(startIndex + pageSize, totalItems);
      const displayStart = totalItems === 0 ? 0 : startIndex + 1;
      if (el.drawerPageInfo) {
        el.drawerPageInfo.textContent = `${displayStart}-${endItem} / ${totalItems}`;
      }
      if (el.drawerPageIndicator) {
        el.drawerPageIndicator.textContent = `${page} / ${totalPages}`;
      }
      if (el.btnDrawerPrevPage) el.btnDrawerPrevPage.disabled = page <= 1;
      if (el.btnDrawerNextPage) el.btnDrawerNextPage.disabled = page >= totalPages;
      if (el.drawerPageSizeSelect) el.drawerPageSizeSelect.value = String(rawPageSize);
    }

    if (pagedItems.length === 0) {
      el.participantsList.innerHTML = `<div class="text-subtle" style="padding: 1rem 0; text-align: center;">Tidak ada slot atau peserta yang cocok dengan "${escapeHTML(query)}".</div>`;
      return;
    }

    el.participantsList.innerHTML = pagedItems.map(({ p, idx }) => {
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
          </span>
          ${hasPartner ? `<span class="team-partner-tag" title="Mode Tim (${teamSize} Pemain)">${teamSize}P</span>` : ''}
          <span class="participant-status-dot ${isAssigned ? 'seeded' : 'unseeded'}" title="${isAssigned ? 'Masuk Bagan' : (hasInfo ? 'Belum Di-seed' : 'Wajib Diisi')}"></span>
          ${!t.isLocked ? `
            <button type="button" class="btn-edit-participant" data-id="${p.id}" title="Edit Nama"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="btn-remove-participant" data-id="${p.id}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach hover events for participant details overlay tooltip
    el.participantsList.querySelectorAll('.participant-item').forEach(item => {
      const p = participants.find(part => part.id === item.dataset.id);
      if (p && (p.name || p.playerName || p.dept || p.wecom)) {
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
    const isZh = state.lang === 'zh';
    const roundsFromFinal = totalRounds - roundNum;
    if (roundsFromFinal === 0) return isZh ? '总决赛' : 'Championship Final';
    if (roundsFromFinal === 1) return isZh ? '半决赛' : 'Semifinals';
    if (roundsFromFinal === 2) return isZh ? '四分之一决赛' : 'Quarterfinals';
    if (roundsFromFinal === 3) return isZh ? '16强赛' : 'Round of 16';
    if (roundsFromFinal === 4) return isZh ? '32强赛' : 'Round of 32';
    if (roundsFromFinal === 5) return isZh ? '64强赛' : 'Round of 64';
    return isZh ? `第 ${roundNum} 轮` : `Round ${roundNum}`;
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

  function findNextUpMatches(rounds) {
    if (!rounds || !Array.isArray(rounds)) return [];
    // Only return matches that are explicitly and manually set to 'next_up' by the organizer
    const matches = [];
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const round = rounds[rIdx];
      for (let mIdx = 0; mIdx < (round.matches || []).length; mIdx++) {
        const m = round.matches[mIdx];
        if (m.status === 'next_up') {
          matches.push({ match: m, rIdx, mIdx, roundTitle: round.title });
        }
      }
    }
    return matches;
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
      const isZh = state.lang === 'zh';
      let displayTitle = roundTitle;
      if (isZh) {
        if (displayTitle === 'Championship Final') displayTitle = '总决赛';
        else if (displayTitle === 'Semifinals') displayTitle = '半决赛';
        else if (displayTitle === 'Quarterfinals') displayTitle = '四分之一决赛';
        else if (displayTitle === 'Round of 16') displayTitle = '16强赛';
        else if (displayTitle === 'Round of 32') displayTitle = '32强赛';
        else if (displayTitle === 'Round of 64') displayTitle = '64强赛';
        else if (/^Round\s+(\d+)$/i.test(displayTitle)) displayTitle = displayTitle.replace(/^Round\s+(\d+)$/i, '第 $1 轮');
      }

      const col = document.createElement('div');
      col.className = 'round-column';
      col.dataset.round = rIdx + 1;
      if (colDef.isCenter) col.classList.add('center-final');

      col.innerHTML = `
        <div class="round-header">
          <span class="round-title">${escapeHTML(displayTitle)}</span>
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
        const node = createMatchNodeElement(match, rIdx, origMIdx, isLiveView, finalY);
        matchesHolder.appendChild(node);

        if (finalY + MATCH_HEIGHT > maxColY) {
          maxColY = finalY + MATCH_HEIGHT;
        }
      });

      matchesHolder.style.minHeight = `${maxColY + 40}px`;
    });

    // Dynamically calculate canvas & SVG bounds so large brackets (e.g. 78+ participants) never get clipped
    let maxOverallX = 0;
    let maxOverallY = 0;
    Object.values(matchPositionsMap).forEach(pos => {
      if (pos.x + pos.width > maxOverallX) maxOverallX = pos.x + pos.width;
      if (pos.y + pos.height > maxOverallY) maxOverallY = pos.y + pos.height;
    });

    const canvasW = Math.max(6000, maxOverallX + 1200);
    const canvasH = Math.max(8000, maxOverallY + 1200);

    const canvasParent = svgEl.closest('.bracket-canvas, .live-canvas') || svgEl.parentElement;
    if (canvasParent) {
      canvasParent.style.width = `${canvasW}px`;
      canvasParent.style.height = `${canvasH}px`;
    }
    svgEl.setAttribute('width', canvasW);
    svgEl.setAttribute('height', canvasH);
    svgEl.style.width = `${canvasW}px`;
    svgEl.style.height = `${canvasH}px`;

    // Draw SVG Connectors between rounds
    drawBracketConnectors(svgEl, matchPositionsMap, rounds);
  }

  function createMatchNodeElement(match, rIdx, mIdx, isLiveView, posY) {
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

    // Highlight upcoming next match (PURELY MANUAL: set directly via match status option, supports multiple brackets)
    const isNextUp = match.status === 'next_up';
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

    const isZh = state.lang === 'zh';
    let statusBadgeHtml = '';
    if (isNextUp) {
      statusBadgeHtml = `<span class="match-status-tag next_up" title="${isZh ? '即将开赛的比赛！' : 'Pertandingan yang akan bertanding selanjutnya!'}"><span class="pulse-indicator-amber"></span> ${isZh ? '即将开赛' : 'AKAN BERMAIN'}</span>`;
    } else if (match.status === 'in_progress') {
      statusBadgeHtml = `<span class="match-status-tag in_progress">${isZh ? '进行中' : 'SEDANG MAIN'}</span>`;
    } else if (match.status === 'completed') {
      statusBadgeHtml = `<span class="match-status-tag completed">${isZh ? '已结束' : 'SELESAI'}</span>`;
    } else {
      statusBadgeHtml = `<span class="match-status-tag scheduled">${isZh ? '未开始' : 'BELUM MULAI'}</span>`;
    }

    const renderRow = (p, slot, score, pClass) => {
      const isSlotLocked = slot === 'p1' ? !!match.p1Locked : !!match.p2Locked;
      const isFeeder = !!(slot === 'p1' ? match.feederTopId : match.feederBotId);
      const isEmpty = !p || !p.id || p.isUnseeded || (p.isPlaceholder && !isFeeder);
      const rawName = (p?.name || '').trim();
      const isUnnamed = !isEmpty && !rawName;
      const emptyPlaceholder = isZh ? '(空位)' : '(Slot Kosong)';
      const tbdPlaceholder = isZh ? '待定' : 'TBD';
      const displayName = isEmpty
        ? (isFeeder ? (p?.name || tbdPlaceholder) : '')
        : (rawName || emptyPlaceholder);

      const partnersList = Array.isArray(p?.partners) && p.partners.length > 0
        ? p.partners
        : (p?.partner && p?.partner.name ? [p.partner] : []);
      const hasPartner = !isEmpty && partnersList.length > 0;
      const teamSize = 1 + partnersList.length;

      const editBtnTitle = isZh ? '编辑选手姓名' : 'Edit Nama Peserta';
      const lockBtnTitle = isZh
        ? (isSlotLocked ? '槽位已锁定（点击解锁）' : '锁定槽位（防止随机抽签打乱）')
        : (isSlotLocked ? 'Slot Terkunci (klik untuk buka)' : 'Kunci Slot (klik agar tidak terpengaruh acak/random)');

      const editBtnHtml = (!isLiveView && !t?.isLocked && !isFeeder && !match.isBronzeMatch)
        ? `<button type="button" class="btn-slot-edit" data-slot="${slot}" data-round="${rIdx}" data-match="${mIdx}" title="${editBtnTitle}">
            <i class="fa-solid fa-pen"></i>
          </button>`
        : '';

      const lockBtnHtml = (!isLiveView && !t?.isLocked && !isFeeder && !match.isBronzeMatch)
        ? `<button type="button" class="btn-slot-lock ${isSlotLocked ? 'locked' : ''}" data-slot="${slot}" data-round="${rIdx}" data-match="${mIdx}" title="${lockBtnTitle}">
            <i class="fa-solid ${isSlotLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
          </button>`
        : (isSlotLocked ? `<span class="slot-locked-tag" title="${isZh ? '槽位已锁定' : 'Slot Terkunci'}"><i class="fa-solid fa-lock"></i></span>` : '');

      const partnerTagTitle = isZh ? `团队模式 (${teamSize}名选手)` : `Mode Tim (${teamSize} Pemain)`;

      return `
        <div class="match-team-row ${pClass} ${isEmpty ? 'is-empty' : ''} ${isSlotLocked ? 'slot-locked' : ''}" data-slot="${slot}" data-round="${rIdx}" data-match="${mIdx}">
          <span class="team-seed">${!isEmpty ? (p?.seed || '') : ''}</span>
          <span class="team-name-text ${isFeeder ? 'is-feeder-text' : ''} ${isEmpty ? 'empty-slot' : ''} ${(!isLiveView && !t?.isLocked && !isFeeder) ? 'editable' : ''}" title="${escapeHTML(rawName || (isEmpty ? '' : emptyPlaceholder))}${(!isLiveView && !t?.isLocked && !isFeeder) ? (isZh ? ' (双击可编辑)' : ' (Dobel klik untuk edit)') : ''}">
            ${isUnnamed ? `<span style="opacity:0.4; font-style:italic;">${emptyPlaceholder}</span>` : escapeHTML(displayName)}
          </span>
          ${hasPartner ? `<span class="team-partner-tag" title="${partnerTagTitle}">${teamSize}P</span>` : ''}
          <div class="slot-actions-cell" style="display:flex; align-items:center; gap:4px; margin-left:auto;">
            ${editBtnHtml}
            ${lockBtnHtml}
            <span class="team-score-badge">${score !== '' && score !== undefined ? score : ''}</span>
          </div>
        </div>
      `;
    };

    const matchLabel = match.isBronzeMatch
      ? (isZh ? '🥉 季军争夺战' : '🥉 3RD PLACE (BRONZE)')
      : (isZh ? `第 ${mIdx + 1} 场` : `MATCH ${mIdx + 1}`);
    const noteBadgeHtml = match.note
      ? `<span class="match-meta-note" title="Catatan: ${escapeHTML(match.note)}"><i class="fa-solid fa-note-sticky"></i></span>`
      : '';

    node.innerHTML = `
      <div class="match-meta-strip ${match.isBronzeMatch ? 'bronze-meta-strip' : ''}">
        <span class="match-meta-left" style="display:flex; align-items:center; gap:4px;">${matchLabel} ${noteBadgeHtml}</span>
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

    // Attach hover events for registration & member overlay tooltip on match rows
    const row1 = node.querySelector('[data-slot="p1"]');
    const row2 = node.querySelector('[data-slot="p2"]');
    const hasParticipantInfo = (p) => !!(p && !p.isPlaceholder && !p.isUnseeded && (p.name || p.playerName || p.dept || p.wecom || (Array.isArray(p.partners) && p.partners.length > 0) || (p.partner && p.partner.name)));

    if (row1 && hasParticipantInfo(p1)) {
      row1.addEventListener('mouseenter', () => showGlobalTooltip(row1, p1));
      row1.addEventListener('mouseleave', hideGlobalTooltip);
    }
    if (row2 && hasParticipantInfo(p2)) {
      row2.addEventListener('mouseenter', () => showGlobalTooltip(row2, p2));
      row2.addEventListener('mouseleave', hideGlobalTooltip);
    }

    // Interactive Drag & Drop Seeding on Match Rows
    if (!isLiveView && !t?.isLocked) {
      const rows = node.querySelectorAll('.match-team-row');
      rows.forEach(row => {
        const slot = row.dataset.slot;
        const isFeeder = !!(slot === 'p1' ? match.feederTopId : match.feederBotId);
        const p = slot === 'p1' ? p1 : p2;
        const canDrag = !match.isBronzeMatch && !isFeeder && !!(p && p.id && !p.isPlaceholder && !p.isUnseeded && p.name && p.name.trim());

        if (canDrag) {
          row.setAttribute('draggable', 'true');
          row.addEventListener('dragstart', handleMatchSlotDragStart);
          row.addEventListener('dragend', handleMatchSlotDragEnd);
        } else {
          row.removeAttribute('draggable');
          row.setAttribute('draggable', 'false');
        }

        if (!match.isBronzeMatch) {
          row.addEventListener('dragover', handleSlotDragOver);
          row.addEventListener('dragleave', handleSlotDragLeave);
          row.addEventListener('drop', handleSlotDrop);
        }
      });
    }

    // Click to open Match Controller Modal
    if (!isLiveView) {
      let downPos = null;
      node.addEventListener('mousedown', (e) => {
        downPos = { x: e.clientX, y: e.clientY };
      });
      node.addEventListener('click', (e) => {
        if (e.target.closest('.btn-slot-lock, .btn-slot-edit, .slot-inline-edit')) return;
        if (state.isDraggingSlot) return;
        if (downPos) {
          const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
          if (dist > 5) return;
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
    state.isDraggingSlot = false;
    state.isDraggingCanvas = false;
  }

  function handleMatchSlotDragStart(e) {
    state.isDraggingCanvas = false;
    state.isDraggingSlot = true;
    const roundIdx = parseInt(this.dataset.round, 10);
    const matchIdx = parseInt(this.dataset.match, 10);
    const slot = this.dataset.slot;
    const t = state.currentTournament;
    const match = t?.rounds?.[roundIdx]?.matches?.[matchIdx];
    const isFeeder = !!(slot === 'p1' ? match?.feederTopId : match?.feederBotId);
    const p = slot === 'p1' ? match?.p1 : match?.p2;

    if (isFeeder || !p || !p.id || p.isPlaceholder || p.isUnseeded || !p.name || !p.name.trim()) {
      state.isDraggingSlot = false;
      e.preventDefault();
      return false;
    }

    state.draggedSlot = {
      round: roundIdx,
      match: matchIdx,
      slot: slot
    };
    state.draggedParticipant = null;
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', 'match-slot');
  }

  function handleMatchSlotDragEnd() {
    state.isDraggingSlot = false;
    state.isDraggingCanvas = false;
    this.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  }

  function handleSlotDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
  }

  function handleSlotDragLeave() {
    this.classList.remove('drag-over');
  }

  function findMatchById(t, matchId) {
    if (!t || !t.rounds || !matchId) return null;
    for (const r of t.rounds) {
      if (r.matches) {
        const found = r.matches.find(m => m.id === matchId);
        if (found) return found;
      }
    }
    return null;
  }

  function promptFeederAdvancement(t, srcMatch, srcRound, srcMatchIdx, srcSlot, targetMatch, targetRound, targetMatchIdx, targetSlot, draggedP) {
    const isZh = state.lang === 'zh';
    const srcRoundTitle = t.rounds[srcRound]?.title || `Round ${srcRound + 1}`;
    const targetRoundTitle = t.rounds[targetRound]?.title || `Round ${targetRound + 1}`;
    const participantName = draggedP.name || 'Peserta';

    const confirmTitle = isZh ? '确认选手直接晋级？' : 'Konfirmasi Loloskan Peserta Play-In?';
    const confirmMsg = isZh
      ? `您正在将入围赛（${srcRoundTitle}）选手 <b>${escapeHTML(participantName)}</b> 直接移入下一轮（${targetRoundTitle}）。<br><br>
         • 选手 <b>${escapeHTML(participantName)}</b> 将<b>继续保留在原入围赛</b>槽位中，不会变成空位。<br>
         • 原入围赛状态将自动设为<b>已结束</b>，并判定 <b>${escapeHTML(participantName)}</b> 获胜晋级。<br><br>
         是否确认直接晋级该选手？`
      : `Anda sedang memindahkan peserta <b>${escapeHTML(participantName)}</b> dari babak play-in (${srcRoundTitle}) langsung ke babak berikutnya (${targetRoundTitle}).<br><br>
         • Nama <b>${escapeHTML(participantName)}</b> akan <b>tetap tercatat</b> di babak play-in (tidak menjadi slot kosong).<br>
         • Pertandingan play-in otomatis berstatus <b>Selesai</b> dengan <b>${escapeHTML(participantName)} Menang</b>.<br><br>
         Apakah Anda yakin ingin meloloskan peserta ini?`;

    openConfirmModal(
      confirmTitle,
      confirmMsg,
      () => {
        // Keep draggedP in srcMatch!
        srcMatch[srcSlot] = { ...draggedP, isPlaceholder: false, isUnseeded: false };
        srcMatch.winnerId = draggedP.id;
        srcMatch.status = 'completed';
        if (srcSlot === 'p1') {
          srcMatch.score1 = (srcMatch.score1 !== undefined && srcMatch.score1 !== '') ? srcMatch.score1 : 1;
          srcMatch.score2 = (srcMatch.score2 !== undefined && srcMatch.score2 !== '') ? srcMatch.score2 : 0;
        } else {
          srcMatch.score2 = (srcMatch.score2 !== undefined && srcMatch.score2 !== '') ? srcMatch.score2 : 1;
          srcMatch.score1 = (srcMatch.score1 !== undefined && srcMatch.score1 !== '') ? srcMatch.score1 : 0;
        }

        // Put in target feeder slot
        targetMatch[targetSlot] = {
          id: draggedP.id,
          name: draggedP.name,
          seed: draggedP.seed,
          partners: draggedP.partners,
          partner: draggedP.partner,
          isPlaceholder: false,
          isUnseeded: false
        };

        sanitizeBracketDuplicates(t);
        addTournamentLog(t, 'match', `Peserta "${draggedP.name}" diloloskan langsung dari ${srcRoundTitle} (M${srcMatchIdx + 1}) ke ${targetRoundTitle} (M${targetMatch + 1}) - Menang Play-In.`);
        showToast(isZh ? `选手 ${draggedP.name} 已获胜并晋级！` : `Peserta ${draggedP.name} berhasil diloloskan sebagai pemenang play-in!`, 'success');
        saveTournamentState(true);
        renderBracketStudio();
      }
    );
  }

  function reconcileFeederAdvancements(t) {
    if (!t || !t.rounds) return false;
    let changed = false;

    (t.rounds || []).forEach(r => {
      (r.matches || []).forEach(m => {
        // 1. Feeder for slot p1
        if (m.feederTopId && m.p1 && m.p1.id && !m.p1.isPlaceholder && !m.p1.isUnseeded) {
          const feeder = findMatchById(t, m.feederTopId);
          if (feeder) {
            const advP = m.p1;
            let feederUpdated = false;

            if (feeder.p1?.id !== advP.id && feeder.p2?.id !== advP.id) {
              if (!feeder.p1 || !feeder.p1.id || feeder.p1.isPlaceholder || feeder.p1.isUnseeded) {
                feeder.p1 = { ...advP, isPlaceholder: false, isUnseeded: false };
                feederUpdated = true;
              } else if (!feeder.p2 || !feeder.p2.id || feeder.p2.isPlaceholder || feeder.p2.isUnseeded) {
                feeder.p2 = { ...advP, isPlaceholder: false, isUnseeded: false };
                feederUpdated = true;
              }
            }

            if (feeder.winnerId !== advP.id) {
              feeder.winnerId = advP.id;
              feeder.status = 'completed';
              if (feeder.p1?.id === advP.id) {
                feeder.score1 = (feeder.score1 !== undefined && feeder.score1 !== '') ? feeder.score1 : 1;
                feeder.score2 = (feeder.score2 !== undefined && feeder.score2 !== '') ? feeder.score2 : 0;
              } else if (feeder.p2?.id === advP.id) {
                feeder.score2 = (feeder.score2 !== undefined && feeder.score2 !== '') ? feeder.score2 : 1;
                feeder.score1 = (feeder.score1 !== undefined && feeder.score1 !== '') ? feeder.score1 : 0;
              }
              feederUpdated = true;
              addTournamentLog(t, 'match', `Sinkronisasi Play-In: Peserta "${advP.name}" tercatat menang di pertandingan (${feeder.id.toUpperCase()}) dan lolos ke babak berikutnya.`);
            }

            if (feederUpdated) changed = true;
          }
        }

        // 2. Feeder for slot p2
        if (m.feederBotId && m.p2 && m.p2.id && !m.p2.isPlaceholder && !m.p2.isUnseeded) {
          const feeder = findMatchById(t, m.feederBotId);
          if (feeder) {
            const advP = m.p2;
            let feederUpdated = false;

            if (feeder.p1?.id !== advP.id && feeder.p2?.id !== advP.id) {
              if (!feeder.p1 || !feeder.p1.id || feeder.p1.isPlaceholder || feeder.p1.isUnseeded) {
                feeder.p1 = { ...advP, isPlaceholder: false, isUnseeded: false };
                feederUpdated = true;
              } else if (!feeder.p2 || !feeder.p2.id || feeder.p2.isPlaceholder || feeder.p2.isUnseeded) {
                feeder.p2 = { ...advP, isPlaceholder: false, isUnseeded: false };
                feederUpdated = true;
              }
            }

            if (feeder.winnerId !== advP.id) {
              feeder.winnerId = advP.id;
              feeder.status = 'completed';
              if (feeder.p1?.id === advP.id) {
                feeder.score1 = (feeder.score1 !== undefined && feeder.score1 !== '') ? feeder.score1 : 1;
                feeder.score2 = (feeder.score2 !== undefined && feeder.score2 !== '') ? feeder.score2 : 0;
              } else if (feeder.p2?.id === advP.id) {
                feeder.score2 = (feeder.score2 !== undefined && feeder.score2 !== '') ? feeder.score2 : 1;
                feeder.score1 = (feeder.score1 !== undefined && feeder.score1 !== '') ? feeder.score1 : 0;
              }
              feederUpdated = true;
              addTournamentLog(t, 'match', `Sinkronisasi Play-In: Peserta "${advP.name}" tercatat menang di pertandingan (${feeder.id.toUpperCase()}) dan lolos ke babak berikutnya.`);
            }

            if (feederUpdated) changed = true;
          }
        }
      });
    });

    return changed;
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

      const isTargetSlotFeeder = !!(targetSlot === 'p1' ? match.feederTopId : match.feederBotId);
      const targetFeederId = targetSlot === 'p1' ? match.feederTopId : match.feederBotId;

      if (isTargetSlotFeeder) {
        const feeder = findMatchById(t, targetFeederId);
        if (feeder) {
          const isZh = state.lang === 'zh';
          const confirmTitle = isZh ? '确认选手晋级（跳过入围赛）？' : 'Konfirmasi Loloskan Peserta Play-In?';
          const confirmMsg = isZh
            ? `您正在将选手 <b>${escapeHTML(participant.name.trim())}</b> 直接分配至晋级槽位。<br><br>• 选手将同时记录在原入围赛中。<br>• 原入围赛将判定该选手获胜晋级。<br><br>是否确认？`
            : `Anda sedang menempatkan peserta <b>${escapeHTML(participant.name.trim())}</b> ke slot lanjutan play-in.<br><br>• Peserta akan tetap tercatat di babak play-in (${feeder.id.toUpperCase()}).<br>• Pertandingan play-in otomatis berstatus Selesai dengan peserta ini Menang.<br><br>Apakah Anda yakin?`;

          openConfirmModal(confirmTitle, confirmMsg, () => {
            if (!feeder.p1 || !feeder.p1.id || feeder.p1.isPlaceholder || feeder.p1.isUnseeded) {
              feeder.p1 = { id: participant.id, name: participant.name.trim(), seed: state.draggedParticipant.index + 1, isPlaceholder: false, isUnseeded: false };
            } else if (!feeder.p2 || !feeder.p2.id || feeder.p2.isPlaceholder || feeder.p2.isUnseeded) {
              feeder.p2 = { id: participant.id, name: participant.name.trim(), seed: state.draggedParticipant.index + 1, isPlaceholder: false, isUnseeded: false };
            } else {
              feeder.p1 = { id: participant.id, name: participant.name.trim(), seed: state.draggedParticipant.index + 1, isPlaceholder: false, isUnseeded: false };
            }
            feeder.winnerId = participant.id;
            feeder.status = 'completed';
            if (feeder.p1?.id === participant.id) {
              feeder.score1 = (feeder.score1 !== undefined && feeder.score1 !== '') ? feeder.score1 : 1;
              feeder.score2 = (feeder.score2 !== undefined && feeder.score2 !== '') ? feeder.score2 : 0;
            } else {
              feeder.score2 = (feeder.score2 !== undefined && feeder.score2 !== '') ? feeder.score2 : 1;
              feeder.score1 = (feeder.score1 !== undefined && feeder.score1 !== '') ? feeder.score1 : 0;
            }

            match[targetSlot] = {
              id: participant.id,
              name: participant.name.trim(),
              seed: state.draggedParticipant.index + 1,
              isPlaceholder: false,
              isUnseeded: false
            };

            sanitizeBracketDuplicates(t);
            addTournamentLog(t, 'match', `Peserta "${participant.name.trim()}" ditempatkan dan diloloskan dari play-in (${feeder.id.toUpperCase()}).`);
            saveTournamentState(true);
            renderParticipantsDrawer();
            renderBracketStudio();
          });
          return;
        }
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
      sanitizeBracketDuplicates(t);
      addTournamentLog(t, 'slot', `R${targetRound + 1} M${targetMatch + 1} (${targetSlot.toUpperCase()}): Peserta "${participant.name.trim()}" ditempatkan.`);
      showToast(`Assigned ${participant.name.trim()} to Round ${targetRound + 1} Match ${targetMatch + 1}!`, 'success');
      saveTournamentState(true);
      renderParticipantsDrawer();
      renderBracketStudio();
    } else if (state.draggedSlot) {
      const srcRound = state.draggedSlot.round;
      const srcMatchIdx = state.draggedSlot.match;
      const srcSlot = state.draggedSlot.slot;
      const srcMatch = t.rounds[srcRound]?.matches?.[srcMatchIdx];
      if (!srcMatch) return;
      const draggedP = srcMatch[srcSlot];
      if (!draggedP || !draggedP.id || draggedP.isPlaceholder || draggedP.isUnseeded) return;

      const isTargetSlotFeeder = !!(targetSlot === 'p1' ? match.feederTopId : match.feederBotId);
      const targetFeederId = targetSlot === 'p1' ? match.feederTopId : match.feederBotId;

      // Check if target match or slot is fed by srcMatch
      const isDirectFeeder = isTargetSlotFeeder && (targetFeederId === srcMatch.id);
      const matchFedBySrc = match.feederTopId === srcMatch.id || match.feederBotId === srcMatch.id;

      if (isDirectFeeder || matchFedBySrc) {
        const correctSlot = match.feederTopId === srcMatch.id ? 'p1' : 'p2';
        promptFeederAdvancement(t, srcMatch, srcRound, srcMatchIdx, srcSlot, match, targetRound, targetMatch, correctSlot, draggedP);
        return;
      }

      // If user dropped into a feeder slot fed by another match
      if (isTargetSlotFeeder && targetFeederId !== srcMatch.id) {
        const isZh = state.lang === 'zh';
        showToast(isZh ? '此位置是其他轮次比赛的胜者通道，无法直接放入！' : 'Slot ini merupakan jalur pemenang untuk pertandingan lain!', 'warning');
        return;
      }

      // Swap slots between two matches
      const temp = srcMatch[srcSlot];
      srcMatch[srcSlot] = match[targetSlot];
      match[targetSlot] = temp;

      sanitizeBracketDuplicates(t);
      const name1 = match[targetSlot]?.name || 'Slot';
      const name2 = srcMatch[srcSlot]?.name || 'Slot';
      addTournamentLog(t, 'slot', `Tukar slot: "${name1}" (R${targetRound + 1} M${targetMatch + 1}) <-> "${name2}" (R${state.draggedSlot.round + 1} M${state.draggedSlot.match + 1}).`);

      showToast('Swapped participant bracket seeds!', 'success');
      saveTournamentState(true);
      renderBracketStudio();
    }
  }

  function sanitizeBracketDuplicates(t) {
    if (!t || !t.rounds) return;
    const seenIds = new Set();
    (t.rounds || []).forEach(r => {
      (r.matches || []).forEach(m => {
        if (m.isBronzeMatch) return;
        if (m.p1 && m.p1.id && !m.p1.isPlaceholder && !m.p1.isUnseeded && !m.feederTopId) {
          if (seenIds.has(m.p1.id)) {
            m.p1 = makeEmpty(m.p1.seed || '');
          } else {
            seenIds.add(m.p1.id);
          }
        }
        if (m.p2 && m.p2.id && !m.p2.isPlaceholder && !m.p2.isUnseeded && !m.feederBotId) {
          if (seenIds.has(m.p2.id)) {
            m.p2 = makeEmpty(m.p2.seed || '');
          } else {
            seenIds.add(m.p2.id);
          }
        }
      });
    });
  }

  // ==================== MATCH CONTROLLER (SCORE & DIRECT WIN) ====================
  function openMatchControlModal(match, rIdx, mIdx) {
    state.selectedMatchForEdit = { match, rIdx, mIdx };
    const isZh = state.lang === 'zh';

    if (match.isBronzeMatch) {
      el.modalMatchTitle.textContent = isZh ? '季军争夺战' : 'Perebutan Juara 3 (Bronze Match)';
      el.modalMatchRound.textContent = '🥉 3rd Place Match';
    } else {
      el.modalMatchTitle.textContent = isZh ? `第 ${mIdx + 1} 场管理` : `Match ${mIdx + 1} Management`;
      el.modalMatchRound.textContent = state.currentTournament.rounds[rIdx]?.title || `Round ${rIdx + 1}`;
    }

    // Set Status active button
    const currentStatus = match.status || 'scheduled';
    el.modalMatchControl.querySelectorAll('.status-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === currentStatus);
    });

    const p1 = match.p1 || { name: 'TBD', seed: '' };
    const p2 = match.p2 || { name: 'TBD', seed: '' };

    const isP1Waiting = !p1 || !p1.id || p1.isPlaceholder || p1.isUnseeded || (typeof p1.name === 'string' && p1.name.toLowerCase().startsWith('winner r'));
    const isP2Waiting = !p2 || !p2.id || p2.isPlaceholder || p2.isUnseeded || (typeof p2.name === 'string' && p2.name.toLowerCase().startsWith('winner r'));
    const isMatchWaitingOpponent = isP1Waiting || isP2Waiting;

    // Configure P1 Card
    if (isP1Waiting) {
      el.cardMatchP1?.classList.add('card-waiting-feeder');
      el.modalP1Seed.textContent = '-';
      el.modalP1Name.textContent = isZh ? '待定 (等待胜者)' : 'TBD (Menunggu Pemenang)';
      el.modalP1Name.title = isZh ? '等待上一轮获胜选手' : 'Menunggu pemenang pertandingan babak sebelumnya';
      el.modalP1Score.value = 0;
      el.modalP1Score.disabled = true;
      el.btnDirectWinP1.style.display = 'none';
      el.btnDirectWinP1.disabled = true;
    } else {
      el.cardMatchP1?.classList.remove('card-waiting-feeder');
      el.modalP1Seed.textContent = p1.seed ? `#${p1.seed}` : '-';
      el.modalP1Name.textContent = p1.name;
      el.modalP1Name.title = p1.name;
      el.modalP1Score.value = match.score1 !== undefined && match.score1 !== '' ? match.score1 : 0;
      el.modalP1Score.disabled = isMatchWaitingOpponent;
      // Cannot direct win against a placeholder / TBD opponent!
      if (isMatchWaitingOpponent) {
        el.btnDirectWinP1.style.display = 'none';
        el.btnDirectWinP1.disabled = true;
      } else {
        el.btnDirectWinP1.style.display = '';
        el.btnDirectWinP1.disabled = false;
      }
    }

    // Configure P2 Card
    if (isP2Waiting) {
      el.cardMatchP2?.classList.add('card-waiting-feeder');
      el.modalP2Seed.textContent = '-';
      el.modalP2Name.textContent = isZh ? '待定 (等待胜者)' : 'TBD (Menunggu Pemenang)';
      el.modalP2Name.title = isZh ? '等待上一轮获胜选手' : 'Menunggu pemenang pertandingan babak sebelumnya';
      el.modalP2Score.value = 0;
      el.modalP2Score.disabled = true;
      el.btnDirectWinP2.style.display = 'none';
      el.btnDirectWinP2.disabled = true;
    } else {
      el.cardMatchP2?.classList.remove('card-waiting-feeder');
      el.modalP2Seed.textContent = p2.seed ? `#${p2.seed}` : '-';
      el.modalP2Name.textContent = p2.name;
      el.modalP2Name.title = p2.name;
      el.modalP2Score.value = match.score2 !== undefined && match.score2 !== '' ? match.score2 : 0;
      el.modalP2Score.disabled = isMatchWaitingOpponent;
      // Cannot direct win against a placeholder / TBD opponent!
      if (isMatchWaitingOpponent) {
        el.btnDirectWinP2.style.display = 'none';
        el.btnDirectWinP2.disabled = true;
      } else {
        el.btnDirectWinP2.style.display = '';
        el.btnDirectWinP2.disabled = false;
      }
    }

    // Notice banner & Save Scores Button State
    if (el.modalMatchWaitingNotice) {
      if (isMatchWaitingOpponent) {
        el.modalMatchWaitingNotice.classList.remove('hidden');
        if (el.modalMatchWaitingText) {
          el.modalMatchWaitingText.textContent = isZh
            ? '该比赛仍在等待上一轮决出胜者。双方选手就位后，方可录入比分或判定获胜。'
            : 'Pertandingan ini masih menunggu pemenang dari babak sebelumnya. Skor dan pemenang baru dapat ditentukan setelah lawan lolos.';
        }
        if (el.btnSaveMatchScore) {
          el.btnSaveMatchScore.disabled = true;
          el.btnSaveMatchScore.style.opacity = '0.4';
          el.btnSaveMatchScore.style.cursor = 'not-allowed';
          el.btnSaveMatchScore.title = isZh ? '等待对手决出后方可保存比分' : 'Menunggu lawan lolos sebelum dapat menyimpan skor';
        }
      } else {
        el.modalMatchWaitingNotice.classList.add('hidden');
        if (el.btnSaveMatchScore) {
          el.btnSaveMatchScore.disabled = false;
          el.btnSaveMatchScore.style.opacity = '1';
          el.btnSaveMatchScore.style.cursor = 'pointer';
          el.btnSaveMatchScore.title = '';
        }
      }
    }

    if (el.modalMatchNote) {
      el.modalMatchNote.value = match.note || '';
    }

    openModal(el.modalMatchControl);
  }

  function handleSaveMatchScores() {
    if (!state.selectedMatchForEdit) return;
    const { match, rIdx, mIdx } = state.selectedMatchForEdit;
    const t = state.currentTournament;

    const p1 = match.p1;
    const p2 = match.p2;
    const isP1Waiting = !p1 || !p1.id || p1.isPlaceholder || p1.isUnseeded || (typeof p1.name === 'string' && p1.name.toLowerCase().startsWith('winner r'));
    const isP2Waiting = !p2 || !p2.id || p2.isPlaceholder || p2.isUnseeded || (typeof p2.name === 'string' && p2.name.toLowerCase().startsWith('winner r'));
    if (isP1Waiting || isP2Waiting) {
      showToast(state.lang === 'zh' ? '该比赛仍在等待上一轮对手，无法保存比分！' : 'Tidak dapat menyimpan skor karena pertandingan masih menunggu lawan (TBD)!', 'warning');
      return;
    }

    const s1 = parseInt(el.modalP1Score.value, 10) || 0;
    const s2 = parseInt(el.modalP2Score.value, 10) || 0;

    match.score1 = s1;
    match.score2 = s2;

    const activeStatusBtn = el.modalMatchControl.querySelector('.status-btn.active');
    match.status = activeStatusBtn ? activeStatusBtn.dataset.status : 'completed';

    if (el.modalMatchNote) {
      match.note = el.modalMatchNote.value.trim();
    }

    if (s1 > s2) {
      advanceWinner(match, match.p1);
    } else if (s2 > s1) {
      advanceWinner(match, match.p2);
    }

    if (t) {
      addTournamentLog(t, 'score', `Match R${match.round} M${match.matchIndex + 1}: Skor (${s1} - ${s2}), status ${match.status}${match.note ? `, Catatan: "${match.note}"` : ''}`, {
        matchId: match.id,
        score1: s1,
        score2: s2,
        note: match.note,
        status: match.status
      });
    }

    closeModal(el.modalMatchControl);
    saveTournamentState(true);
    renderBracketStudio();
    showToast('Match scores saved successfully!', 'success');
  }

  function handleQuickStatusSave() {
    if (!state.selectedMatchForEdit) return;
    const { match } = state.selectedMatchForEdit;
    const t = state.currentTournament;
    const activeStatusBtn = el.modalMatchControl.querySelector('.status-btn.active');
    if (!activeStatusBtn) return;
    const nextStatus = activeStatusBtn.dataset.status;
    match.status = nextStatus;

    if (el.modalMatchNote) {
      match.note = el.modalMatchNote.value.trim();
    }

    closeModal(el.modalMatchControl);
    saveTournamentState(true);
    renderBracketStudio();

    let statusLabel = 'Belum Mulai';
    if (nextStatus === 'next_up') statusLabel = state.lang === 'zh' ? '即将开赛' : 'Akan Bermain';
    else if (nextStatus === 'in_progress') statusLabel = state.lang === 'zh' ? '进行中' : 'Sedang Main';
    else if (nextStatus === 'completed') statusLabel = state.lang === 'zh' ? '已结束' : 'Selesai';

    if (t) {
      addTournamentLog(t, 'status', `Match R${match.round} M${match.matchIndex + 1}: Status diubah ke ${statusLabel}${match.note ? `, Catatan: "${match.note}"` : ''}`, {
        matchId: match.id,
        status: nextStatus,
        note: match.note
      });
    }

    showToast(state.lang === 'zh' ? `比赛状态已更新: ${statusLabel}` : `Status pertandingan diubah ke: ${statusLabel}`, 'success');
  }

  function handleDirectWin(playerSlot) {
    if (!state.selectedMatchForEdit) return;
    const { match, rIdx, mIdx } = state.selectedMatchForEdit;
    const winner = playerSlot === 'p1' ? match.p1 : match.p2;
    const opponent = playerSlot === 'p1' ? match.p2 : match.p1;

    if (!winner || winner.isPlaceholder || !winner.id || winner.isUnseeded) {
      showToast('Cannot declare win for placeholder competitor!', 'error');
      return;
    }

    if (!opponent || opponent.isPlaceholder || !opponent.id || opponent.isUnseeded || (typeof opponent.name === 'string' && opponent.name.toLowerCase().startsWith('winner r'))) {
      showToast(state.lang === 'zh' ? '对手尚未决出（TBD），无法判定直接获胜！' : 'Tidak dapat menang langsung karena lawan belum ditentukan (masih menunggu hasil babak sebelumnya)!', 'warning');
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
        if (el.modalMatchNote) {
          match.note = el.modalMatchNote.value.trim();
        }
        advanceWinner(match, winner);
        closeModal(el.modalMatchControl);
        saveTournamentState(true);
        renderBracketStudio();
        showToast(`🏆 ${winner.name} declared winner and advanced!`, 'success');
      }
    );
  }

  function advanceWinner(match, winner) {
    const t = state.currentTournament;
    if (!t) return;

    match.winnerId = winner.id;
    match.status = 'completed';

    addTournamentLog(t, 'winner', `🏆 Match R${match.round} M${match.matchIndex + 1}: ${winner.name} menang dan melaju ke babak berikutnya!`, {
      matchId: match.id,
      winnerId: winner.id,
      winnerName: winner.name,
      score1: match.score1,
      score2: match.score2
    });

    if (match.isBronzeMatch) {
      showToast(`🥉 JUARA 3: ${winner.name}!`, 'success');
      return;
    }

    const currentRoundIdx = match.round - 1;

    // Check if this was a semifinal match and 3rd place match is enabled
    const isSemifinal = currentRoundIdx === (t.rounds || []).length - 2;
    if (isSemifinal && t.settings?.thirdPlaceMatch) {
      const bronzeMatch = getOrInitThirdPlaceMatch(t);
      if (bronzeMatch) {
        const loser = match.p1?.id === winner.id ? match.p2 : match.p1;
        const targetSlot = match.matchIndex === 0 ? 'p1' : 'p2';
        if (loser && !loser.isPlaceholder) {
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

    // Exact feeder-based advancement: Find downstream match by feederTopId / feederBotId
    let targetMatch = null;
    let targetSlot = null;

    for (let r = currentRoundIdx + 1; r < (t.rounds || []).length; r++) {
      const roundMatches = t.rounds[r].matches || [];
      for (const m of roundMatches) {
        if (m.feederTopId === match.id) {
          targetMatch = m;
          targetSlot = 'p1';
          break;
        }
        if (m.feederBotId === match.id) {
          targetMatch = m;
          targetSlot = 'p2';
          break;
        }
      }
      if (targetMatch) break;
    }

    // Fallback for uniform power-of-2 only if feeder IDs were absent
    const nextRound = t.rounds[currentRoundIdx + 1];
    if (!targetMatch && nextRound && nextRound.matches) {
      const targetMatchIdx = Math.floor(match.matchIndex / 2);
      if (nextRound.matches[targetMatchIdx]) {
        targetMatch = nextRound.matches[targetMatchIdx];
        targetSlot = match.matchIndex % 2 === 0 ? 'p1' : 'p2';
      }
    }

    if (targetMatch && targetSlot) {
      targetMatch[targetSlot] = {
        id: winner.id,
        name: winner.name,
        seed: winner.seed,
        partners: winner.partners,
        partner: winner.partner,
        isPlaceholder: false
      };
    } else if (!nextRound) {
      // Tournament finished! Champion declared!
      t.status = 'completed';
      showToast(`🎉 TOURNAMENT COMPLETE! CHAMPION: ${winner.name}!`, 'success');
      addTournamentLog(t, 'winner', `🏆 TURNAMEN SELESAI! JUARA 1: ${winner.name}!`, { winner: winner.name });
    }
  }

  function clearDownstreamWinner(t, matchId) {
    if (!t || !t.rounds) return;
    (t.rounds || []).forEach(r => {
      (r.matches || []).forEach(m => {
        let cleared = false;
        if (m.feederTopId === matchId) {
          m.p1 = { name: `Winner R${r.roundNumber - 1} M${m.matchIndex + 1}`, isPlaceholder: true };
          cleared = true;
        }
        if (m.feederBotId === matchId) {
          m.p2 = { name: `Winner R${r.roundNumber - 1} M${m.matchIndex + 1}`, isPlaceholder: true };
          cleared = true;
        }
        if (cleared) {
          m.score1 = '';
          m.score2 = '';
          m.winnerId = null;
          m.status = 'scheduled';
          clearDownstreamWinner(t, m.id);
        }
      });
    });
  }

  function handleResetMatchResult() {
    if (!state.selectedMatchForEdit) return;
    const { match } = state.selectedMatchForEdit;
    const t = state.currentTournament;
    match.score1 = '';
    match.score2 = '';
    match.winnerId = null;
    match.status = 'scheduled';
    if (t) {
      clearDownstreamWinner(t, match.id);
      addTournamentLog(t, 'reset', `Match R${match.round} M${match.matchIndex + 1}: Hasil pertandingan direset ke dijadwalkan.`, { matchId: match.id });
    }
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
          reconcileFeederAdvancements(t);
          t.isLocked = true;
          t.status = 'in_progress';
          addTournamentLog(t, 'lock', '🔒 Bagan dikunci (Lock Bracket). Pertandingan dan pencatatan skor diaktifkan.');
          saveTournamentState(true);
          setupStudioUI();
          renderBracketStudio();
          showToast('🔒 Bracket locked! Tournament is now In Progress.', 'success');
        }
      );
    } else {
      const isZh = state.lang === 'zh';
      openConfirmModal(
        isZh ? '解锁对阵图（手动调整模式）？' : 'Buka Kunci Bracket (Pengaturan Manual)?',
        isZh
          ? '解锁后将允许您<b>手动拖拽调整/对调选手位置</b>。现有的比分、已晋级选手及赛程将<b>完整保留，不会被清空重置</b>，但自动重新抽签将被禁用以保护赛程。确定要解锁吗？'
          : 'Membuka kunci bracket memungkinkan Anda <b>menggeser atau menukar posisi peserta secara manual</b>. Bagan, skor pertandingan, dan pemenang yang ada <b>tetap tersimpan dan TIDAK direset</b>. Pengacakan otomatis dinonaktifkan untuk melindungi integritas bagan. Yakin ingin membuka kunci?',
        () => {
          t.isLocked = false;
          t.status = 'in_progress';
          addTournamentLog(t, 'unlock', '🔓 Bagan dibuka kunci untuk penyesuaian susunan manual (skor dan bagan dipertahankan).');
          saveTournamentState(true);
          setupStudioUI();
          renderBracketStudio();
          showToast(isZh ? '🔓 对阵图已解锁，可手动拖拽调整选手，赛程与比分已完整保留。' : '🔓 Bracket dibuka untuk pengaturan manual. Bagan dan skor tetap dipertahankan.', 'info');
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
    let t = (state.tournaments && state.tournaments.find(item => item.id === tournamentId)) || (state.currentTournament?.id === tournamentId ? state.currentTournament : null);

    const syncPresetInputs = (tourn) => {
      if (!tourn) return;
      if (tourn.registrationDeadline) {
        const rem = new Date(tourn.registrationDeadline).getTime() - Date.now();
        if (rem > 0) {
          const mins = Math.round(rem / 60000);
          if ([5, 15, 30, 60, 120].includes(mins)) {
            if (el.qrDeadlinePreset) el.qrDeadlinePreset.value = String(mins);
            if (el.qrDeadlineCustom) el.qrDeadlineCustom.classList.add('hidden');
          } else {
            if (el.qrDeadlinePreset) el.qrDeadlinePreset.value = 'custom';
            if (el.qrDeadlineCustom) {
              el.qrDeadlineCustom.classList.remove('hidden');
              const d = new Date(tourn.registrationDeadline);
              const pad = n => String(n).padStart(2, '0');
              el.qrDeadlineCustom.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            }
          }
        } else {
          if (el.qrDeadlinePreset) el.qrDeadlinePreset.value = 'none';
          if (el.qrDeadlineCustom) el.qrDeadlineCustom.classList.add('hidden');
        }
      } else {
        if (el.qrDeadlinePreset) el.qrDeadlinePreset.value = 'none';
        if (el.qrDeadlineCustom) el.qrDeadlineCustom.classList.add('hidden');
      }
    };

    if (t) {
      syncPresetInputs(t);
      refreshQrModalStatusUI(t);
    }
    await refreshQrDisplay();

    // Background sync to ensure real-time status across tournaments
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      const data = await res.json();
      if (data.success && data.tournament) {
        t = data.tournament;
        if (state.tournaments) {
          const idx = state.tournaments.findIndex(item => item.id === tournamentId);
          if (idx !== -1) state.tournaments[idx] = t;
        }
        if (state.currentTournament && state.currentTournament.id === tournamentId) {
          state.currentTournament = t;
        }
        syncPresetInputs(t);
        refreshQrModalStatusUI(t);
      }
    } catch (e) {
      console.warn('Could not sync latest tournament for QR modal:', e);
    }

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

  // ==================== PARTICIPANT REPORTS VIEW (NO BRACKET) ====================
  function openStudioReportView(tournamentId) {
    if (tournamentId && (!state.currentTournament || state.currentTournament.id !== tournamentId)) {
      loadTournament(tournamentId, () => {
        showStudioReportViewUI();
      });
      return;
    }
    showStudioReportViewUI();
  }

  function showStudioReportViewUI() {
    if (el.canvasContainer) el.canvasContainer.classList.add('hidden');
    if (el.studioDrawer) el.studioDrawer.classList.add('collapsed');
    if (el.studioReportView) el.studioReportView.classList.remove('hidden');

    document.querySelectorAll('.rail-tab-btn').forEach(b => b.classList.remove('active'));
    if (el.railBtnReports) el.railBtnReports.classList.add('active');

    renderParticipantReports();
  }

  function closeStudioReportView() {
    if (el.studioReportView) el.studioReportView.classList.add('hidden');
    if (el.canvasContainer) el.canvasContainer.classList.remove('hidden');
    if (el.studioDrawer) el.studioDrawer.classList.remove('collapsed');

    document.querySelectorAll('.rail-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.panel === 'participants');
    });
    document.querySelectorAll('.drawer-panel').forEach(p => {
      p.classList.toggle('active', p.id === 'panel-participants');
    });
  }

  function renderParticipantReports() {
    const t = state.currentTournament;
    if (!t) return;

    const isZh = state.lang === 'zh';
    const participants = t.participants || [];

    if (el.reportTournamentSubtitle) {
      el.reportTournamentSubtitle.textContent = `${t.name} • ${t.game || 'Esports'} • ${isZh ? '最大' : 'Maks'} ${t.maxParticipants || 16} ${isZh ? '支队伍/选手' : 'Tim/Peserta'}`;
    }

    // Determine assigned IDs
    const assignedIds = new Set();
    (t.rounds || []).forEach(r => {
      (r.matches || []).forEach(m => {
        if (m.p1 && m.p1.id && !m.p1.isPlaceholder && !m.p1.isUnseeded && m.p1.name && m.p1.name.trim()) assignedIds.add(m.p1.id);
        if (m.p2 && m.p2.id && !m.p2.isPlaceholder && !m.p2.isUnseeded && m.p2.name && m.p2.name.trim()) assignedIds.add(m.p2.id);
      });
    });

    // Real registered participants (have a name or playerName or registeredAt)
    const registeredList = participants.filter(p => {
      const hasName = !!((p.name && p.name.trim()) || (p.playerName && p.playerName.trim()) || (p.teamName && p.teamName.trim()));
      return hasName;
    });

    const totalTeams = registeredList.length;
    let totalAthletes = 0;
    let seededCount = 0;

    registeredList.forEach(p => {
      const partnersList = Array.isArray(p.partners) && p.partners.length > 0
        ? p.partners
        : (p.partner && p.partner.name ? [p.partner] : []);
      totalAthletes += 1 + partnersList.length;
      if (assignedIds.has(p.id)) seededCount++;
    });

    const unseededCount = Math.max(0, totalTeams - seededCount);

    if (el.reportStatTeams) el.reportStatTeams.textContent = totalTeams;
    if (el.reportStatAthletes) el.reportStatAthletes.textContent = totalAthletes;
    if (el.reportStatSeeded) el.reportStatSeeded.textContent = seededCount;
    if (el.reportStatUnseeded) el.reportStatUnseeded.textContent = unseededCount;

    // Filter by query and active tab
    const query = (state.reportFilter.search || '').trim().toLowerCase();
    const filterType = state.reportFilter.filter || 'all';

    const filtered = registeredList.filter((p, idx) => {
      const isSeeded = assignedIds.has(p.id);
      if (filterType === 'seeded' && !isSeeded) return false;
      if (filterType === 'unseeded' && isSeeded) return false;

      if (!query) return true;

      const nameMatch = (p.name || '').toLowerCase().includes(query);
      const playerMatch = (p.playerName || '').toLowerCase().includes(query);
      const teamMatch = (p.teamName || '').toLowerCase().includes(query);
      const deptMatch = (p.dept || '').toLowerCase().includes(query);
      const wecomMatch = (p.wecom || '').toLowerCase().includes(query);
      const partnersMatch = Array.isArray(p.partners) && p.partners.some(part => (part.name || '').toLowerCase().includes(query) || (part.dept || '').toLowerCase().includes(query));

      return nameMatch || playerMatch || teamMatch || deptMatch || wecomMatch || partnersMatch;
    });

    if (!el.reportTableBody) return;

    // Pagination calculation for Report View (default 30 per page)
    const totalItems = filtered.length;
    const rawPageSize = state.reportFilter.pageSize;
    const pageSize = rawPageSize === 'all' ? totalItems : (parseInt(rawPageSize, 10) || 30);
    const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)));

    if (state.reportFilter.page > totalPages) state.reportFilter.page = totalPages;
    if (state.reportFilter.page < 1) state.reportFilter.page = 1;
    const page = state.reportFilter.page;

    const startIndex = (page - 1) * pageSize;
    const pagedItems = rawPageSize === 'all' ? filtered : filtered.slice(startIndex, startIndex + pageSize);

    const startNum = totalItems === 0 ? 0 : startIndex + 1;
    const endNum = Math.min(startIndex + pagedItems.length, totalItems);

    const pageInfoText = isZh
      ? `显示 ${startNum}-${endNum} / 共 ${totalItems} 条`
      : `Menampilkan ${startNum}-${endNum} dari ${totalItems}`;
    const pageIndicatorText = isZh
      ? `第 ${page} / ${totalPages} 页`
      : `${page} / ${totalPages}`;

    if (el.reportPageInfo) el.reportPageInfo.textContent = pageInfoText;
    if (el.reportTopPageInfo) el.reportTopPageInfo.textContent = `${startNum}-${endNum} / ${totalItems}`;
    if (el.reportPageIndicator) el.reportPageIndicator.textContent = pageIndicatorText;

    const canPrev = page > 1;
    const canNext = page < totalPages;
    if (el.btnReportPrevPage) el.btnReportPrevPage.disabled = !canPrev;
    if (el.btnReportNextPage) el.btnReportNextPage.disabled = !canNext;
    if (el.btnReportTopPrevPage) el.btnReportTopPrevPage.disabled = !canPrev;
    if (el.btnReportTopNextPage) el.btnReportTopNextPage.disabled = !canNext;

    if (el.reportPageSizeSelect) el.reportPageSizeSelect.value = String(rawPageSize);

    if (el.reportPagination) {
      el.reportPagination.style.display = totalItems === 0 ? 'none' : 'flex';
    }
    const topPag = document.getElementById('report-top-pagination');
    if (topPag) {
      topPag.style.display = totalItems === 0 ? 'none' : 'flex';
    }

    if (filtered.length === 0) {
      el.reportTableBody.innerHTML = '';
      if (el.reportEmptyState) el.reportEmptyState.classList.remove('hidden');
      return;
    }

    if (el.reportEmptyState) el.reportEmptyState.classList.add('hidden');

    el.reportTableBody.innerHTML = pagedItems.map((p, idx) => {
      const isSeeded = assignedIds.has(p.id);
      const partnersList = Array.isArray(p.partners) && p.partners.length > 0
        ? p.partners
        : (p.partner && p.partner.name ? [p.partner] : []);

      const teamNameDisplay = p.teamName || p.name || '-';
      const captainNameDisplay = p.playerName || p.name || '-';

      let membersHtml = `<span class="text-subtle">-</span>`;
      if (partnersList.length > 0) {
        membersHtml = partnersList.map(m => `
          <span class="report-member-badge" title="${escapeHTML(m.name)} (${escapeHTML(m.dept || '-')})">
            <i class="fa-solid fa-user"></i> ${escapeHTML(m.name)} ${m.dept ? `<span style="opacity:0.65; font-size:0.7rem;">(${escapeHTML(m.dept)})</span>` : ''}
          </span>
        `).join('');
      }

      let dateFormatted = '-';
      if (p.registeredAt) {
        try {
          const d = new Date(p.registeredAt);
          dateFormatted = d.toLocaleString(isZh ? 'zh-CN' : 'id-ID', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
          dateFormatted = p.registeredAt;
        }
      }

      const statusBadge = isSeeded
        ? `<span class="badge-bracket-seeded"><i class="fa-solid fa-check"></i> ${isZh ? '已在对阵图' : 'Masuk Bagan'}</span>`
        : `<span class="badge-bracket-unseeded"><i class="fa-solid fa-hourglass-half"></i> ${isZh ? '未入对阵' : 'Belum Masuk'}</span>`;

      const rowNum = startIndex + idx + 1;
      return `
        <tr>
          <td style="color:var(--text-muted); font-weight:700;">${rowNum}</td>
          <td style="font-weight:700; color:var(--text-main);">${escapeHTML(teamNameDisplay)}</td>
          <td>${escapeHTML(captainNameDisplay)}</td>
          <td><span style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; font-size:0.78rem;">${escapeHTML(p.dept || '-')}</span></td>
          <td>${escapeHTML(p.wecom || '-')}</td>
          <td>${membersHtml}</td>
          <td style="font-size:0.78rem; color:var(--text-secondary); white-space:nowrap;">${dateFormatted}</td>
          <td>${statusBadge}</td>
          <td style="text-align:center;">
            <button type="button" class="btn btn-report-edit" data-id="${p.id}" title="${isZh ? '编辑选手资料' : 'Edit Data Peserta'}">
              <i class="fa-solid fa-pen-to-square"></i> ${isZh ? '编辑' : 'Edit'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach click listener for edit report participant
    el.reportTableBody.querySelectorAll('.btn-report-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditParticipantModal(btn.dataset.id);
      });
    });
  }

  // ==================== EDIT PARTICIPANT FROM REPORTS MODAL ====================
  let activeEditPartners = [];

  function openEditParticipantModal(participantId) {
    const t = state.currentTournament;
    if (!t) return;
    const p = (t.participants || []).find(part => part.id === participantId);
    if (!p) {
      showToast('Peserta tidak ditemukan.', 'error');
      return;
    }

    if (el.editReportParticipantId) el.editReportParticipantId.value = p.id;
    if (el.editReportName) el.editReportName.value = p.teamName || p.name || '';
    if (el.editReportPlayer) el.editReportPlayer.value = p.playerName || p.name || '';
    if (el.editReportDept) el.editReportDept.value = p.dept || '';
    if (el.editReportWecom) el.editReportWecom.value = p.wecom || '';

    // Clone partners
    const existingPartners = Array.isArray(p.partners) && p.partners.length > 0
      ? p.partners.map(m => ({ name: m.name || '', dept: m.dept || '', wecom: m.wecom || '' }))
      : (p.partner && p.partner.name ? [{ name: p.partner.name || '', dept: p.partner.dept || '', wecom: p.partner.wecom || '' }] : []);

    activeEditPartners = existingPartners;
    renderEditPartnersList();

    openModal(el.modalEditReportParticipant);
  }

  function renderEditPartnersList() {
    if (!el.editReportPartnersContainer) return;
    const isZh = state.lang === 'zh';
    if (activeEditPartners.length === 0) {
      el.editReportPartnersContainer.innerHTML = `
        <div style="font-size:0.78rem; color:var(--text-muted); font-style:italic; padding:6px 0;">
          ${isZh ? '暂无其他队友（单人比赛）。点击“+ 添加队友”添加成员。' : 'Tidak ada rekan tambahan (peserta tunggal/single). Klik "+ Tambah Rekan" untuk menambahkan.'}
        </div>
      `;
      return;
    }

    el.editReportPartnersContainer.innerHTML = activeEditPartners.map((partner, idx) => `
      <div class="edit-partner-card" data-idx="${idx}">
        <span style="font-weight:700; font-size:0.78rem; color:var(--text-muted); min-width:20px;">#${idx + 1}</span>
        <input type="text" class="edit-partner-name" value="${escapeHTML(partner.name || '')}" placeholder="${isZh ? '队友姓名...' : 'Nama Rekan...'}" style="flex:2;" required>
        <input type="text" class="edit-partner-dept" value="${escapeHTML(partner.dept || '')}" placeholder="${isZh ? '部门...' : 'Dept...'}" style="flex:1.5;">
        <input type="text" class="edit-partner-wecom" value="${escapeHTML(partner.wecom || '')}" placeholder="${isZh ? '微信号/联系...' : 'WeCom...'}" style="flex:1.5;">
        <button type="button" class="btn-remove-edit-partner" data-idx="${idx}" title="${isZh ? '删除队友' : 'Hapus Rekan'}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');

    // Attach remove listeners
    el.editReportPartnersContainer.querySelectorAll('.btn-remove-edit-partner').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        activeEditPartners.splice(idx, 1);
        renderEditPartnersList();
      });
    });

    // Sync input changes live into memory array
    el.editReportPartnersContainer.querySelectorAll('.edit-partner-card').forEach(card => {
      const idx = parseInt(card.dataset.idx, 10);
      const nameInp = card.querySelector('.edit-partner-name');
      const deptInp = card.querySelector('.edit-partner-dept');
      const wecomInp = card.querySelector('.edit-partner-wecom');

      if (nameInp) nameInp.addEventListener('input', () => { if (activeEditPartners[idx]) activeEditPartners[idx].name = nameInp.value; });
      if (deptInp) deptInp.addEventListener('input', () => { if (activeEditPartners[idx]) activeEditPartners[idx].dept = deptInp.value; });
      if (wecomInp) wecomInp.addEventListener('input', () => { if (activeEditPartners[idx]) activeEditPartners[idx].wecom = wecomInp.value; });
    });
  }

  function handleSaveEditedParticipant(e) {
    e.preventDefault();
    const t = state.currentTournament;
    if (!t) return;

    const participantId = el.editReportParticipantId.value;
    const p = (t.participants || []).find(part => part.id === participantId);
    if (!p) return;

    const newDisplayName = el.editReportName.value.trim();
    const newPlayerName = el.editReportPlayer.value.trim();
    const newDept = el.editReportDept.value.trim();
    const newWecom = el.editReportWecom.value.trim();

    // Collect latest partner values from DOM
    const updatedPartners = [];
    if (el.editReportPartnersContainer) {
      el.editReportPartnersContainer.querySelectorAll('.edit-partner-card').forEach(card => {
        const pName = (card.querySelector('.edit-partner-name')?.value || '').trim();
        const pDept = (card.querySelector('.edit-partner-dept')?.value || '').trim();
        const pWecom = (card.querySelector('.edit-partner-wecom')?.value || '').trim();
        if (pName) {
          updatedPartners.push({ name: pName, dept: pDept, wecom: pWecom });
        }
      });
    }

    const hasPartners = updatedPartners.length > 0;

    // Update participant object
    p.name = newDisplayName || newPlayerName || 'Peserta';
    p.teamName = newDisplayName || '';
    p.playerName = newPlayerName || newDisplayName || '';
    p.dept = newDept;
    p.wecom = newWecom;
    p.isTeam = hasPartners;
    p.partners = updatedPartners;
    p.partner = updatedPartners[0] || null;

    // Synchronize across all matches in bracket tree
    const updateMatchParticipant = (slotP) => {
      if (!slotP || slotP.id !== p.id) return;
      slotP.name = p.name;
      slotP.teamName = p.teamName;
      slotP.playerName = p.playerName;
      slotP.dept = p.dept;
      slotP.wecom = p.wecom;
      slotP.isTeam = p.isTeam;
      slotP.partners = p.partners;
      slotP.partner = p.partner;
      if (p.name) {
        slotP.isPlaceholder = false;
        slotP.isUnseeded = false;
      }
    };

    (t.rounds || []).forEach(r => {
      (r.matches || []).forEach(m => {
        updateMatchParticipant(m.p1);
        updateMatchParticipant(m.p2);
      });
    });

    if (t.thirdPlaceMatch) {
      updateMatchParticipant(t.thirdPlaceMatch.p1);
      updateMatchParticipant(t.thirdPlaceMatch.p2);
    }

    // Add activity log
    const isZh = state.lang === 'zh';
    addTournamentLog(
      t,
      'info',
      isZh
        ? `更新了选手资料 "${p.name}" (部门: ${p.dept || '-'}, 主力: ${p.playerName})。`
        : `Data pendaftar "${p.name}" diperbarui (Dept: ${p.dept || '-'}, Pemain: ${p.playerName || '-'}).`,
      { participantId: p.id, name: p.name, dept: p.dept }
    );

    saveTournamentState(true);
    closeModal(el.modalEditReportParticipant);
    renderParticipantReports();
    renderParticipantsDrawer();
    renderBracketStudio();

    showToast(isZh ? '选手资料已保存并同步至对阵图！' : 'Data pendaftar berhasil disimpan dan disinkronkan ke bagan!', 'success');
  }

  function exportParticipantsCSV() {
    const t = state.currentTournament;
    if (!t) return;

    const isZh = state.lang === 'zh';
    const participants = t.participants || [];

    const assignedIds = new Set();
    (t.rounds || []).forEach(r => {
      (r.matches || []).forEach(m => {
        if (m.p1 && m.p1.id && !m.p1.isPlaceholder && !m.p1.isUnseeded && m.p1.name && m.p1.name.trim()) assignedIds.add(m.p1.id);
        if (m.p2 && m.p2.id && !m.p2.isPlaceholder && !m.p2.isUnseeded && m.p2.name && m.p2.name.trim()) assignedIds.add(m.p2.id);
      });
    });

    const registeredList = participants.filter(p => !!((p.name && p.name.trim()) || (p.playerName && p.playerName.trim()) || (p.teamName && p.teamName.trim())));

    if (registeredList.length === 0) {
      showToast(isZh ? '暂无报名选手数据可导出' : 'Tidak ada data peserta untuk diexport', 'warning');
      return;
    }

    const headers = isZh
      ? ['序号', '队伍/选手名称', '队长/主要选手', '部门', '微信号/联系方式', '队友名单', '报名时间', '对阵图状态']
      : ['No', 'Nama Tim / Peserta', 'Ketua / Pemain Utama', 'Departemen / Divisi', 'Kontak / WeCom', 'Anggota Tim (Rekan)', 'Waktu Pendaftaran', 'Status Bagan'];

    const rows = [headers];

    registeredList.forEach((p, idx) => {
      const isSeeded = assignedIds.has(p.id);
      const partnersList = Array.isArray(p.partners) && p.partners.length > 0
        ? p.partners
        : (p.partner && p.partner.name ? [p.partner] : []);
      const partnerStr = partnersList.map(m => `${m.name}${m.dept ? ` (${m.dept})` : ''}`).join('; ');

      let dateFormatted = '-';
      if (p.registeredAt) {
        try {
          const d = new Date(p.registeredAt);
          dateFormatted = d.toLocaleString(isZh ? 'zh-CN' : 'id-ID');
        } catch (e) {
          dateFormatted = p.registeredAt;
        }
      }

      rows.push([
        idx + 1,
        p.teamName || p.name || '',
        p.playerName || p.name || '',
        p.dept || '',
        p.wecom || '',
        partnerStr || '-',
        dateFormatted,
        isSeeded ? (isZh ? '已在对阵' : 'Masuk Bagan') : (isZh ? '未入对阵' : 'Belum di Bagan')
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Peserta_${(t.name || 'Tournament').replace(/\s+/g, '_')}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(isZh ? 'Excel / CSV 报表已成功导出！' : 'File Excel/CSV berhasil didownload!', 'success');
  }

  // ==================== TOURNAMENT AUDIT LOG SYSTEM ====================
  let activeLogFilter = 'all';

  function addTournamentLog(t, type, description, details = {}) {
    if (!t) return;
    t.logs = t.logs || [];
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type: type || 'info',
      description: description || '',
      details: details || {}
    };
    t.logs.unshift(entry);
    if (t.logs.length > 500) {
      t.logs.pop();
    }
    renderLogsDrawer();
  }

  function reconstructInitialLogs(t) {
    if (!t) return;
    if (t.logs && t.logs.length > 0) return;

    t.logs = [];
    const baseTime = t.createdAt ? new Date(t.createdAt).getTime() : (Date.now() - 3600000);
    let stepOffset = 1000;

    // 1. Initial tournament creation
    t.logs.push({
      id: `log_init_created`,
      timestamp: new Date(baseTime).toISOString(),
      type: 'init',
      description: `Turnamen dibuat (${t.name || 'Turnamen'}), Kategori: ${t.game || 'Umum'}.`,
      details: {}
    });

    // 2. Initial participant registrations
    const participants = t.participants || [];
    if (participants.length > 0) {
      t.logs.push({
        id: `log_init_participants`,
        timestamp: new Date(baseTime + stepOffset).toISOString(),
        type: 'init',
        description: `Total ${participants.length} peserta terdaftar dalam turnamen.`,
        details: { count: participants.length }
      });
      stepOffset += 1000;
    }

    // 3. Leaf match slots
    (t.rounds || []).forEach((r, rIdx) => {
      (r.matches || []).forEach((m, mIdx) => {
        if (!m.feederTopId && m.p1 && m.p1.id && !m.p1.isPlaceholder && !m.p1.isUnseeded) {
          t.logs.push({
            id: `log_init_slot_${m.id}_p1`,
            timestamp: new Date(baseTime + stepOffset).toISOString(),
            type: 'slot',
            description: `Ronde ${r.roundNumber} Match #${mIdx + 1} (Top): Slot awal ditempati "${m.p1.name}" (Seed #${m.p1.seed || '-'}).`,
            details: { matchId: m.id, slot: 'p1', participantId: m.p1.id }
          });
          stepOffset += 500;
        }
        if (!m.feederBotId && m.p2 && m.p2.id && !m.p2.isPlaceholder && !m.p2.isUnseeded) {
          t.logs.push({
            id: `log_init_slot_${m.id}_p2`,
            timestamp: new Date(baseTime + stepOffset).toISOString(),
            type: 'slot',
            description: `Ronde ${r.roundNumber} Match #${mIdx + 1} (Bot): Slot awal ditempati "${m.p2.name}" (Seed #${m.p2.seed || '-'}).`,
            details: { matchId: m.id, slot: 'p2', participantId: m.p2.id }
          });
          stepOffset += 500;
        }
      });
    });

    // 4. Bracket lock status
    if (t.isLocked) {
      t.logs.push({
        id: `log_init_lock`,
        timestamp: new Date(baseTime + stepOffset).toISOString(),
        type: 'lock',
        description: `Bagan dikunci (Lock Bracket). Mode turnamen berjalan diaktifkan.`,
        details: {}
      });
      stepOffset += 1000;
    } else if (t.status === 'in_progress') {
      t.logs.push({
        id: `log_init_unlock`,
        timestamp: new Date(baseTime + stepOffset).toISOString(),
        type: 'unlock',
        description: `Bagan dibuka kunci untuk penyesuaian susunan manual (status tetap berjalan).`,
        details: {}
      });
      stepOffset += 1000;
    }

    // 5. Existing match statuses, scores, notes, and winners
    (t.rounds || []).forEach((r, rIdx) => {
      (r.matches || []).forEach((m, mIdx) => {
        const p1Name = m.p1?.name || 'TBD';
        const p2Name = m.p2?.name || 'TBD';

        if (m.note) {
          t.logs.push({
            id: `log_init_note_${m.id}`,
            timestamp: new Date(baseTime + stepOffset).toISOString(),
            type: 'score',
            description: `Ronde ${r.roundNumber} Match #${mIdx + 1} (${p1Name} vs ${p2Name}): Catatan pertandingan: "${m.note}".`,
            details: { matchId: m.id, note: m.note }
          });
          stepOffset += 500;
        }

        if (m.status === 'in_progress') {
          t.logs.push({
            id: `log_init_status_${m.id}`,
            timestamp: new Date(baseTime + stepOffset).toISOString(),
            type: 'status',
            description: `Ronde ${r.roundNumber} Match #${mIdx + 1} (${p1Name} vs ${p2Name}): Status diset "Sedang Main".`,
            details: { matchId: m.id, status: 'in_progress' }
          });
          stepOffset += 500;
        } else if (m.status === 'next_up') {
          t.logs.push({
            id: `log_init_status_${m.id}`,
            timestamp: new Date(baseTime + stepOffset).toISOString(),
            type: 'status',
            description: `Ronde ${r.roundNumber} Match #${mIdx + 1} (${p1Name} vs ${p2Name}): Status diset "Akan Bermain".`,
            details: { matchId: m.id, status: 'next_up' }
          });
          stepOffset += 500;
        }

        if (m.winnerId || (m.score1 !== '' && m.score1 !== undefined && m.score2 !== '' && m.score2 !== undefined)) {
          const winner = m.winnerId === m.p1?.id ? m.p1 : (m.winnerId === m.p2?.id ? m.p2 : null);
          const loser = winner?.id === m.p1?.id ? m.p2 : m.p1;
          const winnerName = winner ? winner.name : 'Pemenang';
          const loserName = loser ? loser.name : 'TBD';
          t.logs.push({
            id: `log_init_win_${m.id}`,
            timestamp: new Date(baseTime + stepOffset).toISOString(),
            type: 'winner',
            description: `Ronde ${r.roundNumber} Match #${mIdx + 1}: ${winnerName} menang atas ${loserName} dengan skor (${m.score1 ?? 0} - ${m.score2 ?? 0}).`,
            details: { matchId: m.id, winnerId: m.winnerId, score1: m.score1, score2: m.score2 }
          });
          stepOffset += 500;
        }
      });
    });

    // Sort descending by timestamp
    t.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    saveTournamentState(false);
  }

  function renderLogsDrawer() {
    if (!el.logsContainer) return;
    const t = state.currentTournament;
    if (!t) return;

    const logs = t.logs || [];
    if (el.logsCountBadge) el.logsCountBadge.textContent = logs.length;

    const filtered = activeLogFilter === 'all'
      ? logs
      : logs.filter(l => l.type === activeLogFilter);

    if (filtered.length === 0) {
      el.logsContainer.innerHTML = `
        <div style="text-align:center; padding:24px 12px; color:var(--text-muted); font-size:0.8rem;">
          <i class="fa-solid fa-clock-rotate-left" style="font-size:24px; opacity:0.4; margin-bottom:8px; display:block;"></i>
          Belum ada riwayat aktivitas log pada bagan ini.
        </div>
      `;
      return;
    }

    const isZh = state.lang === 'zh';
    const typeIcons = {
      score: '<i class="fa-solid fa-trophy"></i>',
      winner: '<i class="fa-solid fa-crown"></i>',
      status: '<i class="fa-solid fa-bolt"></i>',
      slot: '<i class="fa-solid fa-arrows-split-up-and-left"></i>',
      lock: '<i class="fa-solid fa-lock"></i>',
      unlock: '<i class="fa-solid fa-lock-open"></i>',
      reset: '<i class="fa-solid fa-rotate-left"></i>',
      init: '<i class="fa-solid fa-flag-checkered"></i>'
    };

    el.logsContainer.innerHTML = filtered.map(log => {
      const icon = typeIcons[log.type] || '<i class="fa-solid fa-circle-info"></i>';
      let timeFormatted = '-';
      if (log.timestamp) {
        try {
          const d = new Date(log.timestamp);
          timeFormatted = d.toLocaleString(isZh ? 'zh-CN' : 'id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short'
          });
        } catch (e) {
          timeFormatted = log.timestamp;
        }
      }

      return `
        <div class="log-entry ${log.type}">
          <div class="log-icon-col">
            ${icon}
          </div>
          <div class="log-content-col">
            <div class="log-header-row">
              <span class="log-badge ${log.type}">${log.type}</span>
              <span class="log-time">${timeFormatted}</span>
            </div>
            <div class="log-desc">${escapeHTML(log.description)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function exportLogsCSV() {
    const t = state.currentTournament;
    if (!t || !t.logs || t.logs.length === 0) {
      showToast('Belum ada data log untuk diekspor.', 'warning');
      return;
    }

    const isZh = state.lang === 'zh';
    const headers = isZh
      ? ['序号', '时间', '类型', '操作描述']
      : ['No', 'Waktu (Timestamp)', 'Tipe', 'Deskripsi Aktivitas'];

    const rows = [headers];
    t.logs.forEach((log, idx) => {
      let timeStr = log.timestamp;
      try {
        timeStr = new Date(log.timestamp).toLocaleString(isZh ? 'zh-CN' : 'id-ID');
      } catch (e) {}

      rows.push([
        idx + 1,
        timeStr,
        log.type,
        log.description || ''
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(t.name || 'Tournament').replace(/\s+/g, '_')}_Log_Bagan.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Log bagan berhasil diekspor ke CSV!', 'success');
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
    if (!t) return;

    if (t.isLocked || t.status === 'in_progress') {
      showToast('Turnamen sedang berjalan! Pengacakan / auto-seed dinonaktifkan untuk menjaga susunan bagan. Anda hanya dapat menggeser peserta (drag & drop).', 'warning');
      return;
    }

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
          const canonicalSeed = parseInt(m.p1?.seed, 10) || 9999;
          entrySlots.push({ roundIdx: rIdx, matchIdx: mIdx, slot: 'p1', isLocked: !!m.p1Locked, currentP: m.p1, canonicalSeed });
        }
        if (!m.feederBotId) {
          const canonicalSeed = parseInt(m.p2?.seed, 10) || 9999;
          entrySlots.push({ roundIdx: rIdx, matchIdx: mIdx, slot: 'p2', isLocked: !!m.p2Locked, currentP: m.p2, canonicalSeed });
        }
      });
    });

    // Sort entrySlots by canonical seed ascending so top seeds get BYEs in Round 2 and lower seeds play in Round 1
    entrySlots.sort((a, b) => a.canonicalSeed - b.canonicalSeed);

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
        const assigned = { ...pool[pIdx], seed: s.canonicalSeed !== 9999 ? s.canonicalSeed : (pIdx + 1), isPlaceholder: false, isUnseeded: false };
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

    sanitizeBracketDuplicates(t);
    addTournamentLog(t, 'slot', isRandom ? '🎲 Bagan diacak secara acak (Random Seeding).' : '✨ Bagan diatur sesuai seed standar (Auto-Seed).');
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
    reconcileFeederAdvancements(t);

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
          autoLockAt: t.autoLockAt || null,
          isRegistrationClosed: !!t.isRegistrationClosed
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
      if (reconcileFeederAdvancements(t)) {
        saveTournamentState(false);
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
          } else if (t.isRegistrationClosed) {
            el.notStartedTimer.textContent = 'Pendaftaran ditutup';
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

      const isZh = state.lang === 'zh';
      el.registerTournamentName.textContent = t.name;
      el.registerTournamentMeta.textContent = isZh ? `${t.game || '比赛项目'} • 选手报名开放中` : `${t.game || 'Esports'} • Pendaftaran Dibuka`;

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
        const isCurrentZh = state.lang === 'zh';
        for (let i = 0; i < count; i++) {
          const card = document.createElement('div');
          card.className = 'teammate-card';
          const cardHeader = isCurrentZh ? `队员 #${i + 1} 信息` : `Data Rekan #${i + 1}`;
          const nameLabel = isCurrentZh ? `队员 #${i + 1} 完整姓名` : `Nama Lengkap Rekan #${i + 1}`;
          const namePh = isCurrentZh ? `请输入队员 #${i + 1} 完整姓名` : `Masukkan nama lengkap rekan #${i + 1}`;
          const wecomLabel = isCurrentZh ? `队员 #${i + 1} 企业微信 / 手机号` : `No. WeCom Rekan #${i + 1}`;
          const wecomPh = isCurrentZh ? `企业微信 / 手机号` : `No. WeCom / WA`;
          const deptLabel = isCurrentZh ? `队员 #${i + 1} 所属部门` : `Departemen (Dept) Rekan #${i + 1}`;
          const deptPh = isCurrentZh ? `例如：生产部、信息部、HR` : `Contoh: Produksi, IT, HR`;

          card.innerHTML = `
            <div class="teammate-card-header">
              <i class="fa-solid fa-user-plus"></i> ${cardHeader}
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
              <label class="form-label" style="font-size: 11px;">${nameLabel} <span class="required">*</span></label>
              <input type="text" class="input-modern reg-partner-name" placeholder="${namePh}" required />
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
              <label class="form-label" style="font-size: 11px;">${wecomLabel}</label>
              <input type="text" class="input-modern reg-partner-wecom" placeholder="${wecomPh}" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 11px;">${deptLabel}</label>
              <input type="text" class="input-modern reg-partner-dept" placeholder="${deptPh}" />
            </div>
          `;
          el.regPartnersDynamicContainer.appendChild(card);
        }
      }

      // Dropdown selection for teammate count
      if (el.regTeammateCountSelect) {
        el.regTeammateCountSelect.innerHTML = isZh ? `
          <option value="1">1 名队友（双人赛 / 共2人）</option>
          <option value="2">2 名队友（三人赛 / 共3人）</option>
          <option value="3">3 名队友（四人赛 / 共4人）</option>
          <option value="4">4 名队友（五人赛 / 共5人）</option>
          <option value="5">5 名队友（六人赛 / 共6人）</option>
        ` : `
          <option value="1">1 Rekan (Ganda / 2 Pemain)</option>
          <option value="2">2 Rekan (Trio / 3 Pemain)</option>
          <option value="3">3 Rekan (Quad / 4 Pemain)</option>
          <option value="4">4 Rekan (5 Pemain)</option>
          <option value="5">5 Rekan (6 Pemain)</option>
        `;
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
        const isCurrentZh = state.lang === 'zh';
        const playerName = el.regPlayerName ? el.regPlayerName.value.trim() : '';
        const wecom = el.regPlayerWecom ? el.regPlayerWecom.value.trim() : '';
        const dept = el.regPlayerDept ? el.regPlayerDept.value.trim() : '';
        const isTeam = isTeamTournament;
        const teamNameInput = (isTeam && el.regTeamName) ? el.regTeamName.value.trim() : '';

        if (!playerName) {
          showToast(isCurrentZh ? '请填写队长/主选手完整姓名！' : 'Mohon isi Nama Lengkap pemain utama!', 'warning');
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
              showToast(isCurrentZh ? `请填写队员 #${i + 1} 的姓名！` : `Mohon isi Nama Lengkap untuk Rekan #${i + 1}!`, 'warning');
              card.querySelector('.reg-partner-name')?.focus();
              return;
            }
            partners.push({ name: pName, wecom: pWecom, dept: pDept });
          }
        }

        const firstName = playerName.split(/\s+/)[0] || 'Player';
        const finalDisplayName = isTeam ? (teamNameInput || `${isCurrentZh ? '战队' : 'TIM'} ${firstName}`) : playerName;

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
            showToast(isCurrentZh ? '报名成功！祝您在比赛中取得好成绩。' : 'Pendaftaran berhasil! Selamat bertanding.', 'success');
          } else {
            showToast((isCurrentZh ? '报名失败: ' : 'Pendaftaran gagal: ') + (regData.error || (isCurrentZh ? '发生未知错误' : 'Terjadi kesalahan')), 'error');
          }
        } catch (err) {
          showToast((isCurrentZh ? '报名失败: ' : 'Pendaftaran gagal: ') + err.message, 'error');
        }
      };

      // Populate Live View URL in success box
      const liveUrl = `${window.location.origin}/?view=live&id=${t.id}`;
      if (el.successLiveUrl) el.successLiveUrl.value = liveUrl;
      if (el.btnCopySuccessLive) {
        el.btnCopySuccessLive.onclick = () => {
          navigator.clipboard.writeText(liveUrl).then(() => {
            showToast(state.lang === 'zh' ? '观赛链接已复制到剪贴板！' : 'Live View URL berhasil disalin!', 'success');
          });
        };
      }
      if (el.btnClosedViewLive) {
        el.btnClosedViewLive.href = `?view=live&id=${t.id}`;
        el.btnClosedViewLive.onclick = (e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
          e.preventDefault();
          navigateToLive(t.id);
        };
      }

      // Check if registration is closed
      const isClosed = !!(t.isLocked || t.isRegistrationClosed || (t.registrationDeadline && Date.now() > new Date(t.registrationDeadline).getTime()));
      if (isClosed) {
        if (el.publicRegisterForm) el.publicRegisterForm.classList.add('hidden');
        if (el.registerClosedBox) el.registerClosedBox.classList.remove('hidden');
        if (el.regDeadlineText) el.regDeadlineText.textContent = isZh ? '报名通道已关闭' : 'Pendaftaran Telah Ditutup';
        if (el.regDeadlineBadge) {
          el.regDeadlineBadge.style.background = 'rgba(239, 68, 68, 0.15)';
          el.regDeadlineBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          el.regDeadlineBadge.style.color = '#f87171';
        }
      } else {
        if (el.publicRegisterForm) el.publicRegisterForm.classList.remove('hidden');
        if (el.registerClosedBox) el.registerClosedBox.classList.add('hidden');
        if (el.regDeadlineBadge) {
          el.regDeadlineBadge.style.background = 'rgba(245, 158, 11, 0.15)';
          el.regDeadlineBadge.style.borderColor = 'rgba(245, 158, 11, 0.35)';
          el.regDeadlineBadge.style.color = '#fbbf24';
        }
        if (t.registrationDeadline) {
          const updateRegCountdown = () => {
            const rem = new Date(t.registrationDeadline).getTime() - Date.now();
            const isCountZh = state.lang === 'zh';
            if (rem <= 0) {
              if (el.publicRegisterForm) el.publicRegisterForm.classList.add('hidden');
              if (el.registerClosedBox) el.registerClosedBox.classList.remove('hidden');
              if (el.regDeadlineText) el.regDeadlineText.textContent = isCountZh ? '报名通道已关闭' : 'Pendaftaran Telah Ditutup';
              return;
            }
            const hours = Math.floor(rem / 3600000);
            const mins = Math.floor((rem % 3600000) / 60000);
            const secs = Math.floor((rem % 60000) / 1000);
            const timeStr = hours > 0
              ? (isCountZh ? `${hours}小时 ${mins}分 ${secs}秒` : `${hours}j ${mins}m ${secs}d`)
              : (isCountZh ? `${mins}分 ${secs}秒` : `${mins}m ${secs}d`);
            if (el.regDeadlineText) el.regDeadlineText.textContent = isCountZh ? `截止倒计时: ${timeStr}` : `Ditutup dalam: ${timeStr}`;
          };
          updateRegCountdown();
          if (state.regCountdownTimer) clearInterval(state.regCountdownTimer);
          state.regCountdownTimer = setInterval(updateRegCountdown, 1000);
        } else {
          if (state.regCountdownTimer) {
            clearInterval(state.regCountdownTimer);
            state.regCountdownTimer = null;
          }
          if (el.regDeadlineText) el.regDeadlineText.textContent = isZh ? '报名正在进行' : 'Pendaftaran Dibuka';
        }
      }

      if (el.btnViewLiveBracket) {
        el.btnViewLiveBracket.href = `?view=live&id=${t.id}`;
        el.btnViewLiveBracket.onclick = (e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
          e.preventDefault();
          navigateToLive(t.id);
        };
      }
    } catch (err) {
      showToast('Error loading registration: ' + err.message, 'error');
    }
  }

  // ==================== MATCH PROGRESS CORNER HUD ====================
  function updateMatchProgressHUD(rounds, isLive = false) {
    if (!rounds || !Array.isArray(rounds)) return;
    const isZh = state.lang === 'zh';
    let totalMatches = 0;
    let completedMatches = 0;
    const inProgressList = [];

    rounds.forEach((r, rIdx) => {
      if (!r.matches) return;
      r.matches.forEach((m, mIdx) => {
        totalMatches++;
        if (m.status === 'completed' || (m.winnerId && (m.score1 !== '' || m.score2 !== ''))) {
          completedMatches++;
        } else if (m.status === 'in_progress') {
          inProgressList.push({ match: m, roundTitle: r.title, roundNum: r.roundNumber, rIdx, mIdx });
        }
      });
    });

    const nextUpList = findNextUpMatches(rounds);

    const pct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

    const pctEl = isLive ? el.liveProgressPct : el.studioProgressPct;
    const fillEl = isLive ? el.liveProgressFill : el.studioProgressFill;
    const countEl = isLive ? el.liveProgressCount : el.studioProgressCount;
    const activeTitleEl = isLive ? el.liveActiveTitle : el.studioActiveTitle;
    const namesEl = isLive ? el.liveActiveNames : el.studioActiveNames;
    const upNextTitleEl = isLive ? el.liveUpNextTitle : el.studioUpNextTitle;
    const upNextEl = isLive ? el.liveUpNextNames : el.studioUpNextNames;

    if (pctEl) pctEl.textContent = `${pct}%`;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (countEl) {
      countEl.textContent = isZh
        ? `${completedMatches} / ${totalMatches} 场比赛已完成 (${pct}%)`
        : `${completedMatches} / ${totalMatches} Match Selesai (${pct}%)`;
    }

    const formatRoundTitle = (rTitle) => {
      if (!isZh || !rTitle) return rTitle || '';
      if (rTitle === 'Championship Final') return '总决赛';
      if (rTitle === 'Semifinals') return '半决赛';
      if (rTitle === 'Quarterfinals') return '四分之一决赛';
      if (rTitle === 'Round of 16') return '16强赛';
      if (rTitle === 'Round of 32') return '32强赛';
      if (rTitle === 'Round of 64') return '64强赛';
      if (/^Round\s+(\d+)$/i.test(rTitle)) return rTitle.replace(/^Round\s+(\d+)$/i, '第 $1 轮');
      return rTitle;
    };

    if (activeTitleEl) {
      const countPill = inProgressList.length > 0
        ? `<span class="hud-count-badge">${inProgressList.length}</span>`
        : '';
      activeTitleEl.innerHTML = `<span class="pulse-indicator"></span> <span>${isZh ? '正在进行的比赛' : 'Match Berlangsung'}:</span> ${countPill}`;
    }

    if (namesEl) {
      if (inProgressList.length > 0) {
        namesEl.innerHTML = inProgressList.map(item => {
          const p1 = item.match.p1?.name || (isZh ? '待定' : 'TBD');
          const p2 = item.match.p2?.name || (isZh ? '待定' : 'TBD');
          const rTitle = formatRoundTitle(item.roundTitle);
          const mLabel = item.match.isBronzeMatch
            ? (isZh ? '季军赛' : 'Bronze Match')
            : (isZh ? `第 ${item.mIdx + 1} 场` : `Match #${item.mIdx + 1}`);

          const s1 = (item.match.score1 !== '' && item.match.score1 !== null && item.match.score1 !== undefined) ? item.match.score1 : null;
          const s2 = (item.match.score2 !== '' && item.match.score2 !== null && item.match.score2 !== undefined) ? item.match.score2 : null;
          const scoreBadge = (s1 !== null || s2 !== null)
            ? `<span class="hud-score-pill">${s1 ?? 0} - ${s2 ?? 0}</span>`
            : '';

          return `
            <div class="hud-match-item in-progress-item" data-ridx="${item.rIdx}" data-midx="${item.mIdx}" title="${isLive ? '' : (isZh ? '点击定位此比赛并录入比分' : 'Klik untuk buka & input skor')}">
              <div class="hud-item-header">
                <span class="hud-match-meta">${escapeHTML(rTitle)} • ${mLabel}</span>
                <span class="hud-live-tag"><span class="pulse-dot-live"></span> LIVE</span>
              </div>
              <div class="hud-item-body">
                <span class="hud-player-name" title="${escapeHTML(p1)}">${escapeHTML(p1)}</span>
                <span class="hud-vs-badge">VS</span>
                <span class="hud-player-name" title="${escapeHTML(p2)}">${escapeHTML(p2)}</span>
                ${scoreBadge}
              </div>
            </div>
          `;
        }).join('');
      } else if (completedMatches === totalMatches && totalMatches > 0) {
        namesEl.innerHTML = `<div class="hud-empty-state completed"><i class="fa-solid fa-trophy"></i> ${isZh ? '所有比赛均已结束！' : 'Semua Match Selesai!'}</div>`;
      } else {
        namesEl.innerHTML = `<div class="hud-empty-state"><i class="fa-regular fa-clock"></i> ${isZh ? '暂无进行中的比赛' : 'Belum ada match aktif'}</div>`;
      }
    }

    if (upNextTitleEl) {
      const countPill = nextUpList.length > 0
        ? `<span class="hud-count-badge amber">${nextUpList.length}</span>`
        : '';
      upNextTitleEl.innerHTML = `<span class="pulse-indicator-amber"></span> <span>${isZh ? '接下来进行' : 'Akan Main Selanjutnya'}:</span> ${countPill}`;
    }

    if (upNextEl) {
      if (nextUpList.length > 0) {
        upNextEl.innerHTML = nextUpList.map(item => {
          const p1 = item.match.p1?.name || (isZh ? '待定' : 'TBD');
          const p2 = item.match.p2?.name || (isZh ? '待定' : 'TBD');
          const rTitle = formatRoundTitle(item.roundTitle);
          const mLabel = item.match.isBronzeMatch
            ? (isZh ? '季军赛' : 'Bronze Match')
            : (isZh ? `第 ${item.mIdx + 1} 场` : `Match #${item.mIdx + 1}`);

          return `
            <div class="hud-match-item next-up-item" data-ridx="${item.rIdx}" data-midx="${item.mIdx}" title="${isLive ? '' : (isZh ? '点击定位此比赛' : 'Klik untuk lihat match')}">
              <div class="hud-item-header">
                <span class="hud-match-meta">${escapeHTML(rTitle)} • ${mLabel}</span>
                <span class="hud-next-tag">NEXT</span>
              </div>
              <div class="hud-item-body">
                <span class="hud-player-name" title="${escapeHTML(p1)}">${escapeHTML(p1)}</span>
                <span class="hud-vs-badge amber">VS</span>
                <span class="hud-player-name" title="${escapeHTML(p2)}">${escapeHTML(p2)}</span>
              </div>
            </div>
          `;
        }).join('');
      } else if (completedMatches === totalMatches && totalMatches > 0) {
        upNextEl.innerHTML = `<div class="hud-empty-state completed"><i class="fa-solid fa-medal"></i> ${isZh ? '所有比赛均已结束 🏆' : 'Semua Match Selesai 🏆'}</div>`;
      } else {
        upNextEl.innerHTML = `<div class="hud-empty-state"><i class="fa-solid fa-list-check"></i> ${isZh ? '暂无设置即将开赛' : 'Menunggu giliran match'}</div>`;
      }
    }

    // Attach click-to-focus listeners in Studio (pans camera without popping modal)
    if (!isLive) {
      if (namesEl) {
        namesEl.querySelectorAll('.hud-match-item').forEach(card => {
          card.addEventListener('click', () => {
            const rIdx = parseInt(card.dataset.ridx, 10);
            const mIdx = parseInt(card.dataset.midx, 10);
            focusMatchNode(rIdx, mIdx);
          });
        });
      }
      if (upNextEl) {
        upNextEl.querySelectorAll('.hud-match-item').forEach(card => {
          card.addEventListener('click', () => {
            const rIdx = parseInt(card.dataset.ridx, 10);
            const mIdx = parseInt(card.dataset.midx, 10);
            focusMatchNode(rIdx, mIdx);
          });
        });
      }
    }

    // Automatically refresh Queue Drawer if currently open
    if (el.matchQueueDrawerOverlay && !el.matchQueueDrawerOverlay.classList.contains('hidden')) {
      renderQueueDrawer();
    }
  }

  // ==================== MATCH QUEUE & ORDER OF PLAY DRAWER ====================
  function openMatchQueueDrawer() {
    if (!el.matchQueueDrawerOverlay) return;
    el.matchQueueDrawerOverlay.classList.remove('hidden');
    renderQueueDrawer();
  }

  function closeMatchQueueDrawer() {
    if (!el.matchQueueDrawerOverlay) return;
    el.matchQueueDrawerOverlay.classList.add('hidden');
  }

  function switchQueueTab(tabName) {
    if (tabName === 'active') {
      if (el.btnQueueTabActive) el.btnQueueTabActive.classList.add('active');
      if (el.btnQueueTabFinished) el.btnQueueTabFinished.classList.remove('active');
      if (el.queuePanelActive) el.queuePanelActive.classList.remove('hidden');
      if (el.queuePanelFinished) el.queuePanelFinished.classList.add('hidden');
    } else {
      if (el.btnQueueTabActive) el.btnQueueTabActive.classList.remove('active');
      if (el.btnQueueTabFinished) el.btnQueueTabFinished.classList.add('active');
      if (el.queuePanelActive) el.queuePanelActive.classList.add('hidden');
      if (el.queuePanelFinished) el.queuePanelFinished.classList.remove('hidden');
    }
    renderQueueDrawer();
  }

  function getAllTournamentMatches(tournament) {
    if (!tournament || !tournament.rounds) return [];
    const all = [];
    (tournament.rounds || []).forEach((r, rIdx) => {
      (r.matches || []).forEach((m, mIdx) => {
        all.push({
          match: m,
          roundTitle: r.title,
          roundNum: r.roundNumber,
          rIdx,
          mIdx
        });
      });
    });
    if (tournament.thirdPlaceMatch) {
      all.push({
        match: tournament.thirdPlaceMatch,
        roundTitle: state.lang === 'zh' ? '季军赛' : 'Bronze Match',
        roundNum: 99,
        rIdx: -1,
        mIdx: -1
      });
    }
    return all;
  }

  function getUpcomingQueueMatches(tournament) {
    const all = getAllTournamentMatches(tournament);
    // Filter matches that are neither in_progress nor completed
    const upcoming = all.filter(item => item.match.status !== 'in_progress' && item.match.status !== 'completed');

    // Sort by sequenceOrder if set, else by default bracket order
    upcoming.sort((a, b) => {
      const seqA = (a.match.sequenceOrder !== undefined && a.match.sequenceOrder !== null)
        ? a.match.sequenceOrder
        : ((a.rIdx + 1) * 100 + (a.mIdx + 1));
      const seqB = (b.match.sequenceOrder !== undefined && b.match.sequenceOrder !== null)
        ? b.match.sequenceOrder
        : ((b.rIdx + 1) * 100 + (b.mIdx + 1));
      return seqA - seqB;
    });

    // Ensure consecutive sequenceOrder
    upcoming.forEach((item, idx) => {
      item.match.sequenceOrder = idx + 1;
    });

    return upcoming;
  }

  function renderQueueDrawer() {
    const t = state.currentTournament;
    if (!t || !t.rounds) return;
    const isZh = state.lang === 'zh';

    const all = getAllTournamentMatches(t);
    const inProgressList = all.filter(item => item.match.status === 'in_progress');
    const finishedList = all.filter(item => item.match.status === 'completed');
    const upcomingList = getUpcomingQueueMatches(t);

    // Update Counts & Compact All Button
    if (el.queueActiveCount) el.queueActiveCount.textContent = inProgressList.length + upcomingList.length;
    if (el.queueFinishedCount) el.queueFinishedCount.textContent = finishedList.length;
    if (el.inProgressBadgeCount) el.inProgressBadgeCount.textContent = `${inProgressList.length} Match`;
    if (el.nextUpBadgeCount) el.nextUpBadgeCount.textContent = `${upcomingList.length} Match`;
    if (el.finishedBadgeCount) el.finishedBadgeCount.textContent = `${finishedList.length} Match`;

    if (el.btnToggleCompactAll) {
      el.btnToggleCompactAll.classList.toggle('active', state.queueCompactAll);
      if (el.btnToggleCompactAllText) {
        el.btnToggleCompactAllText.textContent = state.queueCompactAll ? (isZh ? '详细模式' : 'Mode Detail') : (isZh ? '精简模式' : 'Mode Ringkas');
      }
      const icon = el.btnToggleCompactAll.querySelector('i');
      if (icon) {
        icon.className = state.queueCompactAll ? 'fa-solid fa-expand' : 'fa-solid fa-compress';
      }
    }

    // Helper for formatting round titles
    const formatRound = (rTitle, mIdx, isBronze) => {
      if (isBronze) return isZh ? '季军争夺战' : 'Perebutan Juara 3 (Bronze)';
      let clean = rTitle || 'Match';
      if (isZh) {
        if (clean === 'Championship Final') clean = '总决赛';
        else if (clean === 'Semifinals') clean = '半决赛';
        else if (clean === 'Quarterfinals') clean = '四分之一决赛';
        else if (clean === 'Round of 16') clean = '16强赛';
        else if (clean === 'Round of 32') clean = '32强赛';
        else if (clean === 'Round of 64') clean = '64强赛';
        else if (/^Round\s+(\d+)$/i.test(clean)) clean = clean.replace(/^Round\s+(\d+)$/i, '第 $1 轮');
      }
      return `${clean} • ${isZh ? `第 ${mIdx + 1} 场` : `Match #${mIdx + 1}`}`;
    };

    // Helper for generating hover tooltips
    const getParticipantTooltip = (p) => {
      if (!p || !p.name || p.isPlaceholder || p.isUnseeded) {
        return isZh ? '待定 (等待前序胜者)' : 'TBD (Menunggu Pemenang)';
      }
      const parts = [
        p.seed ? `Seed #${p.seed}` : null,
        p.name,
        p.teamName && p.teamName !== p.name ? `Tim: ${p.teamName}` : null,
        p.playerName && p.playerName !== p.name ? `Pemain: ${p.playerName}` : null,
        p.dept ? `Dept: ${p.dept}` : null,
        p.wecom ? `WeCom: ${p.wecom}` : null
      ].filter(Boolean);
      return parts.join(' • ');
    };

    // Helper for rendering participant details inside queue cards
    const renderParticipantItem = (p, score, isWinner, isWaiting) => {
      if (!p || !p.name || isWaiting) {
        return `
          <div class="queue-participant-row waiting">
            <div class="queue-participant-info">
              <span class="queue-seed-pill">-</span>
              <div class="queue-p-names">
                <span class="queue-p-main-name text-muted" style="font-style:italic;">${isZh ? '待定 (等待前序胜者)' : 'TBD (Menunggu Pemenang)'}</span>
                <span class="queue-p-sub-details">${isZh ? '上一轮胜者进入' : 'Lolos dari babak sebelumnya'}</span>
              </div>
            </div>
            ${score !== null ? `<span class="queue-score-pill">${score}</span>` : ''}
          </div>
        `;
      }

      const seedBadge = p.seed ? `<span class="queue-seed-pill">#${p.seed}</span>` : `<span class="queue-seed-pill">-</span>`;
      const deptPart = p.dept ? p.dept : '';
      const playerPart = p.playerName && p.playerName !== p.name ? p.playerName : '';
      const subInfo = [deptPart, playerPart].filter(Boolean).join(' • ');

      return `
        <div class="queue-participant-row ${isWinner ? 'winner' : ''}">
          <div class="queue-participant-info">
            ${seedBadge}
            <div class="queue-p-names">
              <span class="queue-p-main-name" title="${escapeHTML(p.name)}">
                ${escapeHTML(p.name)}
                ${isWinner ? `<i class="fa-solid fa-trophy" style="color:#10b981; margin-left:4px; font-size:0.75rem;"></i>` : ''}
              </span>
              ${subInfo ? `<span class="queue-p-sub-details" title="${escapeHTML(subInfo)}">${escapeHTML(subInfo)}</span>` : ''}
            </div>
          </div>
          ${score !== null ? `<span class="queue-score-pill ${isWinner ? 'winner' : ''}">${score}</span>` : ''}
        </div>
      `;
    };

    // 1. Render In Progress List
    if (el.queueInProgressList) {
      if (inProgressList.length === 0) {
        el.queueInProgressList.innerHTML = `
          <div class="queue-empty-state">
            <i class="fa-regular fa-circle-play"></i>
            <span>${isZh ? '暂无正在进行中的比赛' : 'Belum ada match yang sedang bertanding di lapangan'}</span>
          </div>
        `;
      } else {
        el.queueInProgressList.innerHTML = inProgressList.map(item => {
          const m = item.match;
          const label = formatRound(item.roundTitle, item.mIdx, m.isBronzeMatch);
          const s1 = (m.score1 !== '' && m.score1 !== null && m.score1 !== undefined) ? m.score1 : 0;
          const s2 = (m.score2 !== '' && m.score2 !== null && m.score2 !== undefined) ? m.score2 : 0;
          const isCompact = state.queueCompactAll ? !state.queueCardsCollapsed.has(m.id) : state.queueCardsCollapsed.has(m.id);

          const p1Tip = getParticipantTooltip(m.p1);
          const p2Tip = getParticipantTooltip(m.p2);
          const matchupTip = `${p1Tip} \nVS\n ${p2Tip}\n(${isZh ? '点击展开/折叠详情' : 'Klik untuk buka/tutup detail'})`;

          return `
            <div class="queue-match-card is-in-progress ${isCompact ? 'is-compact' : ''}" data-matchid="${m.id}">
              <div class="queue-card-topbar">
                <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                  <button type="button" class="btn-card-collapse-toggle btn-toggle-card-compact" data-matchid="${m.id}" title="${isCompact ? (isZh ? '展开详情' : 'Buka Detail') : (isZh ? '收起为精简卡片' : 'Tutup Detail / Mode Ringkas')}">
                    <i class="fa-solid ${isCompact ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
                  </button>
                  <span class="queue-match-meta"><i class="fa-solid fa-gamepad" style="color:#10b981;"></i> ${escapeHTML(label)}</span>
                </div>
                <span class="queue-status-tag live"><span class="pulse-dot-live"></span> LIVE</span>
              </div>

              <!-- Compact Single-Line Matchup -->
              <div class="queue-compact-row btn-toggle-card-compact" data-matchid="${m.id}" title="${escapeHTML(matchupTip)}">
                <div class="queue-compact-team" title="${escapeHTML(p1Tip)}">
                  <span class="queue-seed-pill sm">${m.p1?.seed ? `#${m.p1.seed}` : '-'}</span>
                  <span class="queue-compact-name">${escapeHTML(m.p1?.name || (isZh ? '待定' : 'TBD'))}</span>
                </div>
                <span class="queue-compact-vs">${s1} - ${s2}</span>
                <div class="queue-compact-team right" title="${escapeHTML(p2Tip)}">
                  <span class="queue-compact-name">${escapeHTML(m.p2?.name || (isZh ? '待定' : 'TBD'))}</span>
                  <span class="queue-seed-pill sm">${m.p2?.seed ? `#${m.p2.seed}` : '-'}</span>
                </div>
              </div>

              <!-- Full Detailed Participants Block -->
              <div class="queue-participants-container">
                ${renderParticipantItem(m.p1, s1, false, false)}
                ${renderParticipantItem(m.p2, s2, false, false)}
              </div>

              <div class="queue-card-actions">
                <span style="font-size:0.75rem; color:#10b981; font-weight:700;"><i class="fa-solid fa-tower-broadcast"></i> ${isZh ? '比赛进行中' : 'Pertandingan Aktif'}</span>
                <button type="button" class="btn-queue-action control btn-open-match-ctrl" data-ridx="${item.rIdx}" data-midx="${item.mIdx}">
                  <i class="fa-solid fa-pen-to-square"></i> ${isZh ? '录入比分 / 管理' : 'Input Skor / Kelola'}
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 2. Render Upcoming & Next Up List
    if (el.queueNextUpList) {
      if (upcomingList.length === 0) {
        el.queueNextUpList.innerHTML = `
          <div class="queue-empty-state">
            <i class="fa-solid fa-calendar-check"></i>
            <span>${isZh ? '队列中暂无待开赛比赛' : 'Semua pertandingan sudah berjalan atau selesai'}</span>
          </div>
        `;
      } else {
        el.queueNextUpList.innerHTML = upcomingList.map((item, seqIdx) => {
          const m = item.match;
          const label = formatRound(item.roundTitle, item.mIdx, m.isBronzeMatch);
          const isP1Waiting = !m.p1 || !m.p1.id || m.p1.isPlaceholder || m.p1.isUnseeded;
          const isP2Waiting = !m.p2 || !m.p2.id || m.p2.isPlaceholder || m.p2.isUnseeded;
          const canStart = !isP1Waiting && !isP2Waiting;
          const isFirst = seqIdx === 0;
          const isLast = seqIdx === upcomingList.length - 1;
          const isCompact = state.queueCompactAll ? !state.queueCardsCollapsed.has(m.id) : state.queueCardsCollapsed.has(m.id);

          const p1Tip = getParticipantTooltip(m.p1);
          const p2Tip = getParticipantTooltip(m.p2);
          const matchupTip = `${p1Tip} \nVS\n ${p2Tip}\n(${isZh ? '点击展开/折叠详情' : 'Klik untuk buka/tutup detail'})`;

          return `
            <div class="queue-match-card is-next-up ${isCompact ? 'is-compact' : ''}" data-matchid="${m.id}">
              <div class="queue-card-topbar">
                <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                  <button type="button" class="btn-card-collapse-toggle btn-toggle-card-compact" data-matchid="${m.id}" title="${isCompact ? (isZh ? '展开详情' : 'Buka Detail') : (isZh ? '收起为精简卡片' : 'Tutup Detail / Mode Ringkas')}">
                    <i class="fa-solid ${isCompact ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
                  </button>
                  <span class="queue-match-meta"><i class="fa-solid fa-clock" style="color:#f59e0b;"></i> ${escapeHTML(label)}</span>
                </div>
                <span class="queue-status-tag next">${m.status === 'next_up' ? 'NEXT UP' : `QUEUE #${seqIdx + 1}`}</span>
              </div>

              <!-- Compact Single-Line Matchup -->
              <div class="queue-compact-row btn-toggle-card-compact" data-matchid="${m.id}" title="${escapeHTML(matchupTip)}">
                <div class="queue-compact-team" title="${escapeHTML(p1Tip)}">
                  <span class="queue-seed-pill sm">${m.p1?.seed ? `#${m.p1.seed}` : '-'}</span>
                  <span class="queue-compact-name">${escapeHTML(m.p1?.name || (isZh ? '待定' : 'TBD'))}</span>
                </div>
                <span class="queue-compact-vs">VS</span>
                <div class="queue-compact-team right" title="${escapeHTML(p2Tip)}">
                  <span class="queue-compact-name">${escapeHTML(m.p2?.name || (isZh ? '待定' : 'TBD'))}</span>
                  <span class="queue-seed-pill sm">${m.p2?.seed ? `#${m.p2.seed}` : '-'}</span>
                </div>
              </div>

              <!-- Full Detailed Participants Block -->
              <div class="queue-participants-container">
                ${renderParticipantItem(m.p1, null, false, isP1Waiting)}
                ${renderParticipantItem(m.p2, null, false, isP2Waiting)}
              </div>

              <div class="queue-card-actions">
                <div class="queue-sequence-controls">
                  <span class="queue-seq-label">${isZh ? '出场序号:' : 'Urutan:'}</span>
                  <span class="queue-seq-badge">#${seqIdx + 1}</span>
                  <div class="queue-seq-stepper">
                    <button type="button" class="btn-seq-nav btn-move-seq-up" data-matchid="${m.id}" ${isFirst ? 'disabled' : ''} title="${isZh ? '出场顺序前移' : 'Naikkan urutan'}">
                      <i class="fa-solid fa-chevron-up"></i>
                    </button>
                    <button type="button" class="btn-seq-nav btn-move-seq-down" data-matchid="${m.id}" ${isLast ? 'disabled' : ''} title="${isZh ? '出场顺序后移' : 'Turunkan urutan'}">
                      <i class="fa-solid fa-chevron-down"></i>
                    </button>
                  </div>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <button type="button" class="btn-queue-action delay btn-delay-queue-match" data-matchid="${m.id}" title="${isZh ? '此比赛延后进行' : 'Tunda pertandingan ini'}">
                    <i class="fa-solid fa-clock-rotate-left"></i> ${isZh ? '延后' : 'Tunda'}
                  </button>
                  ${canStart ? `
                    <button type="button" class="btn-queue-action start btn-start-queue-match" data-matchid="${m.id}" title="${isZh ? '立即开赛' : 'Mulai Tanding Sekarang'}">
                      <i class="fa-solid fa-play"></i> ${isZh ? '开始' : 'Mulai'}
                    </button>
                  ` : ''}
                  <button type="button" class="btn-queue-action control btn-open-match-ctrl" data-ridx="${item.rIdx}" data-midx="${item.mIdx}" title="${isZh ? '详情' : 'Detail'}">
                    <i class="fa-solid fa-gear"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 3. Render Finished Matches List
    if (el.queueFinishedList) {
      if (finishedList.length === 0) {
        el.queueFinishedList.innerHTML = `
          <div class="queue-empty-state">
            <i class="fa-solid fa-trophy"></i>
            <span>${isZh ? '暂无已完赛的比赛记录' : 'Belum ada pertandingan yang selesai'}</span>
          </div>
        `;
      } else {
        // Show in reverse order (most recent first)
        const reversed = [...finishedList].reverse();
        el.queueFinishedList.innerHTML = reversed.map(item => {
          const m = item.match;
          const label = formatRound(item.roundTitle, item.mIdx, m.isBronzeMatch);
          const isP1Winner = m.winnerId && m.winnerId === m.p1?.id;
          const isP2Winner = m.winnerId && m.winnerId === m.p2?.id;
          const isCompact = state.queueCompactAll ? !state.queueCardsCollapsed.has(m.id) : state.queueCardsCollapsed.has(m.id);

          const p1Tip = getParticipantTooltip(m.p1);
          const p2Tip = getParticipantTooltip(m.p2);
          const matchupTip = `${p1Tip} \nVS\n ${p2Tip}\n(${isZh ? '点击展开/折叠详情' : 'Klik untuk buka/tutup detail'})`;

          return `
            <div class="queue-match-card is-finished ${isCompact ? 'is-compact' : ''}" data-matchid="${m.id}">
              <div class="queue-card-topbar">
                <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                  <button type="button" class="btn-card-collapse-toggle btn-toggle-card-compact" data-matchid="${m.id}" title="${isCompact ? (isZh ? '展开详情' : 'Buka Detail') : (isZh ? '收起为精简卡片' : 'Tutup Detail / Mode Ringkas')}">
                    <i class="fa-solid ${isCompact ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
                  </button>
                  <span class="queue-match-meta"><i class="fa-solid fa-circle-check" style="color:#3b82f6;"></i> ${escapeHTML(label)}</span>
                </div>
                <span class="queue-status-tag done"><i class="fa-solid fa-check"></i> FINISHED</span>
              </div>

              <!-- Compact Single-Line Matchup -->
              <div class="queue-compact-row btn-toggle-card-compact" data-matchid="${m.id}" title="${escapeHTML(matchupTip)}">
                <div class="queue-compact-team ${isP1Winner ? 'winner' : ''}" title="${escapeHTML(p1Tip)}">
                  <span class="queue-seed-pill sm">${m.p1?.seed ? `#${m.p1.seed}` : '-'}</span>
                  <span class="queue-compact-name">${escapeHTML(m.p1?.name || (isZh ? '待定' : 'TBD'))} ${isP1Winner ? '🏆' : ''}</span>
                </div>
                <span class="queue-compact-vs">${m.score1 ?? 0} - ${m.score2 ?? 0}</span>
                <div class="queue-compact-team right ${isP2Winner ? 'winner' : ''}" title="${escapeHTML(p2Tip)}">
                  <span class="queue-compact-name">${escapeHTML(m.p2?.name || (isZh ? '待定' : 'TBD'))} ${isP2Winner ? '🏆' : ''}</span>
                  <span class="queue-seed-pill sm">${m.p2?.seed ? `#${m.p2.seed}` : '-'}</span>
                </div>
              </div>

              <!-- Full Detailed Participants Block -->
              <div class="queue-participants-container">
                ${renderParticipantItem(m.p1, m.score1 ?? 0, isP1Winner, false)}
                ${renderParticipantItem(m.p2, m.score2 ?? 0, isP2Winner, false)}
              </div>

              <div class="queue-card-actions">
                <span style="font-size:0.75rem; color:var(--text-muted);">
                  <i class="fa-solid fa-award" style="color:#10b981;"></i> ${isZh ? '胜者:' : 'Pemenang:'} <strong style="color:var(--text-main);">${escapeHTML(isP1Winner ? (m.p1?.name || '') : (isP2Winner ? (m.p2?.name || '') : '-'))}</strong>
                </span>
                <button type="button" class="btn-queue-action control btn-open-match-ctrl" data-ridx="${item.rIdx}" data-midx="${item.mIdx}">
                  <i class="fa-solid fa-pen"></i> ${isZh ? '修改比分' : 'Review / Edit Skor'}
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Attach listeners inside drawer
    attachQueueDrawerEvents();
  }

  function attachQueueDrawerEvents() {
    if (!el.matchQueueDrawer) return;

    // Toggle card collapse / compact
    el.matchQueueDrawer.querySelectorAll('.btn-toggle-card-compact').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const matchId = btn.dataset.matchid;
        if (!matchId) return;
        if (state.queueCardsCollapsed.has(matchId)) {
          state.queueCardsCollapsed.delete(matchId);
        } else {
          state.queueCardsCollapsed.add(matchId);
        }
        renderQueueDrawer();
      };
    });

    // Up/Down buttons direct handler
    el.matchQueueDrawer.querySelectorAll('.btn-move-seq-up').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        moveMatchSequence(btn.dataset.matchid, -1);
      };
    });

    el.matchQueueDrawer.querySelectorAll('.btn-move-seq-down').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        moveMatchSequence(btn.dataset.matchid, 1);
      };
    });

    // Delay button
    el.matchQueueDrawer.querySelectorAll('.btn-delay-queue-match').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        delayMatchSequence(btn.dataset.matchid);
      };
    });

    // Start match button
    el.matchQueueDrawer.querySelectorAll('.btn-start-queue-match').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        startMatchFromQueue(btn.dataset.matchid);
      };
    });

    // Open Match Control modal from drawer
    el.matchQueueDrawer.querySelectorAll('.btn-open-match-ctrl').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const rIdx = parseInt(btn.dataset.ridx, 10);
        const mIdx = parseInt(btn.dataset.midx, 10);
        const t = state.currentTournament;
        if (!t) return;
        let match = null;
        if (rIdx === -1 && mIdx === -1) {
          match = t.thirdPlaceMatch;
        } else if (t.rounds[rIdx] && t.rounds[rIdx].matches) {
          match = t.rounds[rIdx].matches[mIdx];
        }
        if (match) {
          openMatchControlModal(match, rIdx, mIdx);
        }
      };
    });
  }

  function moveMatchSequence(matchId, direction) {
    const t = state.currentTournament;
    if (!t) return;
    const upcoming = getUpcomingQueueMatches(t);
    const idx = upcoming.findIndex(item => item.match.id === matchId);
    if (idx < 0) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= upcoming.length) return;

    // Swap sequence orders
    const curSeq = upcoming[idx].match.sequenceOrder;
    upcoming[idx].match.sequenceOrder = upcoming[targetIdx].match.sequenceOrder;
    upcoming[targetIdx].match.sequenceOrder = curSeq;

    saveTournamentState(false);
    renderQueueDrawer();
    updateMatchProgressHUD(t.rounds, false);
    showToast(state.lang === 'zh' ? '比赛出场顺序已更新' : 'Urutan pertandingan diperbarui', 'info');
  }

  function delayMatchSequence(matchId) {
    const t = state.currentTournament;
    if (!t) return;
    const upcoming = getUpcomingQueueMatches(t);
    const idx = upcoming.findIndex(item => item.match.id === matchId);
    if (idx < 0) return;

    if (idx < upcoming.length - 1) {
      const cur = upcoming[idx].match;
      const nxt = upcoming[idx + 1].match;
      const tmp = cur.sequenceOrder;
      cur.sequenceOrder = nxt.sequenceOrder;
      nxt.sequenceOrder = tmp;
    } else {
      showToast(state.lang === 'zh' ? '该比赛已在队列最后' : 'Pertandingan sudah berada di urutan paling akhir', 'info');
      return;
    }

    saveTournamentState(false);
    renderQueueDrawer();
    updateMatchProgressHUD(t.rounds, false);
    showToast(state.lang === 'zh' ? '比赛已延后出场' : 'Pertandingan telah ditunda ke urutan berikutnya', 'warning');
  }

  function startMatchFromQueue(matchId) {
    const t = state.currentTournament;
    if (!t) return;
    const all = getAllTournamentMatches(t);
    const item = all.find(x => x.match.id === matchId);
    if (!item || !item.match) return;

    item.match.status = 'in_progress';
    if (t.status === 'setup') {
      t.status = 'in_progress';
      if (el.studioStatusBadge) {
        el.studioStatusBadge.className = 'badge badge-in_progress';
        el.studioStatusBadge.textContent = 'IN PROGRESS';
      }
    }

    saveTournamentState(false);
    renderBracketStudio();
    renderQueueDrawer();
    showToast(state.lang === 'zh' ? '比赛开始！已移至进行中' : 'Pertandingan dimulai! Masuk ke status In Progress', 'success');
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

  function refreshQrModalStatusUI(t) {
    if (!t) return;
    const isZh = state.lang === 'zh';
    const isLocked = !!t.isLocked;
    const isManuallyClosed = !!t.isRegistrationClosed;
    const hasDeadline = !!t.registrationDeadline;
    const isDeadlinePassed = hasDeadline && (Date.now() > new Date(t.registrationDeadline).getTime());
    const isClosed = isLocked || isManuallyClosed || isDeadlinePassed;

    // 1. Update Registration Status Badge & Toggle Button in QR Modal
    if (el.qrRegStatusBadge && el.btnToggleRegStatus && el.btnToggleRegText) {
      const icon = el.btnToggleRegStatus.querySelector('i');
      if (isLocked) {
        el.qrRegStatusBadge.textContent = isZh ? '🔒 对阵已锁定' : '🔒 Bracket Terkunci';
        el.qrRegStatusBadge.style.background = 'rgba(239, 68, 68, 0.15)';
        el.qrRegStatusBadge.style.color = '#f87171';
        el.qrRegStatusBadge.style.border = '1px solid rgba(239, 68, 68, 0.3)';

        el.btnToggleRegStatus.disabled = true;
        el.btnToggleRegStatus.style.background = 'rgba(100, 116, 139, 0.2)';
        el.btnToggleRegStatus.style.color = 'var(--text-muted)';
        el.btnToggleRegStatus.style.border = '1px solid rgba(100, 116, 139, 0.3)';
        el.btnToggleRegStatus.style.cursor = 'not-allowed';
        el.btnToggleRegText.textContent = isZh ? '对阵已锁定 (报名已关闭)' : 'Bracket Terkunci (Pendaftaran Tutup)';
        if (icon) icon.className = 'fa-solid fa-lock';
      } else if (isClosed) {
        el.qrRegStatusBadge.textContent = isDeadlinePassed
          ? (isZh ? '🔴 截止时间已过 (关闭)' : '🔴 Waktu Habis (Ditutup)')
          : (isZh ? '🔴 报名已关闭' : '🔴 Ditutup (Manual)');
        el.qrRegStatusBadge.style.background = 'rgba(239, 68, 68, 0.15)';
        el.qrRegStatusBadge.style.color = '#f87171';
        el.qrRegStatusBadge.style.border = '1px solid rgba(239, 68, 68, 0.3)';

        el.btnToggleRegStatus.disabled = false;
        el.btnToggleRegStatus.style.background = 'rgba(34, 197, 94, 0.15)';
        el.btnToggleRegStatus.style.color = '#4ade80';
        el.btnToggleRegStatus.style.border = '1px solid rgba(34, 197, 94, 0.4)';
        el.btnToggleRegStatus.style.cursor = 'pointer';
        el.btnToggleRegText.textContent = isZh ? '🔓 重新开启报名通道' : '🔓 Buka Pendaftaran Kembali';
        if (icon) icon.className = 'fa-solid fa-lock-open';
      } else {
        el.qrRegStatusBadge.textContent = isZh ? '🟢 报名开放中' : '🟢 Buka (Menerima Peserta)';
        el.qrRegStatusBadge.style.background = 'rgba(34, 197, 94, 0.15)';
        el.qrRegStatusBadge.style.color = '#4ade80';
        el.qrRegStatusBadge.style.border = '1px solid rgba(34, 197, 94, 0.3)';

        el.btnToggleRegStatus.disabled = false;
        el.btnToggleRegStatus.style.background = 'rgba(239, 68, 68, 0.15)';
        el.btnToggleRegStatus.style.color = '#f87171';
        el.btnToggleRegStatus.style.border = '1px solid rgba(239, 68, 68, 0.4)';
        el.btnToggleRegStatus.style.cursor = 'pointer';
        el.btnToggleRegText.textContent = isZh ? '🔒 立即关闭报名通道' : '🔒 Tutup Pendaftaran Sekarang';
        if (icon) icon.className = 'fa-solid fa-lock';
      }
    }

    // 2. Deadline Status Badge
    if (el.qrDeadlineStatusBadge) {
      if (t.registrationDeadline) {
        const rem = new Date(t.registrationDeadline).getTime() - Date.now();
        if (rem <= 0) {
          el.qrDeadlineStatusBadge.textContent = isZh ? 'Ditutup (Waktu Habis)' : 'Waktu Habis (Ditutup)';
          el.qrDeadlineStatusBadge.style.color = '#ef4444';
        } else {
          const mins = Math.round(rem / 60000);
          el.qrDeadlineStatusBadge.textContent = isZh ? `约 ${mins} 分钟后` : `Tutup ~${mins} mnt lagi`;
          el.qrDeadlineStatusBadge.style.color = '#fbbf24';
        }
      } else {
        el.qrDeadlineStatusBadge.textContent = isZh ? '长期开启' : 'Buka Terus';
        el.qrDeadlineStatusBadge.style.color = 'var(--text-muted)';
      }
    }
  }
  const refreshQrDeadlineUI = refreshQrModalStatusUI;


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

      const noteTag = match.note
        ? `<span style="font-size:0.75rem; color:#f59e0b; margin-left:4px;" title="${escapeHTML(match.note)}"><i class="fa-solid fa-note-sticky"></i></span>`
        : '';

      return `
        <div class="match-search-item" data-id="${match.id}" data-ridx="${rIdx}" data-midx="${mIdx}">
          <div class="match-search-header">
            <span style="display:flex; align-items:center;">${escapeHTML(roundTitle)} • Match #${mIdx + 1} ${noteTag}</span>
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
          <div class="match-search-actions">
            <button type="button" class="btn btn-sm btn-primary btn-search-manage-match" data-ridx="${rIdx}" data-midx="${mIdx}" title="Buka kontrol match dan input skor">
              <i class="fa-solid fa-sliders"></i> Atur Match
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Clicking the card body focuses camera to bracket match without opening modal
    el.matchSearchResults.querySelectorAll('.match-search-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-search-manage-match')) return;
        const rIdx = parseInt(card.dataset.ridx, 10);
        const mIdx = parseInt(card.dataset.midx, 10);
        closeModal(el.modalMatchSearch);
        focusMatchNode(rIdx, mIdx);
      });
    });

    // Clicking "Atur Match" button opens Match Control Modal directly
    el.matchSearchResults.querySelectorAll('.btn-search-manage-match').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rIdx = parseInt(btn.dataset.ridx, 10);
        const mIdx = parseInt(btn.dataset.midx, 10);
        const match = state.currentTournament?.rounds?.[rIdx]?.matches?.[mIdx];
        closeModal(el.modalMatchSearch);
        focusMatchNode(rIdx, mIdx);
        if (match) {
          openMatchControlModal(match, rIdx, mIdx);
        }
      });
    });
  }

  function focusMatchNode(rIdx, mIdx) {
    const t = state.currentTournament;
    if (!t || !t.rounds || !t.rounds[rIdx] || !t.rounds[rIdx].matches[mIdx]) return;
    const match = t.rounds[rIdx].matches[mIdx];
    const isLive = state.currentView === 'live';
    const container = isLive ? el.liveCanvasContainer : el.canvasContainer;
    const canvas = isLive ? el.liveCanvas : el.bracketCanvas;
    if (!canvas || !container) return;

    const node = canvas.querySelector(`.match-node[data-id="${match.id}"]`);
    if (node) {
      const containerRect = container.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const currentScale = state.zoomLevel || 1.0;

      // Position of node center in canvas coordinates (unscaled)
      const nodeCenterX = (nodeRect.left + nodeRect.width / 2 - canvasRect.left) / currentScale;
      const nodeCenterY = (nodeRect.top + nodeRect.height / 2 - canvasRect.top) / currentScale;

      // New pan offsets to place node center at container center
      state.panX = Math.round((containerRect.width / 2) - (nodeCenterX * currentScale));
      state.panY = Math.round((containerRect.height / 2) - (nodeCenterY * currentScale));

      applyCanvasTransform(canvas);

      node.classList.add('match-camera-focus-pulse');
      setTimeout(() => {
        node.classList.remove('match-camera-focus-pulse');
      }, 2500);
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
    if (!containerEl || !canvasEl) return;

    // Mouse Dragging
    containerEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, input, select, textarea, .canvas-controls, .corner-match-widget, .btn-slot-lock, .btn-slot-edit, .match-node, .match-team-row, [draggable="true"]')) return;
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
      state.isDraggingSlot = false;
    });

    // Touch Dragging & Pinch-Zoom for Tablets & Smartphones (Fixes locked bracket on tablets)
    let touchStartDist = 0;
    let initialZoom = 1;

    containerEl.addEventListener('touchstart', (e) => {
      // Do not block dragging when touching card body; only block when touching interactive buttons/inputs or draggable slots
      if (e.target.closest('button, input, select, textarea, .canvas-controls, .corner-match-widget, .btn-slot-lock, .btn-slot-edit, [draggable="true"]')) return;

      if (e.touches.length === 1) {
        // 1-finger panning
        state.isDraggingCanvas = true;
        state.dragStartX = e.touches[0].clientX - state.panX;
        state.dragStartY = e.touches[0].clientY - state.panY;
      } else if (e.touches.length === 2) {
        // 2-finger pinch zoom
        state.isDraggingCanvas = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.hypot(dx, dy);
        initialZoom = state.zoomLevel;
      }
    }, { passive: false });

    containerEl.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && state.isDraggingCanvas) {
        e.preventDefault(); // Prevent page pull/scroll
        state.panX = e.touches[0].clientX - state.dragStartX;
        state.panY = e.touches[0].clientY - state.dragStartY;
        applyCanvasTransform(canvasEl);
      } else if (e.touches.length === 2 && touchStartDist > 0) {
        e.preventDefault(); // Prevent browser pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const scaleFactor = currentDist / touchStartDist;
        state.zoomLevel = Math.max(0.3, Math.min(2.5, initialZoom * scaleFactor));
        applyCanvasTransform(canvasEl);
      }
    }, { passive: false });

    const endTouchDrag = () => {
      state.isDraggingCanvas = false;
      state.isDraggingSlot = false;
      touchStartDist = 0;
    };

    containerEl.addEventListener('touchend', endTouchDrag);
    containerEl.addEventListener('touchcancel', endTouchDrag);
    window.addEventListener('touchend', endTouchDrag);
    window.addEventListener('touchcancel', endTouchDrag);

    // Mouse wheel zoom
    containerEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
      handleZoom(zoomFactor, canvasEl);
    }, { passive: false });
  }

  // ==================== MODAL HELPERS ====================
  function openModal(modalEl) {
    state.isDraggingCanvas = false;
    state.isDraggingSlot = false;
    modalEl.classList.remove('hidden');
  }

  function closeModal(modalEl) {
    state.isDraggingCanvas = false;
    state.isDraggingSlot = false;
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
    if (el.btnBackDashboard) {
      el.btnBackDashboard.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        loadDashboard();
      });
    }

    // Language switchers across all views
    document.querySelectorAll('.btn-lang-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nextLang = state.lang === 'zh' ? 'id' : 'zh';
        setLanguage(nextLang);
        showToast(nextLang === 'zh' ? '已切换至中文' : 'Bahasa diganti ke Indonesia', 'success');
      });
    });

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

    // Match Queue Drawer Triggers & Controls
    document.querySelectorAll('.btn-open-queue-drawer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMatchQueueDrawer();
      });
    });

    if (el.btnCloseQueueDrawer) {
      el.btnCloseQueueDrawer.addEventListener('click', closeMatchQueueDrawer);
    }

    if (el.matchQueueDrawerOverlay) {
      el.matchQueueDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === el.matchQueueDrawerOverlay) {
          closeMatchQueueDrawer();
        }
      });
    }

    // Escape key closes queue drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.matchQueueDrawerOverlay && !el.matchQueueDrawerOverlay.classList.contains('hidden')) {
        closeMatchQueueDrawer();
      }
    });

    if (el.btnQueueTabActive) {
      el.btnQueueTabActive.addEventListener('click', () => switchQueueTab('active'));
    }

    if (el.btnQueueTabFinished) {
      el.btnQueueTabFinished.addEventListener('click', () => switchQueueTab('finished'));
    }

    if (el.btnToggleCompactAll) {
      el.btnToggleCompactAll.addEventListener('click', () => {
        state.queueCompactAll = !state.queueCompactAll;
        state.queueCardsCollapsed.clear();
        renderQueueDrawer();
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
    if (el.btnOpenLiveView) {
      el.btnOpenLiveView.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        if (state.currentTournament) navigateToLive(state.currentTournament.id);
      });
    }

    // Drawer Tabs (Teams, Format, Themes, Reports)
    document.querySelectorAll('.rail-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panelId = btn.dataset.panel;
        if (panelId === 'reports') {
          openStudioReportView();
          return;
        }
        closeStudioReportView();

        document.querySelectorAll('.rail-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.drawer-panel').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(`panel-${panelId}`);
        if (target) target.classList.add('active');

        el.studioDrawer.classList.remove('collapsed');
        if (el.btnFloatingDrawerToggle) el.btnFloatingDrawerToggle.classList.add('hidden');
      });
    });

    if (el.btnDrawerCollapse) {
      el.btnDrawerCollapse.addEventListener('click', () => {
        const isCollapsed = el.studioDrawer.classList.toggle('collapsed');
        if (el.btnFloatingDrawerToggle) {
          el.btnFloatingDrawerToggle.classList.toggle('hidden', !isCollapsed);
        }
      });
    }

    if (el.btnFloatingDrawerToggle) {
      el.btnFloatingDrawerToggle.addEventListener('click', () => {
        el.studioDrawer.classList.remove('collapsed');
        el.btnFloatingDrawerToggle.classList.add('hidden');
      });
    }

    // Drawer Participant Search & Pagination
    if (el.drawerParticipantSearch) {
      el.drawerParticipantSearch.addEventListener('input', () => {
        state.drawerParticipants.search = el.drawerParticipantSearch.value;
        state.drawerParticipants.page = 1;
        if (el.btnClearDrawerSearch) {
          el.btnClearDrawerSearch.style.display = el.drawerParticipantSearch.value ? 'block' : 'none';
        }
        renderParticipantsDrawer();
      });
    }

    if (el.btnClearDrawerSearch) {
      el.btnClearDrawerSearch.addEventListener('click', () => {
        el.drawerParticipantSearch.value = '';
        state.drawerParticipants.search = '';
        state.drawerParticipants.page = 1;
        el.btnClearDrawerSearch.style.display = 'none';
        renderParticipantsDrawer();
      });
    }

    if (el.btnDrawerPrevPage) {
      el.btnDrawerPrevPage.addEventListener('click', () => {
        if (state.drawerParticipants.page > 1) {
          state.drawerParticipants.page--;
          renderParticipantsDrawer();
        }
      });
    }

    if (el.btnDrawerNextPage) {
      el.btnDrawerNextPage.addEventListener('click', () => {
        state.drawerParticipants.page++;
        renderParticipantsDrawer();
      });
    }

    if (el.drawerPageSizeSelect) {
      el.drawerPageSizeSelect.addEventListener('change', () => {
        state.drawerParticipants.pageSize = el.drawerPageSizeSelect.value;
        state.drawerParticipants.page = 1;
        renderParticipantsDrawer();
      });
    }

    if (el.btnDrawerFullReport) {
      el.btnDrawerFullReport.addEventListener('click', () => openStudioReportView());
    }

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
    if (el.btnQuickStatusSave) el.btnQuickStatusSave.addEventListener('click', handleQuickStatusSave);
    el.btnDirectWinP1.addEventListener('click', () => handleDirectWin('p1'));
    el.btnDirectWinP2.addEventListener('click', () => handleDirectWin('p2'));
    el.btnClearMatchResult.addEventListener('click', handleResetMatchResult);

    // Studio Reports View Listeners
    if (el.btnStudioOpenReport) {
      el.btnStudioOpenReport.addEventListener('click', () => openStudioReportView());
    }
    if (el.btnCloseReportView) {
      el.btnCloseReportView.addEventListener('click', () => closeStudioReportView());
    }
    if (el.btnReportExportCsv) {
      el.btnReportExportCsv.addEventListener('click', exportParticipantsCSV);
    }
    if (el.btnReportPrint) {
      el.btnReportPrint.addEventListener('click', () => window.print());
    }
    if (el.reportSearchInput) {
      el.reportSearchInput.addEventListener('input', () => {
        state.reportFilter.search = el.reportSearchInput.value;
        state.reportFilter.page = 1;
        renderParticipantReports();
      });
    }
    document.querySelectorAll('.report-filter').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.report-filter').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.reportFilter.filter = chip.dataset.filter;
        state.reportFilter.page = 1;
        renderParticipantReports();
      });
    });

    const changeReportPage = (delta) => {
      state.reportFilter.page += delta;
      renderParticipantReports();
      const tableCard = document.querySelector('.report-table-card');
      if (tableCard) tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (el.btnReportPrevPage) el.btnReportPrevPage.addEventListener('click', () => changeReportPage(-1));
    if (el.btnReportNextPage) el.btnReportNextPage.addEventListener('click', () => changeReportPage(1));
    if (el.btnReportTopPrevPage) el.btnReportTopPrevPage.addEventListener('click', () => changeReportPage(-1));
    if (el.btnReportTopNextPage) el.btnReportTopNextPage.addEventListener('click', () => changeReportPage(1));

    if (el.reportPageSizeSelect) {
      el.reportPageSizeSelect.addEventListener('change', () => {
        const val = el.reportPageSizeSelect.value;
        state.reportFilter.pageSize = val === 'all' ? 'all' : (parseInt(val, 10) || 30);
        state.reportFilter.page = 1;
        renderParticipantReports();
      });
    }

    // Edit Report Participant Modal Listeners
    if (el.btnAddEditPartner) {
      el.btnAddEditPartner.addEventListener('click', () => {
        activeEditPartners.push({ name: '', dept: '', wecom: '' });
        renderEditPartnersList();
        const inputs = el.editReportPartnersContainer.querySelectorAll('.edit-partner-name');
        if (inputs.length > 0) inputs[inputs.length - 1].focus();
      });
    }

    if (el.formEditReportParticipant) {
      el.formEditReportParticipant.addEventListener('submit', handleSaveEditedParticipant);
    }

    // Logs Panel Export & Filter Listeners
    if (el.btnExportLogs) {
      el.btnExportLogs.addEventListener('click', exportLogsCSV);
    }
    document.querySelectorAll('.log-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeLogFilter = btn.dataset.filter || 'all';
        renderLogsDrawer();
      });
    });

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

    // QR Registration Status Toggle
    if (el.btnToggleRegStatus) {
      el.btnToggleRegStatus.addEventListener('click', async () => {
        const targetId = activeQrTournamentId || state.currentTournament?.id;
        if (!targetId) return;

        let t = (state.tournaments && state.tournaments.find(item => item.id === targetId)) || (state.currentTournament?.id === targetId ? state.currentTournament : null);
        if (!t) return;

        const isCurrentlyClosed = !!(t.isLocked || t.isRegistrationClosed || (t.registrationDeadline && Date.now() > new Date(t.registrationDeadline).getTime()));
        const isZh = state.lang === 'zh';

        try {
          if (isCurrentlyClosed) {
            // Re-open registration
            const updates = {
              isRegistrationClosed: false,
              registrationDeadline: null
            };
            const res = await fetch(`/api/tournaments/${targetId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            t.isRegistrationClosed = false;
            t.registrationDeadline = null;
            if (state.currentTournament && state.currentTournament.id === targetId) {
              state.currentTournament.isRegistrationClosed = false;
              state.currentTournament.registrationDeadline = null;
            }
            if (state.tournaments) {
              const idx = state.tournaments.findIndex(item => item.id === targetId);
              if (idx !== -1) {
                state.tournaments[idx].isRegistrationClosed = false;
                state.tournaments[idx].registrationDeadline = null;
              }
            }
            if (el.qrDeadlinePreset) el.qrDeadlinePreset.value = 'none';
            if (el.qrDeadlineCustom) el.qrDeadlineCustom.classList.add('hidden');

            refreshQrModalStatusUI(t);
            renderDashboardTournaments();
            showToast(isZh ? '报名通道已重新开启！' : 'Pendaftaran berhasil dibuka kembali!', 'success');
          } else {
            // Close registration
            const updates = {
              isRegistrationClosed: true
            };
            const res = await fetch(`/api/tournaments/${targetId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            t.isRegistrationClosed = true;
            if (state.currentTournament && state.currentTournament.id === targetId) {
              state.currentTournament.isRegistrationClosed = true;
            }
            if (state.tournaments) {
              const idx = state.tournaments.findIndex(item => item.id === targetId);
              if (idx !== -1) {
                state.tournaments[idx].isRegistrationClosed = true;
              }
            }

            refreshQrModalStatusUI(t);
            renderDashboardTournaments();
            showToast(isZh ? '报名通道已立即关闭！' : 'Pendaftaran berhasil ditutup!', 'warning');
          }
        } catch (err) {
          showToast('Error: ' + err.message, 'error');
        }
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
      el.btnSaveQrDeadline.addEventListener('click', async () => {
        const targetId = activeQrTournamentId || state.currentTournament?.id;
        if (!targetId) {
          showToast('Turnamen tidak ditemukan.', 'error');
          return;
        }

        let t = (state.tournaments && state.tournaments.find(item => item.id === targetId)) || (state.currentTournament?.id === targetId ? state.currentTournament : null);

        const val = el.qrDeadlinePreset.value;
        let newDeadline = null;
        if (val === 'none') {
          newDeadline = null;
        } else if (val === 'custom') {
          if (!el.qrDeadlineCustom.value) {
            showToast(state.lang === 'zh' ? '请选择自定义截止时间！' : 'Pilih tanggal dan jam custom terlebih dahulu!', 'warning');
            return;
          }
          newDeadline = new Date(el.qrDeadlineCustom.value).toISOString();
        } else {
          const mins = parseInt(val, 10);
          newDeadline = new Date(Date.now() + mins * 60000).toISOString();
        }

        try {
          const res = await fetch(`/api/tournaments/${targetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registrationDeadline: newDeadline,
              isRegistrationClosed: false
            })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);

          if (t) {
            t.registrationDeadline = newDeadline;
            t.isRegistrationClosed = false;
          }
          if (state.currentTournament && state.currentTournament.id === targetId) {
            state.currentTournament.registrationDeadline = newDeadline;
            state.currentTournament.isRegistrationClosed = false;
          }
          if (state.tournaments) {
            const idx = state.tournaments.findIndex(item => item.id === targetId);
            if (idx !== -1) {
              state.tournaments[idx].registrationDeadline = newDeadline;
              state.tournaments[idx].isRegistrationClosed = false;
            }
          }

          refreshQrModalStatusUI(t || data.tournament);
          renderDashboardTournaments();
          showToast(state.lang === 'zh' ? '扫码报名截止时间已保存！' : 'Batas waktu pendaftaran QR berhasil disimpan!', 'success');
        } catch (err) {
          showToast('Gagal menyimpan: ' + err.message, 'error');
        }
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

    // Public Viewer Portal Listeners
    if (el.btnLiveBackPortal) {
      el.btnLiveBackPortal.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        window.history.pushState({}, '', '/');
        loadViewerPortal();
      });
    }

    if (el.portalSearchInput) {
      el.portalSearchInput.addEventListener('input', renderViewerPortalTournaments);
    }

    document.querySelectorAll('.portal-filter').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.portal-filter').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderViewerPortalTournaments();
      });
    });

    // Initialize CSV Uploader (drag-and-drop & file selection)
    setupCsvUploader();

    // Generic Modal Close Buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById(btn.dataset.close);
        if (modal) closeModal(modal);
      });
    });

    // Close modal when clicking on overlay background (ignore if data-no-backdrop-close="true")
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (overlay.dataset.noBackdropClose === 'true') return;
        if (e.target === overlay) closeModal(overlay);
      });
    });
  }

  // ==================== DRAWER RESIZING ====================
  function setupDrawerResize() {
    const handle = el.drawerResizeHandle;
    const drawer = el.studioDrawer;
    if (!handle || !drawer) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    const onStart = (clientX) => {
      isResizing = true;
      startX = clientX;
      startWidth = drawer.getBoundingClientRect().width;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      handle.classList.add('resizing');
    };

    const onMove = (clientX) => {
      if (!isResizing) return;
      const dx = clientX - startX;
      const minW = 340; // Cannot shrink below current width
      const maxW = Math.max(minW, Math.floor(window.innerWidth * 0.5)); // Up to 50% width
      const newWidth = Math.min(maxW, Math.max(minW, startWidth + dx));
      drawer.style.width = `${newWidth}px`;
    };

    const onEnd = () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      handle.classList.remove('resizing');
    };

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onStart(e.clientX);
    });

    handle.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('touchmove', (e) => {
      if (isResizing && e.touches.length === 1) {
        onMove(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
