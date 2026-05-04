/**
 * Certificates page — displays volunteer certificates.
 * Fetches from Firestore `certificates/{userId}` collection with Firebase Storage download links.
 * Falls back to demo data when Firebase is not configured.
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage, FIREBASE_CONFIGURED } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

const DEMO_CERTS = [
  { id:'c1', title:'Community Volunteer Excellence', issuer:'EcoPulse Platform', date:'2024-12-15', category:'Achievement', storageRef: null },
  { id:'c2', title:'First Aid Training Completion',  issuer:'Red Cross India',     date:'2024-10-20', category:'Training',     storageRef: null },
  { id:'c3', title:'Environmental Cleanup Drive',    issuer:'GreenEarth NGO',      date:'2024-08-05', category:'Participation', storageRef: null },
];

const CAT_CONFIG = {
  Achievement:   { bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/30',   bar: 'bg-amber-500',   icon: '🏆', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  Training:      { bg: 'bg-cyan-500/10',    text: 'text-cyan-500',    border: 'border-cyan-500/30',    bar: 'bg-cyan-500',    icon: '📚', badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  Participation: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30', bar: 'bg-emerald-500', icon: '🌿', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  Recognition:   { bg: 'bg-violet-500/10',  text: 'text-violet-500',  border: 'border-violet-500/30',  bar: 'bg-violet-500',  icon: '⭐', badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
};

function CertCard({ cert, onDownload }) {
  const [downloading, setDownloading] = useState(false);
  const cat = CAT_CONFIG[cert.category] || CAT_CONFIG.Recognition;

  const handleDownload = async () => {
    setDownloading(true);
    try { await onDownload(cert); }
    finally { setDownloading(false); }
  };

  return (
    <div className="card relative overflow-hidden apple-hover animate-slide-up">
      {/* Decorative top stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${cat.bar} opacity-60`} />

      <div className="flex items-start gap-4 mt-2">
        <div className={`w-14 h-14 rounded-xl ${cat.bg} flex items-center justify-center text-2xl shrink-0`}>
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 dark:text-white mb-1.5 leading-tight">{cert.title}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Issued by: {cert.issuer}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-400">
              📅 {new Date(cert.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.badge}`}>
              {cert.category}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-5 justify-end">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn btn-primary btn-sm"
        >
          {downloading ? '⏳ Downloading…' : '⬇️ Download PDF'}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            const text = `Certificate: ${cert.title}\nIssued: ${cert.date}\nBy: ${cert.issuer}`;
            navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
          }}
        >
          📋 Copy
        </button>
      </div>
    </div>
  );
}

export default function Certificates() {
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!FIREBASE_CONFIGURED || !db) {
        setCerts(DEMO_CERTS);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'certificates'), where('userId', '==', String(user?.id)));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCerts(data.length ? data : DEMO_CERTS);
      } catch (err) {
        console.error(err);
        setCerts(DEMO_CERTS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleDownload = async (cert) => {
    if (FIREBASE_CONFIGURED && cert.storageRef && storage) {
      try {
        const url = await getDownloadURL(ref(storage, cert.storageRef));
        window.open(url, '_blank');
        return;
      } catch (err) { console.error('Storage download failed', err); }
    }
    // Fallback: generate a simple text "certificate"
    const content = `CERTIFICATE OF ${cert.category?.toUpperCase() || 'PARTICIPATION'}\n\n${cert.title}\n\nThis certifies that the volunteer has successfully participated in the above activity.\n\nIssued by: ${cert.issuer}\nDate: ${new Date(cert.date).toLocaleDateString()}\n\nEcoPulse Platform`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${cert.title.replace(/\s+/g, '-')}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const categories = [...new Set(certs.map(c => c.category))];

  if (loading) {
    return (
      <div className="main-content py-8 px-4 md:px-8">
        {[1, 2, 3].map(i => <div key={i} className="skeleton mb-4" style={{ height: 160 }} />)}
      </div>
    );
  }

  return (
    <div className="main-content py-8 px-4 md:px-8 animate-fade-in">
      <div className="page-header">
        <h1>🎓 My Certificates</h1>
        <p>Download and share your volunteer achievement certificates</p>
      </div>

      {/* Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon amber">🎓</div>
          <div className="stat-value">{certs.length}</div>
          <div className="stat-label">Total Certificates</div>
        </div>
        {categories.map(cat => {
          const cfg = CAT_CONFIG[cat] || CAT_CONFIG.Recognition;
          return (
            <div key={cat} className="stat-card">
              <div className={`stat-icon ${cat === 'Achievement' ? 'amber' : cat === 'Training' ? 'cyan' : cat === 'Participation' ? 'emerald' : 'violet'}`}>
                {cfg.icon}
              </div>
              <div className="stat-value">{certs.filter(c => c.category === cat).length}</div>
              <div className="stat-label">{cat}</div>
            </div>
          );
        })}
      </div>

      {!FIREBASE_CONFIGURED && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-sm font-medium">
          ⚠️ <strong>Demo mode:</strong> Configure Firebase in <code className="font-mono text-xs">src/firebase.js</code> to load real certificates from Firestore &amp; Storage.
        </div>
      )}

      {certs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <h3>No certificates yet</h3>
          <p>Complete tasks to earn certificates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certs.map(cert => (
            <CertCard key={cert.id} cert={cert} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  );
}
