/* ===========================================
   CivicMind AI — Application Logic
   Gemini + Vertex AI + BigQuery Simulation
   =========================================== */

'use strict';

/* ---------- GLOBAL STATE ---------- */
let charts = {};
let currentAlertFilter = 'all';
let currentModel = 'traffic';
let currentRegion = 'mumbai';
let queryCount = 0;
let mapInstance = null;
let mapLayers = { traffic: [], aqi: [], health: [], energy: [] };
let layerVisibility = { traffic: true, aqi: true, health: true, energy: true };

/* ---------- MUMBAI DATA ---------- */
const MUMBAI_DATA = {
  traffic: {
    hours: ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'],
    flow:  [1100,750,560,490,680,1300,2900,4600,4200,3400,3000,3300,3700,3200,3000,3600,4300,4800,4100,3300,2700,2100,1700,1300],
    accidents:[1,0,0,0,1,2,4,9,7,5,3,4,6,4,3,5,7,11,8,5,4,3,2,1]
  },
  aqi: { days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], values:[78,84,97,113,91,73,66] },
  energy: {
    hours: ['00','02','04','06','08','10','12','14','16','18','20','22'],
    grid:  [820,690,610,740,1240,1580,1720,1660,1590,1750,1440,1100],
    renew: [0,0,0,80,310,490,540,480,420,180,40,0]
  },
  health: {
    hospitals:['City General','Mem. Hosp.','St. Mary\'s','Central Care','Kokilaben','Lilavati'],
    wait:[48,31,71,36,22,58]
  },
  stats: { citizens:2847293, alerts:7, decisions:43, accuracy:94.2 },
  region: 'Mumbai Metropolitan Region',
  mapCenter: [19.076, 72.877], mapZoom: 12
};

/* ---------- RAJASTHAN DATA ---------- */
const RAJASTHAN_DATA = {
  traffic: {
    hours: ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'],
    flow:  [420,270,200,170,280,680,1800,3100,2800,2300,2000,1800,1900,1700,1500,1700,2500,3000,2700,2100,1600,1100,780,520],
    accidents:[0,0,0,0,0,1,3,6,5,3,2,2,3,2,2,3,5,7,5,3,2,1,1,0]
  },
  aqi: { days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], values:[142,168,195,210,183,156,134] },
  energy: {
    hours: ['00','02','04','06','08','10','12','14','16','18','20','22'],
    grid:  [450,380,340,420,720,980,1100,1050,980,850,680,520],
    renew: [0,0,0,120,380,680,820,760,610,230,40,0]
  },
  health: {
    hospitals:['SMS Hospital','MG Hospital','Kota Medical','Udaipur RNT','Jodhpur MDM','Ajmer JLN'],
    wait:[62,45,78,38,52,41]
  },
  stats: { citizens:8100000, alerts:9, decisions:38, accuracy:93.8 },
  region: 'Rajasthan State (Jaipur HQ)',
  mapCenter: [26.9124, 75.7873], mapZoom: 8
};

/* ---------- ACTIVE DATA HELPER ---------- */
const DATA = MUMBAI_DATA; // default, overridden by currentRegion
function getRegionData() { return currentRegion === 'rajasthan' ? RAJASTHAN_DATA : MUMBAI_DATA; }

/* ---------- TECH STACK DATA ---------- */
const TECH_STACK = [
  {
    icon:'🤖', iconBg:'rgba(99,102,241,.15)', accentColor:'var(--indigo)',
    name:'Gemini 1.5 Pro', category:'Large Language Model', version:'Google DeepMind',
    desc:'Foundation LLM powering CivicChat natural language understanding, RAG-based civic Q&A, and AI recommendation generation for city officials and planners.',
    uses:['CivicChat: NL Q&A over 18 civic datasets','DecisionAssist: AI recommendation engine','Alert summarization + actionable insights','Multimodal satellite imagery understanding'],
    metric:{label:'API Calls Today', value:'1,247', color:'var(--indigo)'}
  },
  {
    icon:'📈', iconBg:'rgba(168,85,247,.15)', accentColor:'var(--purple)',
    name:'Vertex AI AutoML', category:'Predictive Analytics', version:'Google Cloud',
    desc:'Automated machine learning for 7-day time-series forecasting of traffic, healthcare demand, energy consumption, and air quality across Mumbai and Rajasthan.',
    uses:['PredictEngine: Traffic flow 7-day forecast','Energy demand & renewable prediction','Healthcare surge & capacity planning','AQI trend + desert dust storm prediction'],
    metric:{label:'Models Active', value:'4', color:'var(--purple)'}
  },
  {
    icon:'🔍', iconBg:'rgba(34,211,238,.15)', accentColor:'var(--cyan)',
    name:'Vertex AI Embeddings', category:'RAG Pipeline', version:'text-embedding-004',
    desc:'Semantic vector embeddings enabling Retrieval Augmented Generation (RAG) over BigQuery civic datasets for precise, source-attributed AI answers in CivicChat.',
    uses:['CivicChat: Query vectorization for RAG','Semantic search over civic documents','Alert deduplication and clustering','Related policy document retrieval'],
    metric:{label:'Vectors Indexed', value:'2.4M', color:'var(--cyan)'}
  },
  {
    icon:'👁️', iconBg:'rgba(16,185,129,.15)', accentColor:'var(--emerald)',
    name:'Vertex AI Vision', category:'Multimodal AI', version:'Gemini Vision API',
    desc:'Computer vision and multimodal AI for satellite imagery analysis, CCTV traffic monitoring, factory emission detection, and tourist crowd density estimation.',
    uses:['GeoView: Satellite imagery classification','Traffic congestion detection from CCTV','AQI factory emission spike detection','Tourist crowd density at heritage sites'],
    metric:{label:'Images Analyzed Today', value:'8,432', color:'var(--emerald)'}
  },
  {
    icon:'⚙️', iconBg:'rgba(245,158,11,.15)', accentColor:'var(--amber)',
    name:'Agent Dev Kit (ADK)', category:'AI Agent Orchestration', version:'ADK v1.0 · Google Cloud',
    desc:'Multi-agent framework for autonomously executing civic workflows — from bus route optimization and waste management to emergency response coordination.',
    uses:['Overnight bus route reoptimization','Emergency resource pre-positioning','Waste collection route automation','Water tanker dispatch optimization (Rajasthan)'],
    metric:{label:'Workflows Automated Today', value:'43', color:'var(--amber)'}
  },
  {
    icon:'📊', iconBg:'rgba(56,189,248,.15)', accentColor:'var(--sky)',
    name:'BigQuery', category:'Data Warehouse & ML', version:'Google Cloud',
    desc:'Petabyte-scale data warehouse storing and analyzing 18 civic data streams. BigQuery ML enables in-database machine learning for real-time anomaly detection.',
    uses:['Dashboard: Real-time civic metrics','RAG knowledge base over civic data','BigQuery ML anomaly detection alerts','Historical pattern mining for forecasting'],
    metric:{label:'Queries/Day', value:'182K', color:'var(--sky)'}
  },
  {
    icon:'🚀', iconBg:'rgba(244,63,94,.15)', accentColor:'var(--rose)',
    name:'Cloud Run + Functions', category:'Serverless Deployment', version:'Google Cloud',
    desc:'Fully managed serverless platform hosting the CivicMind API backend. Cloud Functions handle event-driven sensor data ingestion from 2,847+ IoT devices.',
    uses:['AI inference API for CivicChat','Real-time sensor data pipeline','Alert notification dispatch system','WebSocket live dashboard updates'],
    metric:{label:'Uptime', value:'99.97%', color:'var(--rose)'}
  },
  {
    icon:'🔥', iconBg:'rgba(245,158,11,.12)', accentColor:'var(--amber)',
    name:'Firebase Hosting', category:'Global Deployment', version:'Google Cloud CDN',
    desc:'Global CDN deployment serving the CivicMind AI frontend with sub-100ms load times worldwide, automatic HTTPS, and instant CI/CD deployment pipeline.',
    uses:['civicmind-ai-apac.web.app live deployment','Global CDN — 170+ edge locations','HTTPS-secured application delivery','Instant one-command deployment'],
    metric:{label:'Global Edge Locations', value:'170+', color:'var(--amber)'}
  }
];

const PREDICT_DATA = {
  traffic: {
    labels: ['Day -6','Day -5','Day -4','Day -3','Day -2','Yesterday','Today','Day +1','Day +2','Day +3','Day +4','Day +5','Day +6'],
    hist:   [3400,3600,3100,3800,3500,3900,4200,null,null,null,null,null,null],
    pred:   [null,null,null,null,null,null,4200,4350,4100,4500,4250,4600,4400],
    upper:  [null,null,null,null,null,null,4200,4620,4370,4790,4520,4900,4680],
    lower:  [null,null,null,null,null,null,4200,4080,3830,4210,3980,4300,4120],
    title: '🚦 Traffic Flow Forecast', sub: '7-day vehicle count projection · BigQuery ML',
    mape:'4.8%', acc:'95.2%', dp:'2.4M', lat:'0.8s', ret:'6h ago'
  },
  energy: {
    labels: ['Day -6','Day -5','Day -4','Day -3','Day -2','Yesterday','Today','Day +1','Day +2','Day +3','Day +4','Day +5','Day +6'],
    hist:   [1580,1620,1490,1710,1560,1740,1720,null,null,null,null,null,null],
    pred:   [null,null,null,null,null,null,1720,1680,1750,1800,1650,1720,1690],
    upper:  [null,null,null,null,null,null,1720,1780,1860,1900,1740,1810,1780],
    lower:  [null,null,null,null,null,null,1720,1580,1640,1700,1560,1630,1600],
    title: '⚡ Energy Demand Forecast', sub: '7-day grid load projection · Vertex AI AutoML',
    mape:'3.1%', acc:'96.9%', dp:'1.8M', lat:'0.5s', ret:'4h ago'
  },
  health: {
    labels: ['Day -6','Day -5','Day -4','Day -3','Day -2','Yesterday','Today','Day +1','Day +2','Day +3','Day +4','Day +5','Day +6'],
    hist:   [38,42,35,47,40,44,41,null,null,null,null,null,null],
    pred:   [null,null,null,null,null,null,41,45,43,50,38,42,39],
    upper:  [null,null,null,null,null,null,41,52,50,57,44,48,45],
    lower:  [null,null,null,null,null,null,41,38,36,43,32,36,33],
    title: '🏥 Healthcare Wait Time Forecast', sub: '7-day avg. wait minutes projection',
    mape:'6.2%', acc:'93.8%', dp:'980K', lat:'1.1s', ret:'2h ago'
  },
  aqi: {
    labels: ['Day -6','Day -5','Day -4','Day -3','Day -2','Yesterday','Today','Day +1','Day +2','Day +3','Day +4','Day +5','Day +6'],
    hist:   [72,84,91,108,88,76,89,null,null,null,null,null,null],
    pred:   [null,null,null,null,null,null,89,82,76,71,68,74,80],
    upper:  [null,null,null,null,null,null,89,95,89,84,79,87,93],
    lower:  [null,null,null,null,null,null,89,69,63,58,57,61,67],
    title: '🌿 Air Quality Index Forecast', sub: '7-day AQI prediction using satellite + sensor fusion',
    mape:'5.4%', acc:'94.6%', dp:'3.1M', lat:'1.4s', ret:'1h ago'
  }
};

const ALERTS = [
  { id:1, type:'crit', icon:'🚨', title:'Critical Traffic Congestion — Eastern Expressway',
    meta:[{i:'📍',t:'Eastern Expressway, Mumbai'},{i:'🕐',t:'09:42 AM'},{i:'🤖',t:'Auto-detected'}],
    desc:'AI detected 340% above-normal traffic density. Average speed dropped to 4 km/h. Estimated 120-minute delay. Gemini recommends immediate signal re-timing and alternate route broadcast.',
    actions:['Acknowledge','Reroute Traffic','View on Map'] },
  { id:2, type:'crit', icon:'⚠️', title:'Air Quality Emergency — Dharavi Zone',
    meta:[{i:'📍',t:'Dharavi Industrial Zone'},{i:'🕐',t:'08:15 AM'},{i:'🌿',t:'AQI: 187 (Very Unhealthy)'}],
    desc:'PM2.5 levels breached WHO threshold 4.7x. Industrial emissions spike detected via satellite imagery. Vertex AI Vision flagged 3 non-compliant factory stacks. Immediate action required.',
    actions:['Issue Alert','Notify Authority','View Data'] },
  { id:3, type:'warn', icon:'⚡', title:'Grid Overload Risk — Bandra Substation',
    meta:[{i:'📍',t:'Bandra West Substation'},{i:'🕐',t:'11:20 AM'},{i:'⚡',t:'94% capacity'}],
    desc:'Smart grid telemetry shows 94% load on Bandra-Kurla substation. Peak demand expected in 2 hours. PredictEngine forecasts potential brownout between 1-3 PM. Load balancing recommended.',
    actions:['Acknowledge','Balance Load','Details'] },
  { id:4, type:'warn', icon:'🏥', title:'Hospital Capacity Alert — St. Mary\'s',
    meta:[{i:'📍',t:'St. Mary\'s Hospital, Mazagaon'},{i:'🕐',t:'10:05 AM'},{i:'🛏️',t:'91% bed occupancy'}],
    desc:'Emergency ward at 91% capacity. Wait time increased to 71 minutes — 98th percentile. AI recommends diverting non-critical patients to Kokilaben (22 min wait) and Lilavati facilities.',
    actions:['Acknowledge','Divert Patients','Contact Hospital'] },
  { id:5, type:'warn', icon:'🌧️', title:'Flash Flood Risk — Mithi River Zone',
    meta:[{i:'📍',t:'Mithi River Catchment'},{i:'🕐',t:'07:30 AM'},{i:'🌡️',t:'High Rainfall Forecast'}],
    desc:'IMD rainfall data combined with Gemini climate model shows 73% probability of flash flooding in low-lying Kurla and Sion areas within 6 hours. Pre-emptive evacuation advisory recommended.',
    actions:['Issue Advisory','Alert Residents','View Map'] },
  { id:6, type:'info', icon:'🚌', title:'Route Optimization Complete — Bus Network',
    meta:[{i:'📍',t:'City-wide Bus BRTS'},{i:'🕐',t:'06:00 AM'},{i:'🤖',t:'ADK Agent'}],
    desc:'CivicMind AI Agent (built on ADK) successfully recalibrated 47 bus routes using overnight traffic data. Expected improvement: 18% fewer delays, 12% fuel savings across the network.',
    actions:['View Routes','Download Report'] },
  { id:7, type:'info', icon:'♻️', title:'Waste Collection Route Optimized',
    meta:[{i:'📍',t:'Zone 3 — Andheri West'},{i:'🕐',t:'05:45 AM'},{i:'🤖',t:'Gemini Agent'}],
    desc:'AI analyzed 3 months of collection data and sensor fill-levels to optimize 23 vehicle routes in Zone 3. Estimated 22% reduction in fuel consumption and 15% increase in collection efficiency.',
    actions:['View Analysis','Implement Now'] }
];

const DECISIONS = [
  { domain:'transport', priority:'high', icon:'🚦', iconBg:'rgba(99,102,241,.15)',
    title:'Peak-Hour Bus Frequency Boost', cat:'Urban Mobility · High Priority',
    desc:'Analysis of 6 months of ridership and congestion data reveals a 34% gap in public transport capacity during 7:30–9:30 AM. Increasing bus frequency by 40% on 12 key routes will reduce road congestion by an estimated 18%.',
    steps:['Deploy 34 additional BEST buses on Routes 11, 21, 37','Adjust signal timing at 18 key intersections','Launch real-time bus tracking on CivicApp','Monitor KPIs for 4 weeks and iterate'],
    impacts:[{v:'18%',l:'Less Congestion'},{v:'₹2.1Cr',l:'Monthly Savings'},{v:'40K',l:'New Riders/Day'}] },
  { domain:'health', priority:'high', icon:'🏥', iconBg:'rgba(244,63,94,.15)',
    title:'Mobile Health Unit Deployment', cat:'Healthcare Access · High Priority',
    desc:'Healthcare demand mapping reveals 8 underserved wards with >45 min hospital travel time. Deploying 6 mobile health units to these zones will bring primary care to 180,000 citizens currently without easy access.',
    steps:['Identify 8 priority deployment zones via GeoView','Commission 6 mobile health units with telehealth','Schedule weekly rotational service','Integrate with Hospital HMS for referrals'],
    impacts:[{v:'180K',l:'Citizens Reached'},{v:'45%',l:'Faster Care'},{v:'6',l:'New Units'}] },
  { domain:'env', priority:'medium', icon:'🌿', iconBg:'rgba(16,185,129,.15)',
    title:'Green Corridor Initiative — Phase 2', cat:'Environmental Sustainability · Medium Priority',
    desc:'Satellite imagery analysis and AQI sensor data identify 12 km of road corridors where tree plantation can reduce localized AQI by 20–30%. This builds on Phase 1 success in Powai and BKC areas.',
    steps:['Survey 12 km of Eastern and Western corridors','Plant 8,000 native trees in identified zones','Install 40 new AQI sensors for impact monitoring','Issue carbon credit claim via GCP Environmental API'],
    impacts:[{v:'22%',l:'AQI Reduction'},{v:'8K',l:'Trees Planted'},{v:'₹80L',l:'Carbon Credits'}] },
  { domain:'energy', priority:'medium', icon:'⚡', iconBg:'rgba(245,158,11,.15)',
    title:'Smart Street Light Optimization', cat:'Energy Efficiency · Medium Priority',
    desc:'IoT sensor data from 48,000 street lights shows 31% are operating at full brightness during low-pedestrian hours. AI-driven adaptive dimming can save an estimated ₹4.2 Crore annually in electricity costs.',
    steps:['Install motion sensors on 12,000 pilot lights','Deploy adaptive brightness control firmware','Monitor safety metrics for 60 days','Scale to remaining 36,000 lights if KPIs met'],
    impacts:[{v:'31%',l:'Energy Saved'},{v:'₹4.2Cr',l:'Annual Savings'},{v:'CO₂ -800T',l:'Emissions Cut'}] },
  { domain:'safety', priority:'high', icon:'🚨', iconBg:'rgba(244,63,94,.15)',
    title:'Predictive Policing Hotspot Patrol', cat:'Public Safety · High Priority',
    desc:'Gemini analysis of 3 years of incident reports, CCTV data, and social signals identifies 9 micro-zones with elevated incident probability this weekend. Pre-positioning patrol units reduces incident rates by up to 34%.',
    steps:['Brief 9 patrol units on target micro-zones','Activate CCTV AI monitoring on identified areas','Set up community alert via SMS Gateway','Measure incident rate vs. control zones'],
    impacts:[{v:'34%',l:'Incident Reduction'},{v:'9',l:'Hotspot Zones'},{v:'60K',l:'Citizens Protected'}] },
  { domain:'transport', priority:'low', icon:'🚲', iconBg:'rgba(34,211,238,.15)',
    title:'Cycle Lane Network Expansion', cat:'Urban Mobility · Long-Term Planning',
    desc:'Citizen survey data (18,000 respondents) and traffic flow analysis show strong demand for protected cycling infrastructure on 8 key corridors. A 25 km expansion would connect major employment and transit hubs.',
    steps:['Conduct detailed feasibility study for 8 corridors','Engage with civic bodies for road space allocation','Pilot 5 km in BKC-CST corridor','Evaluate ridership and plan full rollout'],
    impacts:[{v:'25 km',l:'New Cycle Lanes'},{v:'22K',l:'Daily Cyclists'},{v:'18%',l:'Mode Shift'} ]}
];

/* ---------- CHART DEFAULTS ---------- */
const CHART_DEFAULTS = {
  plugins: { legend: { display: false }, tooltip: {
    backgroundColor: 'rgba(9,15,31,0.95)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    titleColor: '#f1f5f9',
    bodyColor: '#94a3b8',
    padding: 12,
    cornerRadius: 8
  }},
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 11 } } }
  },
  animation: { duration: 800, easing: 'easeInOutQuart' },
  responsive: true,
  maintainAspectRatio: false
};

/* ---------- CHART.JS GLOBAL ---------- */
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

/* ============ INIT ============ */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
});

function initLoader() {
  const messages = [
    'Initializing AI systems...',
    'Connecting to BigQuery datasets...',
    'Loading Vertex AI models...',
    'Syncing city sensors (2,847 active)...',
    'Launching Gemini RAG pipeline...',
    'CivicMind AI ready!'
  ];
  let i = 0;
  const statusEl = document.getElementById('loader-status');
  const interval = setInterval(() => {
    if (i < messages.length) {
      statusEl.textContent = messages[i++];
    } else {
      clearInterval(interval);
    }
  }, 280);

  setTimeout(() => {
    document.getElementById('app-loader').classList.add('hidden');
    document.getElementById('app').classList.add('visible');
    initApp();
  }, 1900);
}

function initApp() {
  startClock();
  animateStats();
  initDashboardCharts();
  loadAlerts();
  renderDecisions();
  initChatWelcome();
  initPredictChart();
  renderTechStack();

  document.querySelector('[data-view="geo"]').addEventListener('click', () => {
    setTimeout(() => { if (!mapInstance) initMap(); }, 100);
  });
  setInterval(refreshLiveData, 60000);
}

/* ============ REGION SWITCHER ============ */
function switchRegion(region) {
  currentRegion = region;
  const rd = getRegionData();

  // Update subtitle
  const sub = document.getElementById('page-subtitle');
  if (sub) sub.textContent = `Real-time analytics · ${rd.region}`;

  // Update stat targets
  animateCount('stat-citizens', rd.stats.citizens, v => v.toLocaleString('en-IN'));
  animateCount('stat-alerts',   rd.stats.alerts,   v => v.toString());
  animateCount('stat-decisions',rd.stats.decisions, v => v.toString());
  animateAccuracy('stat-accuracy', rd.stats.accuracy);

  // Update badge count
  const badge = document.getElementById('alert-count-badge');
  if (badge) badge.textContent = rd.stats.alerts;

  // Refresh charts
  updateChartsForRegion(rd);

  // Refresh alerts
  loadAlerts();

  // Reset map
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    Object.keys(mapLayers).forEach(k => mapLayers[k] = []);
  }

  // Update geo sidebar info
  updateGeoSidebar(rd);

  showToast(`🗺️ Switched to ${rd.region} data`);
}

function updateGeoSidebar(rd) {
  if (currentRegion === 'rajasthan') {
    const el = document.querySelector('.geo-stat-item:first-child .geo-stat-val');
    // silently update if geo sidebar exists
  }
}

function updateChartsForRegion(rd) {
  if (!charts.traffic) return;

  charts.traffic.data.labels = rd.traffic.hours;
  charts.traffic.data.datasets[0].data = rd.traffic.flow;
  charts.traffic.update();

  charts.aqi.data.labels = rd.aqi.days;
  charts.aqi.data.datasets[0].data = rd.aqi.values;
  charts.aqi.data.datasets[0].backgroundColor = rd.aqi.values.map(v =>
    v > 150 ? 'rgba(244,63,94,0.7)' : v > 100 ? 'rgba(245,158,11,0.7)' : 'rgba(16,185,129,0.7)'
  );
  charts.aqi.data.datasets[0].borderColor = rd.aqi.values.map(v =>
    v > 150 ? '#f43f5e' : v > 100 ? '#f59e0b' : '#10b981'
  );
  charts.aqi.update();

  charts.energy.data.labels = rd.energy.hours;
  charts.energy.data.datasets[0].data = rd.energy.grid;
  charts.energy.data.datasets[1].data = rd.energy.renew;
  charts.energy.update();

  charts.health.data.labels = rd.health.hospitals;
  charts.health.data.datasets[0].data = rd.health.wait;
  charts.health.data.datasets[0].backgroundColor = rd.health.wait.map(v =>
    v > 60 ? 'rgba(244,63,94,0.7)' : v > 40 ? 'rgba(245,158,11,0.7)' : 'rgba(16,185,129,0.7)'
  );
  charts.health.data.datasets[0].borderColor = rd.health.wait.map(v =>
    v > 60 ? '#f43f5e' : v > 40 ? '#f59e0b' : '#10b981'
  );
  charts.health.update();
}

/* ============ CLOCK ============ */
function startClock() {
  const update = () => {
    const now = new Date();
    document.getElementById('live-clock').textContent =
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' IST';
  };
  update();
  setInterval(update, 1000);
}

/* ============ NAVIGATION ============ */
function switchView(viewId, navEl) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const view = document.getElementById('view-' + viewId);
  if (view) view.classList.add('active');
  if (navEl) navEl.classList.add('active');
  else {
    const matchNav = document.querySelector(`[data-view="${viewId}"]`);
    if (matchNav) matchNav.classList.add('active');
  }

  const rd = getRegionData();
  const titles = {
    dashboard: ['City Intelligence Dashboard', `Real-time analytics · ${rd.region}`],
    chat:      ['CivicChat AI', 'Natural language interface · Gemini + RAG over BigQuery'],
    predict:   ['PredictEngine', 'AI forecasting · Vertex AI AutoML · 7-day horizon'],
    alerts:    ['Alert Radar', 'Anomaly detection · Cloud Functions + Gemini monitoring'],
    decisions: ['DecisionAssist', 'AI recommendations · Gemini Pro + city KPIs'],
    geo:       ['GeoView — City Intelligence Map', `Spatial analytics · ${rd.region}`],
    techstack: ['AI Technology Stack', '8 Google Cloud AI services powering CivicMind']
  };
  const [title, sub] = titles[viewId] || ['CivicMind AI', ''];
  document.getElementById('page-title').childNodes[0].textContent = title;
  document.getElementById('page-subtitle').textContent = sub;

  if (viewId === 'geo' && !mapInstance) {
    setTimeout(() => initMap(), 200);
  }
}

/* ============ STAT COUNTER ANIMATION ============ */
function animateStats() {
  const rd = getRegionData();
  animateCount('stat-citizens', rd.stats.citizens, v => v.toLocaleString('en-IN'));
  animateCount('stat-alerts',   rd.stats.alerts,   v => v.toString());
  animateCount('stat-decisions',rd.stats.decisions, v => v.toString());
  animateAccuracy('stat-accuracy', rd.stats.accuracy);
}

function animateCount(id, target, formatter) {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const duration = 1800;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = formatter(Math.floor(start));
    if (start >= target) clearInterval(timer);
  }, 16);
}

function animateAccuracy(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let v = 0;
  const timer = setInterval(() => {
    v = Math.min(v + 0.8, target);
    el.textContent = v.toFixed(1) + '%';
    if (v >= target) clearInterval(timer);
  }, 20);
}

/* ============ DASHBOARD CHARTS ============ */
function initDashboardCharts() {
  const grad = (ctx, c1, c2) => {
    const g = ctx.createLinearGradient(0, 0, 0, 200);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  };

  const rd = getRegionData();
  // Traffic
  const ctxT = document.getElementById('chart-traffic').getContext('2d');
  charts.traffic = new Chart(ctxT, {
    type: 'line',
    data: {
      labels: rd.traffic.hours,
      datasets: [{
        data: rd.traffic.flow,
        borderColor: '#6366f1',
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0,0,0,200);
          g.addColorStop(0,'rgba(99,102,241,0.25)');
          g.addColorStop(1,'rgba(99,102,241,0.01)');
          return g;
        },
        borderWidth: 2, fill: true, tension: 0.4,
        pointRadius: 0, pointHoverRadius: 5,
        pointHoverBackgroundColor: '#6366f1'
      }]
    },
    options: { ...CHART_DEFAULTS }
  });

  // AQI
  const ctxA = document.getElementById('chart-aqi').getContext('2d');
  charts.aqi = new Chart(ctxA, {
    type: 'bar',
    data: {
      labels: rd.aqi.days,
      datasets: [{
        data: rd.aqi.values,
        backgroundColor: rd.aqi.values.map(v =>
          v > 150 ? 'rgba(244,63,94,0.7)' : v > 100 ? 'rgba(245,158,11,0.7)' : 'rgba(16,185,129,0.7)'
        ),
        borderColor: rd.aqi.values.map(v =>
          v > 150 ? '#f43f5e' : v > 100 ? '#f59e0b' : '#10b981'
        ),
        borderWidth: 1, borderRadius: 5
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        annotation: {}
      }
    }
  });

  // Energy
  const ctxE = document.getElementById('chart-energy').getContext('2d');
  charts.energy = new Chart(ctxE, {
    type: 'line',
    data: {
      labels: rd.energy.hours,
      datasets: [
        {
          label: 'Grid Load',
          data: rd.energy.grid,
          borderColor: '#f59e0b', borderWidth: 2, fill: true,
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0,0,0,200);
            g.addColorStop(0,'rgba(245,158,11,0.2)');
            g.addColorStop(1,'rgba(245,158,11,0.01)');
            return g;
          },
          tension: 0.4, pointRadius: 0
        },
        {
          label: 'Renewable',
          data: rd.energy.renew,
          borderColor: '#10b981', borderWidth: 2, fill: true,
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0,0,0,200);
            g.addColorStop(0,'rgba(16,185,129,0.2)');
            g.addColorStop(1,'rgba(16,185,129,0.01)');
            return g;
          },
          tension: 0.4, pointRadius: 0
        }
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: {
          display: true,
          labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 10 }
        }
      }
    }
  });

  // Healthcare
  const ctxH = document.getElementById('chart-health').getContext('2d');
  charts.health = new Chart(ctxH, {
    type: 'bar',
    data: {
      labels: rd.health.hospitals,
      datasets: [{
        data: rd.health.wait,
        backgroundColor: rd.health.wait.map(v =>
          v > 60 ? 'rgba(244,63,94,0.7)' : v > 40 ? 'rgba(245,158,11,0.7)' : 'rgba(16,185,129,0.7)'
        ),
        borderColor: rd.health.wait.map(v =>
          v > 60 ? '#f43f5e' : v > 40 ? '#f59e0b' : '#10b981'
        ),
        borderWidth: 1, borderRadius: 5
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      indexAxis: 'y',
      scales: {
        x: { ...CHART_DEFAULTS.scales.x, title: { display: true, text: 'Wait Time (minutes)', color: '#475569' } },
        y: { grid: { display: false }, ticks: { color: '#475569', font: { size: 11 } } }
      }
    }
  });
}

/* ============ PREDICT CHART ============ */
function initPredictChart() {
  const ctx = document.getElementById('chart-predict').getContext('2d');
  const d = PREDICT_DATA[currentModel];
  charts.predict = new Chart(ctx, {
    type: 'line',
    data: buildPredictDatasets(d),
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: {
          display: true,
          labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 10 }
        }
      }
    }
  });
  updatePredictStats(d);
}

function buildPredictDatasets(d) {
  return {
    labels: d.labels,
    datasets: [
      {
        label: 'Historical',
        data: d.hist,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        borderWidth: 2.5, fill: true, tension: 0.4,
        pointRadius: 4, pointBackgroundColor: '#6366f1', spanGaps: false
      },
      {
        label: 'Predicted',
        data: d.pred,
        borderColor: '#f59e0b',
        borderDash: [6,4],
        backgroundColor: 'rgba(245,158,11,0.06)',
        borderWidth: 2.5, fill: true, tension: 0.4,
        pointRadius: 4, pointBackgroundColor: '#f59e0b', spanGaps: false
      },
      {
        label: 'Confidence Band',
        data: d.upper,
        borderColor: 'transparent',
        backgroundColor: 'rgba(245,158,11,0.08)',
        fill: '+1', tension: 0.4, pointRadius: 0, spanGaps: false
      },
      {
        label: '',
        data: d.lower,
        borderColor: 'transparent',
        backgroundColor: 'rgba(245,158,11,0.08)',
        fill: false, tension: 0.4, pointRadius: 0, spanGaps: false
      }
    ]
  };
}

function switchModel(model, btn) {
  currentModel = model;
  document.querySelectorAll('.model-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  updateForecast();
}

function updateForecast() {
  const d = PREDICT_DATA[currentModel];
  charts.predict.data = buildPredictDatasets(d);
  charts.predict.update();
  document.getElementById('predict-chart-title').textContent = d.title;
  document.getElementById('predict-chart-sub').textContent = d.sub;
  updatePredictStats(d);
}

function updatePredictStats(d) {
  document.getElementById('ps-mape').textContent = d.mape;
  document.getElementById('ps-accuracy').textContent = d.acc;
  document.getElementById('ps-datapoints').textContent = d.dp;
  document.getElementById('ps-latency').textContent = d.lat;
  document.getElementById('ps-retrain').textContent = d.ret;
}

/* ============ RAJASTHAN ALERTS ============ */
const RAJASTHAN_ALERTS = [
  { id:101, type:'crit', icon:'🌡️', title:'Extreme Heatwave Warning — Barmer & Jaisalmer',
    meta:[{i:'📍',t:'Western Rajasthan'},{i:'🕐',t:'11:00 AM'},{i:'🌡️',t:'48.2°C recorded'}],
    desc:'Vertex AI climate model predicts 48–50°C temperatures in Barmer, Jaisalmer, Bikaner for next 72 hours. 3.2 million citizens at risk. CivicMind recommends opening 142 government cooling shelters immediately.',
    actions:['Issue Heatwave Alert','Open Shelters','Notify NDRF'] },
  { id:102, type:'crit', icon:'💧', title:'Bisalpur Dam Critical — 12% Capacity',
    meta:[{i:'📍',t:'Bisalpur Reservoir, Tonk'},{i:'🕐',t:'08:30 AM'},{i:'💧',t:'12% of 1,086 MCM'}],
    desc:'Bisalpur dam (primary water source for Jaipur city) at 12% capacity — lowest in 8 years. AI water model predicts shortage for 3.5M Jaipur citizens within 6 weeks. Emergency rationing and tanker deployment required.',
    actions:['Emergency Rationing','Deploy Tankers','Alert Citizens'] },
  { id:103, type:'warn', icon:'🏰', title:'Tourist Overcrowding — Amber Fort',
    meta:[{i:'📍',t:'Amber Fort, Jaipur'},{i:'🕐',t:'10:15 AM'},{i:'👥',t:'8,247 visitors (164% capacity)'}],
    desc:'Vertex AI Vision CCTV analysis detects 8,247 visitors against 5,000 capacity at Amber Fort. Crowd density in main courtyard at critical level. Gemini recommends implementing timed entry slots immediately.',
    actions:['Limit Entry','Issue Advisory','View GeoView'] },
  { id:104, type:'warn', icon:'🌪️', title:'Dust Storm Alert — Thar Desert Edge',
    meta:[{i:'📍',t:'Jodhpur & Bikaner Districts'},{i:'🕐',t:'09:45 AM'},{i:'🌿',t:'AQI: 210 (Hazardous)'}],
    desc:'ISRO satellite data + IMD wind models show large dust wall approaching from Pakistan border. AQI at 210 in Jodhpur (Hazardous). Gemini climate model predicts 72% probability of storm reaching Jaipur by evening.',
    actions:['Issue Storm Alert','PM2.5 Advisory','Monitor AQI'] },
  { id:105, type:'warn', icon:'☀️', title:'Bhadla Solar Farm Peak — Grid Balancing Needed',
    meta:[{i:'📍',t:'Bhadla Solar Park, Jodhpur'},{i:'🕐',t:'12:00 PM'},{i:'⚡',t:'2,100 MW generation'}],
    desc:'Bhadla Solar Park generating 2,100 MW — 93.5% of capacity. Grid absorption capacity at risk. CivicMind PredictEngine suggests shifting 320 MW to neighboring states via interstate grid in next 2 hours.',
    actions:['Grid Balancing','Export Power','View Dashboard'] },
  { id:106, type:'info', icon:'🌾', title:'Kharif Irrigation Schedule Optimized',
    meta:[{i:'📍',t:'Chambal Canal Command Area'},{i:'🕐',t:'05:00 AM'},{i:'🤖',t:'ADK Agent'}],
    desc:'CivicMind ADK Agent analyzed 340 sensor readings from Chambal irrigation network overnight. Optimized water release schedule for 1,240 farmers across 3 districts. Expected 15% water savings vs. manual scheduling.',
    actions:['View Schedule','Notify Farmers'] },
  { id:107, type:'info', icon:'🏛️', title:'Heritage Site AI Monitoring Active',
    meta:[{i:'📍',t:'Pink City, Jaipur'},{i:'🕐',t:'07:00 AM'},{i:'👁️',t:'Vertex AI Vision'}],
    desc:'Vertex AI Vision has been activated across 12 CCTV feeds at Hawa Mahal, City Palace, and Jantar Mantar. Real-time crowd counting and suspicious activity detection live. Tourist police alerted with AI heatmap.',
    actions:['View Feed','Download Report'] }
];

/* ============ ALERTS ============ */
function loadAlerts() {
  // Update filter counts based on region
  const alerts = currentRegion === 'rajasthan' ? RAJASTHAN_ALERTS : ALERTS;
  const crit = alerts.filter(a => a.type === 'crit').length;
  const warn = alerts.filter(a => a.type === 'warn').length;
  const info = alerts.filter(a => a.type === 'info').length;
  const filterBtns = document.querySelectorAll('.filter-tab');
  if (filterBtns[0]) filterBtns[0].textContent = `All Alerts (${alerts.length})`;
  if (filterBtns[1]) filterBtns[1].textContent = `🔴 Critical (${crit})`;
  if (filterBtns[2]) filterBtns[2].textContent = `🟡 Warning (${warn})`;
  if (filterBtns[3]) filterBtns[3].textContent = `🔵 Info (${info})`;
  renderAlerts(currentAlertFilter);
}

function filterAlerts(type, btn) {
  currentAlertFilter = type;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderAlerts(type);
}

function renderAlerts(filter) {
  const grid = document.getElementById('alerts-grid');
  const activeAlerts = currentRegion === 'rajasthan' ? RAJASTHAN_ALERTS : ALERTS;
  const filtered = filter === 'all' ? activeAlerts : activeAlerts.filter(a => a.type === filter);
  grid.innerHTML = '';
  filtered.forEach((a, idx) => {
    const card = document.createElement('div');
    card.className = `alert-card ${a.type}`;
    card.style.animationDelay = `${idx * 0.06}s`;
    card.innerHTML = `
      <div class="alert-top">
        <div class="alert-title-wrap">
          <span class="alert-icon">${a.icon}</span>
          <div>
            <div class="alert-title">${a.title}</div>
            <div class="alert-meta">
              ${a.meta.map(m => `<span class="alert-meta-item">${m.i} ${m.t}</span>`).join('')}
            </div>
          </div>
        </div>
        <span class="badge badge-${a.type === 'crit' ? 'critical' : a.type === 'warn' ? 'warning' : 'info'}">
          ${a.type === 'crit' ? 'CRITICAL' : a.type === 'warn' ? 'WARNING' : 'INFO'}
        </span>
      </div>
      <div class="alert-desc">${a.desc}</div>
      <div class="alert-actions">
        ${a.actions.map((ac, i) => `<button class="btn btn-sm ${i===0 ? 'btn-primary' : 'btn-ghost'}" onclick="alertAction('${ac}',${a.id})">${ac}</button>`).join('')}
      </div>`;
    grid.appendChild(card);
  });
}

function alertAction(action, id) {
  const alert = ALERTS.find(a => a.id === id);
  if (action === 'Acknowledge') {
    showToast(`✅ Alert acknowledged by AI system`);
  } else if (action === 'View on Map' || action === 'View Map') {
    switchView('geo', document.querySelector('[data-view="geo"]'));
  } else {
    showToast(`🤖 AI executing: ${action}...`);
  }
}

/* ============ DECISIONS ============ */
function renderDecisions() {
  const domain = document.getElementById('decision-context').value;
  const grid = document.getElementById('decisions-grid');
  const filtered = domain === 'all' ? DECISIONS : DECISIONS.filter(d => d.domain === domain);
  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="card" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary)">
      <div style="font-size:2rem;margin-bottom:12px">🔍</div>
      <div>No recommendations for this domain yet. AI is analyzing patterns...</div>
    </div>`;
    return;
  }

  filtered.forEach((d, idx) => {
    const card = document.createElement('div');
    card.className = 'decision-card';
    card.style.animationDelay = `${idx * 0.08}s`;
    card.innerHTML = `
      <div class="decision-header">
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div class="decision-icon" style="background:${d.iconBg}">${d.icon}</div>
          <div>
            <div class="decision-title">${d.title}</div>
            <div class="decision-category">${d.cat}</div>
          </div>
        </div>
        <span class="badge badge-${d.priority === 'high' ? 'critical' : d.priority === 'medium' ? 'warning' : 'info'}">
          ${d.priority.toUpperCase()}
        </span>
      </div>
      <div class="decision-desc">${d.desc}</div>
      <div class="decision-steps">
        <div class="decision-steps-title">Implementation Steps</div>
        ${d.steps.map((s,i) => `<div class="step-item"><div class="step-num">${i+1}</div><div>${s}</div></div>`).join('')}
      </div>
      <div class="impact-metrics">
        ${d.impacts.map(imp => `<div class="impact-item"><div class="impact-value">${imp.v}</div><div class="impact-label">${imp.l}</div></div>`).join('')}
      </div>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="implementDecision('${d.title}')">
          ⚡ Implement
        </button>
        <button class="btn btn-ghost btn-sm" onclick="showToast('📋 Report generated and saved to BigQuery')">
          Export
        </button>
      </div>`;
    grid.appendChild(card);
  });
}

function implementDecision(title) {
  showToast(`🤖 CivicMind AI Agent (ADK) is implementing: ${title.substring(0,35)}...`);
}

/* ============ CIVIC CHAT ============ */
const AI_RESPONSES = [
  {
    kw: ['traffic','congestion','road','commute','delay','drive','jam'],
    reply: `**🚦 Traffic Intelligence Report**

Based on live analysis from **847 city traffic sensors** via BigQuery:

| Corridor | Status | Speed | ETA Impact |
|---|---|---|---|
| Eastern Expressway | 🔴 Severe | 4 km/h | +120 min |
| Western Express Hwy | 🟡 Moderate | 28 km/h | +18 min |
| LBS Marg | 🟢 Clear | 45 km/h | Normal |
| NH-48 Bypass | 🟢 Clear | 52 km/h | Normal |

**🤖 AI Recommendation**: Reroute via NH-48 Bypass. Historical patterns (94.2% confidence) show 34% reduction in commute time.

Peak congestion window: **5:30 PM – 8:30 PM** today (AI forecast with ±12 min accuracy).`,
    sources: ['Traffic Sensor Network','Google Maps API','Historical Pattern DB','Vertex AI Prediction']
  },
  {
    kw: ['air','aqi','pollution','quality','pm2.5','smoke','environment'],
    reply: `**🌿 Air Quality Intelligence Report**

Real-time AQI from **312 monitoring stations** across Mumbai:

| Zone | AQI | Status | Primary Pollutant |
|---|---|---|---|
| Dharavi | 187 | 🔴 Very Unhealthy | PM2.5 |
| Andheri | 112 | 🟡 Unhealthy | PM10 |
| Bandra | 78 | 🟢 Moderate | NO₂ |
| Powai | 61 | 🟢 Good | — |

**🤖 AI Recommendation**: Issue public health advisory for Dharavi zone. Satellite imagery (Vertex AI Vision) detected 3 non-compliant industrial stacks. Enforcement action advised.

City AQI trend: **Improving** — expected to reach 75 by 6 PM with wind pattern shift.`,
    sources: ['AQI Sensor Grid','Satellite Imagery (Vertex AI Vision)','IMD Weather API','Historical Data']
  },
  {
    kw: ['hospital','health','wait','doctor','medical','emergency','bed'],
    reply: `**🏥 Healthcare System Intelligence**

Current status from **47 hospitals** in the HMS network:

| Hospital | Wait Time | Beds Available | Status |
|---|---|---|---|
| City General | 48 min | 12 | 🟡 Busy |
| St. Mary's | 71 min | 3 | 🔴 Critical |
| Kokilaben | 22 min | 47 | 🟢 Available |
| Lilavati | 31 min | 28 | 🟢 Available |
| LTMG Hospital | 55 min | 8 | 🟡 Busy |

**🤖 AI Recommendation**: Divert non-emergency patients from St. Mary's to **Kokilaben (22 min wait)** or **Lilavati (31 min wait)**. CivicMind agent can auto-issue patient redirection advisory.

Next 6-hour prediction: Surge expected at City General between 3–5 PM (AI confidence: 88%).`,
    sources: ["Hospital HMS API","HealthOS Patient Data","Ambulance GPS Network","Vertex AI Forecast"]
  },
  {
    kw: ['energy','power','electricity','grid','blackout','brownout','solar'],
    reply: `**⚡ Smart Grid Intelligence Report**

Live telemetry from **2,200 grid sensors** and **340 smart meters**:

| Substation | Load | Renewable % | Status |
|---|---|---|---|
| Bandra-Kurla | 94% | 18% | 🔴 Overload Risk |
| Andheri North | 71% | 32% | 🟡 Moderate |
| Thane West | 58% | 41% | 🟢 Stable |
| Navi Mumbai | 49% | 55% | 🟢 Good |

**⚡ Total City Grid**: 1,720 MW load · 28% renewable share today

**🤖 AI Recommendation**: Load-balance Bandra-Kurla substation by shifting 180 MW to Thane West. Solar generation expected to increase by 40 MW at 2 PM. Brownout risk: 73% between 1–3 PM if no action taken.`,
    sources: ['Smart Grid Telemetry','Solar SCADA System','BigQuery Energy Dataset','Vertex AI Forecast']
  },
  {
    kw: ['bus','train','transport','metro','route','public','commute','ptc'],
    reply: `**🚌 Public Transport Intelligence**

Real-time status across all transit modes in Mumbai:

| Mode | Routes Active | On-Time % | Avg. Delay |
|---|---|---|---|
| BEST Bus | 267/312 | 71% | 14 min |
| Mumbai Metro (1,2,7) | All active | 94% | 2 min |
| Local Train | 1,452 services | 88% | 6 min |
| Ferry | 8/12 active | 100% | None |

**🚨 Alert**: 45 BEST buses delayed on Route 21 due to Eastern Expressway congestion.

**🤖 AI Action (ADK Agent)**: Overnight AI reoptimized 47 bus routes. Estimated savings: **18% fewer delays**, **12% less fuel**. New routes live from 6 AM tomorrow.`,
    sources: ['BEST GTFS Feed','Metro Operations API','Railway Enquiry System','CivicMind ADK Agent']
  },
  {
    kw: ['flood','rain','weather','monsoon','disaster','cyclone','storm'],
    reply: `**🌧️ Climate Risk Intelligence**

Analysis from **IMD data + CivicMind climate model** (satellite + ground sensors):

**Current Risk Assessment** for next 24 hours:

| Zone | Flood Risk | Probability | Action |
|---|---|---|---|
| Mithi River Catchment | 🔴 HIGH | 73% | Evacuation Advisory |
| Kurla Low-lying | 🟡 MODERATE | 48% | Prepare Pumps |
| Sion Drainage Zone | 🟡 MODERATE | 41% | Monitor |
| Powai Lake Spillway | 🟢 LOW | 12% | No Action |

**🌡️ Rainfall Forecast**: 68mm expected in 6 hours (IMD confidence: 81%)

**🤖 AI Recommendation**: Pre-position 8 NDRF teams in Kurla and Dharavi zones. Issue SMS advisory to 180,000 residents in flood-prone areas via CivicAlert system.`,
    sources: ['IMD Forecast Data','Satellite Imagery','Drainage Sensor Network','Vertex AI Climate Model']
  },
  {
    kw: ['waste','garbage','recycle','sanitation','clean','dump','collection'],
    reply: `**♻️ Waste Management Intelligence**

Data from **IoT fill sensors** in 12,400 public bins across the city:

| Zone | Bins Full >80% | Collection Due | Efficiency |
|---|---|---|---|
| Andheri West | 847 | Next: 45 min | 91% |
| Dharavi | 1,204 | NOW | 74% |
| BKC | 312 | Next: 2.5 hrs | 96% |
| Borivali | 623 | Next: 1.5 hrs | 87% |

**🤖 AI Action**: Gemini Agent dispatched 6 additional vehicles to Dharavi zone. Route optimization (overnight AI run) saved 22% fuel across 23 vehicles in Zone 3.

**Monthly Impact**: 420 tonnes diverted to recycling (↑18% vs. last month).`,
    sources: ['IoT Bin Sensors','MCGM Fleet GPS','Gemini ADK Agent','BigQuery Analytics']
  }
];

const FALLBACK_RESPONSE = {
  reply: `**🤖 CivicMind AI Analysis**

I've searched across **18 civic data streams** in BigQuery and here's what the AI found:

Based on current city data and patterns, I can help you with:
- 🚦 **Traffic**: Real-time congestion, route optimization, signal timing
- 🌿 **Environment**: AQI monitoring, flood risk, climate resilience
- 🏥 **Healthcare**: Wait times, bed availability, health alerts
- ⚡ **Energy**: Grid load, renewable generation, efficiency insights
- 🚌 **Transport**: Bus/metro/train status, route optimization
- 🏛️ **Public Services**: Waste, water, civic complaints

Try asking me something specific like *"What's the traffic like on Eastern Expressway?"* or *"Which hospitals have short wait times?"*

I'm powered by **Gemini 1.5 Pro + RAG** over BigQuery datasets with **94.2% accuracy**.`,
  sources: ['BigQuery Civic DB','Gemini 1.5 Pro','Vertex AI RAG','City Knowledge Base']
};

function initChatWelcome() {
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML = '';
  const welcomeMsg = {
    role: 'ai',
    text: `**👋 Welcome to CivicMind AI!**

I'm your intelligent city assistant powered by **Gemini 1.5 Pro** with RAG over BigQuery civic datasets.

I have real-time access to:
- 🚦 **847** traffic sensors across Mumbai
- 🌿 **312** air quality monitoring stations
- 🏥 **47** hospital systems via HMS API
- ⚡ **2,200** smart grid sensors
- 🚌 **312** BEST bus routes + Metro lines

**How can I help you make a smarter civic decision today?** Try the suggestion chips below or type your question!`,
    sources: ['Vertex AI RAG','BigQuery Datasets','Gemini 1.5 Pro','City Sensor Network']
  };
  appendMessage(welcomeMsg.role, welcomeMsg.text, welcomeMsg.sources);
}

function appendMessage(role, text, sources) {
  const msgs = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = `chat-msg ${role === 'user' ? 'user-msg' : ''}`;
  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  el.innerHTML = `
    <div class="msg-avatar ${role === 'ai' ? 'ai' : 'usr'}">${role === 'ai' ? '🤖' : 'SC'}</div>
    <div class="msg-body">
      <div class="msg-text ${role === 'ai' ? 'ai' : 'user'}">${formatMarkdown(text)}</div>
      <div class="msg-time">${now}</div>
      ${sources && role === 'ai' ? `<div class="msg-sources">${sources.map(s => `<span class="source-chip">📡 ${s}</span>`).join('')}</div>` : ''}
    </div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(99,102,241,.15);padding:1px 5px;border-radius:4px;font-size:.85em">$1</code>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|/g, (m, c1, c2, c3, c4) =>
      `<tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:5px 10px;color:#94a3b8">${c1.trim()}</td><td style="padding:5px 10px">${c2.trim()}</td><td style="padding:5px 10px">${c3.trim()}</td><td style="padding:5px 10px">${c4.trim()}</td></tr>`
    )
    .replace(/\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|/g, (m, c1, c2, c3) =>
      `<tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:5px 10px;color:#94a3b8">${c1.trim()}</td><td style="padding:5px 10px">${c2.trim()}</td><td style="padding:5px 10px">${c3.trim()}</td></tr>`
    )
    .replace(/<tr/g, (_, i) => `<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:.82rem"><tr`)
    .replace(/<\/tr>/g, '</tr></table>');
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

function sendSuggestion(el) {
  const text = el.textContent.replace(/^[^\s]+\s/, '');
  document.getElementById('chat-input').value = text;
  sendChatMessage();
}

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  appendMessage('user', text, null);
  queryCount++;
  const qEl = document.getElementById('query-count');
  if (qEl) qEl.textContent = queryCount;

  document.getElementById('typing-indicator').style.display = 'block';
  const msgs = document.getElementById('chat-messages');
  msgs.scrollTop = msgs.scrollHeight;

  const delay = 1200 + Math.random() * 800;
  setTimeout(() => {
    document.getElementById('typing-indicator').style.display = 'none';
    const lower = text.toLowerCase();
    const match = AI_RESPONSES.find(r => r.kw.some(k => lower.includes(k)));
    const resp = match || FALLBACK_RESPONSE;
    appendMessage('ai', resp.reply, resp.sources);
  }, delay);
}

function clearChat() {
  initChatWelcome();
  queryCount = 0;
  const qEl = document.getElementById('query-count');
  if (qEl) qEl.textContent = '0';
}

/* ============ GEO MAP ============ */
function initMap() {
  if (mapInstance) return;

  mapInstance = L.map('civic-map', { zoomControl: false, attributionControl: false }).setView([19.076, 72.877], 12);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '', maxZoom: 19
  }).addTo(mapInstance);

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  const trafficPoints = [
    { pos:[19.0545,72.9376], label:'Eastern Expressway', status:'🔴 Severe Congestion', speed:'4 km/h', color:'#f43f5e' },
    { pos:[19.1197,72.8468], label:'Western Expressway - Andheri', status:'🟡 Moderate', speed:'28 km/h', color:'#f59e0b' },
    { pos:[19.0176,72.8562], label:'Marine Drive', status:'🟢 Clear', speed:'52 km/h', color:'#10b981' },
    { pos:[19.0659,72.8362], label:'Bandra-Worli Sea Link', status:'🟡 Light Traffic', speed:'70 km/h', color:'#f59e0b' },
    { pos:[19.0986,72.8492], label:'Santacruz Junction', status:'🔴 Heavy', speed:'8 km/h', color:'#f43f5e' }
  ];

  const aqiPoints = [
    { pos:[19.0421,72.8512], label:'Dharavi AQI Station', aqi:187, level:'Very Unhealthy', color:'#f43f5e' },
    { pos:[19.1136,72.8697], label:'Andheri AQI Station', aqi:112, level:'Unhealthy', color:'#f59e0b' },
    { pos:[19.0596,72.8295], label:'Bandra AQI Station', aqi:78, level:'Moderate', color:'#f59e0b' },
    { pos:[19.1197,72.9088], label:'Powai AQI Station', aqi:61, level:'Good', color:'#10b981' }
  ];

  const healthPoints = [
    { pos:[19.0388,72.8457], label:'LTMG Hospital', beds:8, wait:'55 min', color:'#10b981' },
    { pos:[19.0710,72.8335], label:'KEM Hospital', beds:24, wait:'41 min', color:'#10b981' },
    { pos:[19.1062,72.8268], label:'Kokilaben Hospital', beds:47, wait:'22 min', color:'#10b981' },
    { pos:[19.0576,72.8305], label:'Lilavati Hospital', beds:28, wait:'31 min', color:'#f59e0b' },
    { pos:[19.0183,72.8553], label:'St. Mary\'s Hospital', beds:3, wait:'71 min', color:'#f43f5e' }
  ];

  const energyPoints = [
    { pos:[19.0627,72.8545], label:'Bandra-Kurla Substation', load:'94%', status:'🔴 Overload Risk', color:'#f43f5e' },
    { pos:[19.1237,72.8396], label:'Andheri Substation', load:'71%', status:'🟡 Moderate', color:'#f59e0b' },
    { pos:[19.2183,72.9781], label:'Thane West Substation', load:'58%', status:'🟢 Stable', color:'#10b981' },
    { pos:[19.0330,73.0297], label:'Navi Mumbai Grid', load:'49%', status:'🟢 Good', color:'#10b981' }
  ];

  function makeIcon(color, emoji) {
    return L.divIcon({
      html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:13px;border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 10px ${color}88">${emoji}</div>`,
      iconSize: [28,28], iconAnchor: [14,14], className: ''
    });
  }

  trafficPoints.forEach(p => {
    const m = L.marker(p.pos, { icon: makeIcon(p.color, '🚦') }).addTo(mapInstance);
    m.bindPopup(`<strong style="color:#f1f5f9">${p.label}</strong><br><span style="color:#94a3b8">Status: ${p.status}</span><br><span style="color:#94a3b8">Avg Speed: ${p.speed}</span>`);
    mapLayers.traffic.push(m);
  });

  aqiPoints.forEach(p => {
    const m = L.marker(p.pos, { icon: makeIcon(p.color, '🌿') }).addTo(mapInstance);
    m.bindPopup(`<strong style="color:#f1f5f9">${p.label}</strong><br><span style="color:#94a3b8">AQI: <strong style="color:${p.color}">${p.aqi}</strong></span><br><span style="color:#94a3b8">Level: ${p.level}</span>`);
    mapLayers.aqi.push(m);
  });

  healthPoints.forEach(p => {
    const m = L.marker(p.pos, { icon: makeIcon(p.color, '🏥') }).addTo(mapInstance);
    m.bindPopup(`<strong style="color:#f1f5f9">${p.label}</strong><br><span style="color:#94a3b8">Wait: <strong style="color:${p.color}">${p.wait}</strong></span><br><span style="color:#94a3b8">Beds Available: ${p.beds}</span>`);
    mapLayers.health.push(m);
  });

  energyPoints.forEach(p => {
    const m = L.marker(p.pos, { icon: makeIcon(p.color, '⚡') }).addTo(mapInstance);
    m.bindPopup(`<strong style="color:#f1f5f9">${p.label}</strong><br><span style="color:#94a3b8">Load: <strong style="color:${p.color}">${p.load}</strong></span><br><span style="color:#94a3b8">${p.status}</span>`);
    mapLayers.energy.push(m);
  });
}

function toggleLayer(layer, btn) {
  btn.classList.toggle('active');
  layerVisibility[layer] = !layerVisibility[layer];
  if (!mapInstance) return;
  mapLayers[layer].forEach(m => {
    if (layerVisibility[layer]) mapInstance.addLayer(m);
    else mapInstance.removeLayer(m);
  });
}

/* ============ LIVE DATA REFRESH ============ */
function refreshLiveData() {
  if (charts.traffic) {
    const rd = getRegionData();
    charts.traffic.data.datasets[0].data = rd.traffic.flow.map(v =>
      Math.max(200, v + (Math.random() - 0.5) * 250)
    );
    charts.traffic.update('none');
  }
}

function refreshData() {
  refreshLiveData();
  showToast('🔄 City data refreshed from BigQuery');
}

/* ============ EXPORT ============ */
function exportReport() {
  showToast('📊 Generating PDF report via Cloud Run... Download will start shortly.');
}

/* ============ TOAST NOTIFICATION ============ */
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position:fixed; bottom:28px; right:28px; z-index:9998;
    background:rgba(9,15,31,0.97); border:1px solid rgba(99,102,241,.35);
    border-radius:12px; padding:14px 20px;
    color:#f1f5f9; font-size:.88rem; font-family:'Inter',sans-serif;
    box-shadow:0 8px 32px rgba(0,0,0,.6);
    display:flex; align-items:center; gap:10px;
    animation:fadeInUp .3s ease;
    max-width:400px; line-height:1.4;
    backdrop-filter:blur(12px);
  `;
  toast.innerHTML = `<span style="font-size:1rem">${message.split(' ')[0]}</span><span>${message.substring(message.indexOf(' ')+1)}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all .3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ============ TECH STACK VIEW ============ */
function renderTechStack() {
  const grid = document.getElementById('tech-grid');
  if (!grid) return;
  grid.innerHTML = '';

  TECH_STACK.forEach((tool, idx) => {
    const card = document.createElement('div');
    card.className = 'tech-card';
    card.style.animationDelay = `${idx * 0.07}s`;
    card.style.animation = 'fadeInUp 0.4s ease both';
    card.style.borderTop = `2px solid ${tool.accentColor}`;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:52px;height:52px;border-radius:14px;background:${tool.iconBg};display:grid;place-items:center;font-size:24px;flex-shrink:0;border:1px solid ${tool.accentColor}22">${tool.icon}</div>
          <div>
            <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:1rem;margin-bottom:3px">${tool.name}</div>
            <div style="font-size:.72rem;color:var(--text-muted)">${tool.version}</div>
          </div>
        </div>
        <span class="badge badge-live" style="flex-shrink:0;font-size:.65rem">● Active</span>
      </div>
      <div style="display:inline-block;font-size:.68rem;padding:2px 8px;border-radius:99px;background:${tool.iconBg};border:1px solid ${tool.accentColor}33;color:${tool.accentColor};margin-bottom:10px;font-weight:600">${tool.category}</div>
      <div style="font-size:.83rem;color:var(--text-secondary);line-height:1.65;margin-bottom:14px">${tool.desc}</div>
      <div style="font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:8px">Used For in CivicMind AI</div>
      <div style="margin-bottom:14px">
        ${tool.uses.map(u => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:.8rem;color:var(--text-secondary)">
            <span style="width:6px;height:6px;border-radius:50%;background:${tool.accentColor};flex-shrink:0"></span>
            ${u}
          </div>`).join('')}
      </div>
      <div style="padding:10px 14px;border-radius:8px;background:${tool.iconBg};border:1px solid ${tool.accentColor}22;display:flex;justify-content:space-between;align-items:center;font-size:.8rem">
        <span style="color:var(--text-secondary)">${tool.metric.label}</span>
        <span style="font-weight:700;font-size:1rem;color:${tool.metric.color}">${tool.metric.value}</span>
      </div>`;
    grid.appendChild(card);
  });
}

/* ============ INIT MAP with REGION ============ */
function initMap() {
  if (mapInstance) return;
  const rd = getRegionData();

  mapInstance = L.map('civic-map', { zoomControl: false, attributionControl: false })
    .setView(rd.mapCenter, rd.mapZoom);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '', maxZoom: 19
  }).addTo(mapInstance);

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  if (currentRegion === 'rajasthan') {
    loadRajasthanMarkers();
  } else {
    loadMumbaiMarkers();
  }
}

function loadMumbaiMarkers() {
  const trafficPoints = [
    { pos:[19.0545,72.9376], label:'Eastern Expressway', status:'🔴 Severe Congestion', speed:'4 km/h', color:'#f43f5e' },
    { pos:[19.1197,72.8468], label:'Western Expressway', status:'🟡 Moderate', speed:'28 km/h', color:'#f59e0b' },
    { pos:[19.0176,72.8562], label:'Marine Drive', status:'🟢 Clear', speed:'52 km/h', color:'#10b981' },
    { pos:[19.0659,72.8362], label:'Bandra-Worli Sea Link', status:'🟡 Light Traffic', speed:'70 km/h', color:'#f59e0b' },
    { pos:[19.0986,72.8492], label:'Santacruz Junction', status:'🔴 Heavy', speed:'8 km/h', color:'#f43f5e' }
  ];
  const aqiPoints = [
    { pos:[19.0421,72.8512], label:'Dharavi AQI Station', aqi:187, level:'Very Unhealthy', color:'#f43f5e' },
    { pos:[19.1136,72.8697], label:'Andheri AQI Station', aqi:112, level:'Unhealthy', color:'#f59e0b' },
    { pos:[19.0596,72.8295], label:'Bandra AQI Station', aqi:78, level:'Moderate', color:'#f59e0b' },
    { pos:[19.1197,72.9088], label:'Powai AQI Station', aqi:61, level:'Good', color:'#10b981' }
  ];
  const healthPoints = [
    { pos:[19.0388,72.8457], label:'LTMG Hospital', beds:8, wait:'55 min', color:'#10b981' },
    { pos:[19.0710,72.8335], label:'KEM Hospital', beds:24, wait:'41 min', color:'#10b981' },
    { pos:[19.1062,72.8268], label:'Kokilaben Hospital', beds:47, wait:'22 min', color:'#10b981' },
    { pos:[19.0576,72.8305], label:'Lilavati Hospital', beds:28, wait:'31 min', color:'#f59e0b' },
    { pos:[19.0183,72.8553], label:'St. Mary\'s Hospital', beds:3, wait:'71 min', color:'#f43f5e' }
  ];
  const energyPoints = [
    { pos:[19.0627,72.8545], label:'Bandra-Kurla Substation', load:'94%', status:'🔴 Overload Risk', color:'#f43f5e' },
    { pos:[19.1237,72.8396], label:'Andheri Substation', load:'71%', status:'🟡 Moderate', color:'#f59e0b' },
    { pos:[19.2183,72.9781], label:'Thane West Substation', load:'58%', status:'🟢 Stable', color:'#10b981' },
    { pos:[19.0330,73.0297], label:'Navi Mumbai Grid', load:'49%', status:'🟢 Good', color:'#10b981' }
  ];
  addMapMarkers(trafficPoints, aqiPoints, healthPoints, energyPoints);
}

function loadRajasthanMarkers() {
  const trafficPoints = [
    { pos:[26.9760,75.8130], label:'Jaipur-Delhi NH-48', status:'🟡 Moderate', speed:'65 km/h', color:'#f59e0b' },
    { pos:[26.8897,75.8100], label:'JLN Marg, Jaipur', status:'🔴 Heavy', speed:'18 km/h', color:'#f43f5e' },
    { pos:[26.8547,75.8000], label:'Tonk Road Junction', status:'🟡 Moderate', speed:'35 km/h', color:'#f59e0b' },
    { pos:[26.9235,75.7400], label:'Ajmer Road', status:'🟢 Clear', speed:'72 km/h', color:'#10b981' },
    { pos:[26.2644,73.0176], label:'Jodhpur City Centre', status:'🟡 Moderate', speed:'40 km/h', color:'#f59e0b' }
  ];
  const aqiPoints = [
    { pos:[26.9124,75.7873], label:'Jaipur AQI Station', aqi:142, level:'Unhealthy', color:'#f59e0b' },
    { pos:[26.2389,73.0243], label:'Jodhpur (Desert Edge)', aqi:210, level:'Hazardous', color:'#f43f5e' },
    { pos:[28.0229,73.3119], label:'Bikaner AQI', aqi:168, level:'Very Unhealthy', color:'#f43f5e' },
    { pos:[25.2138,75.8648], label:'Kota Industrial AQI', aqi:156, level:'Very Unhealthy', color:'#f43f5e' }
  ];
  const healthPoints = [
    { pos:[26.9260,75.8208], label:'SMS Hospital Jaipur', beds:15, wait:'62 min', color:'#f43f5e' },
    { pos:[26.8959,75.8037], label:'MG Hospital Jaipur', beds:28, wait:'45 min', color:'#f59e0b' },
    { pos:[25.1818,75.8389], label:'Kota Medical College', beds:8, wait:'78 min', color:'#f43f5e' },
    { pos:[24.5854,73.7125], label:'RNT Medical Udaipur', beds:32, wait:'38 min', color:'#10b981' },
    { pos:[26.2644,73.0176], label:'Jodhpur MDM Hospital', beds:20, wait:'52 min', color:'#f59e0b' }
  ];
  const energyPoints = [
    { pos:[27.5630,71.9090], label:'Bhadla Solar Park ⭐', load:'88.5%', status:'🟢 Peak Generation', color:'#10b981' },
    { pos:[26.8845,75.7694], label:'Jaipur Main Substation', load:'74%', status:'🟡 Moderate', color:'#f59e0b' },
    { pos:[26.2644,73.0176], label:'Jodhpur Grid Station', load:'61%', status:'🟢 Stable', color:'#10b981' },
    { pos:[26.9000,76.8667], label:'Nokh Solar Farm', load:'89%', status:'🟢 Excellent', color:'#10b981' }
  ];
  addMapMarkers(trafficPoints, aqiPoints, healthPoints, energyPoints);
}

function addMapMarkers(trafficPoints, aqiPoints, healthPoints, energyPoints) {
  function makeIcon(color, emoji) {
    return L.divIcon({
      html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:13px;border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 10px ${color}88">${emoji}</div>`,
      iconSize: [28,28], iconAnchor: [14,14], className: ''
    });
  }
  trafficPoints.forEach(p => {
    const m = L.marker(p.pos, { icon: makeIcon(p.color, '🚦') }).addTo(mapInstance);
    m.bindPopup(`<strong style="color:#f1f5f9">${p.label}</strong><br><span style="color:#94a3b8">Status: ${p.status}</span><br><span style="color:#94a3b8">Speed: ${p.speed}</span>`);
    mapLayers.traffic.push(m);
  });
  aqiPoints.forEach(p => {
    const m = L.marker(p.pos, { icon: makeIcon(p.color, '🌿') }).addTo(mapInstance);
    m.bindPopup(`<strong style="color:#f1f5f9">${p.label}</strong><br><span style="color:#94a3b8">AQI: <strong style="color:${p.color}">${p.aqi}</strong></span><br><span style="color:#94a3b8">Level: ${p.level}</span>`);
    mapLayers.aqi.push(m);
  });
  healthPoints.forEach(p => {
    const m = L.marker(p.pos, { icon: makeIcon(p.color, '🏥') }).addTo(mapInstance);
    m.bindPopup(`<strong style="color:#f1f5f9">${p.label}</strong><br><span style="color:#94a3b8">Wait: <strong style="color:${p.color}">${p.wait}</strong></span><br><span style="color:#94a3b8">Beds: ${p.beds}</span>`);
    mapLayers.health.push(m);
  });
  energyPoints.forEach(p => {
    const m = L.marker(p.pos, { icon: makeIcon(p.color, '⚡') }).addTo(mapInstance);
    m.bindPopup(`<strong style="color:#f1f5f9">${p.label}</strong><br><span style="color:#94a3b8">Load: <strong style="color:${p.color}">${p.load}</strong></span><br><span style="color:#94a3b8">${p.status}</span>`);
    mapLayers.energy.push(m);
  });
}

function toggleLayer(layer, btn) {
  btn.classList.toggle('active');
  layerVisibility[layer] = !layerVisibility[layer];
  if (!mapInstance) return;
  mapLayers[layer].forEach(m => {
    if (layerVisibility[layer]) mapInstance.addLayer(m);
    else mapInstance.removeLayer(m);
  });
}

/* ============ UTILITY ============ */
function implementDecision(title) {
  showToast(`🤖 ADK Agent implementing: ${title.substring(0,40)}...`);
}

