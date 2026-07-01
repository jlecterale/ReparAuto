import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const CWD = process.cwd();

// Helper to run shell commands safely
function runCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (err) {
    return '';
  }
}

// 1. Gather Git Info
const branch = runCmd('git rev-parse --abbrev-ref HEAD') || 'main';
const rawCommits = runCmd('git log --pretty=format:"%h|%an|%ae|%ad|%s" --date=short -n 50') || '';
const commits = rawCommits.split('\n').filter(Boolean).map(line => {
  const [hash, author, email, date, subject] = line.split('|');
  return { hash, author, email, date, subject };
});

const rawContributors = runCmd('git shortlog -sn --all') || '';
const contributors = rawContributors.split('\n').filter(Boolean).map(line => {
  const parts = line.trim().split('\t');
  return {
    commits: parseInt(parts[0], 10),
    name: parts[1]
  };
});

// 2. Fetch GitHub PRs (with local fallback if offline or API limit hit)
let githubPrs = [];
try {
  console.log('Fetching Pull Requests from GitHub API...');
  const res = await fetch('https://api.github.com/repos/jfreirecomercial-blip/ReparAuto/pulls?state=all');
  if (res.ok) {
    const data = await res.json();
    githubPrs = data.map(pr => ({
      number: pr.number,
      state: pr.state,
      title: pr.title,
      user: pr.user.login,
      html_url: pr.html_url,
      created_at: pr.created_at
    }));
  } else {
    throw new Error(`HTTP error ${res.status}`);
  }
} catch (err) {
  console.log('Using local fallback for GitHub PRs list...');
  githubPrs = [
    { number: 16, state: "open", title: "feat: app nativa Android/iOS com Capacitor (codebase partilhada)", user: "flavioislima", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/16", created_at: "2026-06-01T20:11:11Z" },
    { number: 15, state: "closed", title: "Feat/diretorio oficinas", user: "jfreirecomercial-blip", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/15", created_at: "2026-05-31T21:37:40Z" },
    { number: 14, state: "closed", title: "Feat/diretorio oficinas e servicos", user: "jfreirecomercial-blip", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/14", created_at: "2026-05-31T19:24:28Z" },
    { number: 13, state: "open", title: "Feat/adicionar fale conosco", user: "jfreirecomercial-blip", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/13", created_at: "2026-05-31T18:58:27Z" },
    { number: 12, state: "closed", title: "Feat/adicionar fale conosco", user: "jfreirecomercial-blip", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/12", created_at: "2026-05-31T18:56:30Z" },
    { number: 11, state: "closed", title: "feat: categorias nas intencoes de compra + mapa interativo", user: "jfreirecomercial-blip", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/11", created_at: "2026-05-30T22:25:58Z" },
    { number: 10, state: "open", title: "feat: parts ecosystem (structured compatibility, bulk desmonte, matching, price ref)", user: "flavioislima", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/10", created_at: "2026-05-29T19:41:45Z" },
    { number: 9, state: "open", title: "feat: Price Intelligence — avaliação, badges 5 níveis e página de mercado", user: "flavioislima", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/9", created_at: "2026-05-29T19:40:59Z" },
    { number: 8, state: "closed", title: "feat: permitir editar fotos ao editar um anúncio", user: "flavioislima", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/8", created_at: "2026-05-29T19:39:03Z" },
    { number: 7, state: "closed", title: "feat: UI and brand updates", user: "biliesilva", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/7", created_at: "2026-05-29T19:25:09Z" },
    { number: 6, state: "closed", title: "Migrate from Vite SPA to Next.js 15 App Router", user: "flavioislima", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/6", created_at: "2026-05-28T12:21:09Z" },
    { number: 5, state: "closed", title: "Add geographic data and location-based filtering for cars and parts", user: "flavioislima", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/5", created_at: "2026-05-28T11:47:23Z" },
    { number: 4, state: "closed", title: "feat: PWA support and mobile optimizations", user: "flavioislima", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/4", created_at: "2026-05-27T21:34:02Z" },
    { number: 3, state: "closed", title: "feat: Trust & Safety — reviews, reports, verification, VIN check", user: "flavioislima", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/3", created_at: "2026-05-27T20:21:23Z" },
    { number: 2, state: "closed", title: "docs: add competitive analysis and 12-phase implementation roadmap", user: "flavioislima", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/2", created_at: "2026-05-27T19:14:33Z" },
    { number: 1, state: "closed", title: "docs: add CLAUDE.md project documentation", user: "flavioislima", html_url: "https://github.com/jfreirecomercial-blip/ReparAuto/pull/1", created_at: "2026-05-27T18:10:27Z" }
  ];
}

// 3. Fetch Firebase Firestore Info
let firebaseStats = {
  cars: 0,
  parts: 0,
  oficinas: 0,
  users: 0,
  intentions: 0,
  reviews: 0,
  reports: 0
};

try {
  console.log('Fetching statistics from Firestore...');
  const firebaseConfig = {
    apiKey: 'AIzaSyDQC9m8SYHsZbeEG-G-b708JFbtUV9knq8',
    authDomain: 'reparauto-site.firebaseapp.com',
    projectId: 'reparauto-site',
    storageBucket: 'reparauto-site.firebasestorage.app',
    messagingSenderId: '707836120678',
    appId: '1:707836120678:web:4c18eee236e955a75767a7',
    measurementId: 'G-MTSTFD5MJ5',
  };
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const [carsSnap, partsSnap, oficinasSnap, usersSnap, intentionsSnap, reviewsSnap, reportsSnap] = await Promise.all([
    getDocs(collection(db, 'cars')).catch(() => ({ size: 0 })),
    getDocs(collection(db, 'parts')).catch(() => ({ size: 0 })),
    getDocs(collection(db, 'services')).catch(() => ({ size: 0 })),
    getDocs(collection(db, 'users')).catch(() => ({ size: 0 })),
    getDocs(collection(db, 'intencoes_compra')).catch(() => ({ size: 0 })),
    getDocs(collection(db, 'reviews')).catch(() => ({ size: 0 })),
    getDocs(collection(db, 'reports')).catch(() => ({ size: 0 }))
  ]);

  firebaseStats.cars = carsSnap.size || 0;
  firebaseStats.parts = partsSnap.size || 0;
  firebaseStats.oficinas = oficinasSnap.size || 0;
  firebaseStats.users = usersSnap.size || 0;
  firebaseStats.intentions = intentionsSnap.size || 0;
  firebaseStats.reviews = reviewsSnap.size || 0;
  firebaseStats.reports = reportsSnap.size || 0;
  
  console.log('Firestore statistics fetched successfully:', firebaseStats);
} catch (err) {
  console.error('Error fetching Firestore stats:', err.message);
}

// 4. Read roadmap plans from docs/plans/
const docsPlansDir = path.join(CWD, 'docs', 'plans');
let plans = [];
if (fs.existsSync(docsPlansDir)) {
  const files = fs.readdirSync(docsPlansDir);
  files.forEach(file => {
    if (file.endsWith('.md')) {
      const filePath = path.join(docsPlansDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const titleMatch = content.match(/^#\s+(.*)$/m);
      const title = titleMatch ? titleMatch[1] : file;
      
      plans.push({
        filename: file,
        title,
        content
      });
    }
  });
}
plans.sort((a, b) => a.filename.localeCompare(b.filename));

// 5. Read pending PRs from .opencode/plans/
const opencodePlansDir = path.join(CWD, '.opencode', 'plans');
let pendingPrs = [];
if (fs.existsSync(opencodePlansDir)) {
  const files = fs.readdirSync(opencodePlansDir);
  files.forEach(file => {
    if (file.endsWith('.md')) {
      const filePath = path.join(opencodePlansDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const titleMatch = content.match(/^#\s+(.*)$/m);
      const title = titleMatch ? titleMatch[1] : file;
      
      pendingPrs.push({
        filename: file,
        title,
        content
      });
    }
  });
}
pendingPrs.sort((a, b) => a.filename.localeCompare(b.filename));

// 6. Generate Codebase File Structure (recursive tree)
const ignoredDirs = new Set(['node_modules', '.next', '.git', 'dist', 'out']);
function buildFileTree(dir, depth = 0) {
  const name = path.basename(dir);
  const relPath = path.relative(CWD, dir).replace(/\\/g, '/');
  
  if (depth > 4) return null;

  let stats;
  try {
    stats = fs.statSync(dir);
  } catch (e) {
    return null;
  }

  if (stats.isDirectory()) {
    if (ignoredDirs.has(name)) return null;
    
    let children = [];
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const child = buildFileTree(path.join(dir, file), depth + 1);
        if (child) children.push(child);
      });
    } catch (e) {
      // Ignore directory read errors
    }

    children.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      name: name || 'ReparAuto',
      path: relPath,
      isDirectory: true,
      children
    };
  } else {
    const ext = path.extname(name).toLowerCase();
    const validExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.html', '.sh', '.ps1', '.yml', '.yaml']);
    if (!validExtensions.has(ext)) return null;

    return {
      name,
      path: relPath,
      isDirectory: false,
      size: stats.size
    };
  }
}
const fileTree = buildFileTree(CWD) || {};

// 7. Gather project overview statistics
let totalFiles = 0;
let totalSize = 0;
function countFiles(node) {
  if (!node) return;
  if (node.isDirectory) {
    node.children.forEach(countFiles);
  } else {
    totalFiles++;
    totalSize += node.size || 0;
  }
}
countFiles(fileTree);

const stats = {
  branch,
  lastUpdated: new Date().toLocaleString('pt-PT'),
  commitsCount: commits.length,
  contributorsCount: contributors.length,
  totalFiles,
  totalSize: (totalSize / 1024 / 1024).toFixed(2) + ' MB',
  firebase: firebaseStats // Add Firebase statistics
};

// 8. Load template, insert data and write dashboard
const templatePath = path.join(CWD, 'scripts', 'dashboard-template.html');
if (!fs.existsSync(templatePath)) {
  console.error(`Template not found at ${templatePath}`);
  process.exit(1);
}

const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

const dataPayload = {
  stats,
  branch,
  lastUpdated: stats.lastUpdated,
  commits,
  contributors,
  githubPrs,
  plans,
  pendingPrs,
  fileTree
};

const stringifiedData = JSON.stringify(dataPayload, null, 2);

// Fix replace bug using a function mapping to avoid dollar signs interpretation
const finalHtml = htmlTemplate.replace('__DATA_PLACEHOLDER__', () => stringifiedData);

const outputDir = path.join(CWD, 'docs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'dashboard.html'), finalHtml, 'utf8');
console.log('Project dashboard successfully generated in docs/dashboard.html!');
process.exit(0);
