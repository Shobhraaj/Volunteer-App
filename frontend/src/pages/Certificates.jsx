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
  { id:'c1', title:'Community Volunteer Excellence', issuer:'VolunteerAI Platform', date:'2024-12-15', category:'Achievement', storageRef: null },
  { id:'c2', title:'First Aid Training Completion',  issuer:'Red Cross India',     date:'2024-10-20', category:'Training',     storageRef: null },
  { id:'c3', title:'Environmental Cleanup Drive',    issuer:'GreenEarth NGO',      date:'2024-08-05', category:'Participation', storageRef: null },
];

const CAT_COLORS = {
  Achievement:  { bg:'rgba(245,158,11,0.12)',  color:'#f59e0b', icon:'🏆' },
  Training:     { bg:'rgba(6,182,212,0.12)',   color:'#06b6d4', icon:'📚' },
  Participation:{ bg:'rgba(16,185,129,0.12)',  color:'#10b981', icon:'🌿' },
  Recognition:  { bg:'rgba(139,92,246,0.12)',  color:'#8b5cf6', icon:'⭐' },
};

function CertCard({ cert, onDownload }) {
  const [downloading, setDownloading] = useState(false);
  const cat = CAT_COLORS[cert.category] || CAT_COLORS.Recognition;

  const handleDownload = async () => {
    setDownloading(true);
    try { await onDownload(cert); }
    finally { setDownloading(false); }
  };

  return (
    <div className="card" style={{ position:'relative', overflow:'hidden', animation:'slideUp 0.4s ease both' }}>
      {/* Decorative top stripe */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg, ${cat.color}, transparent)` }} />

      <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
        <div style={{ width:52, height:52, borderRadius:'var(--radius-md)', background:cat.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', flexShrink:0 }}>
          {cat.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:6, lineHeight:1.3 }}>{cert.title}</div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:4 }}>Issued by: {cert.issuer}</div>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>
              📅 {new Date(cert.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
            </span>
            <span style={{ padding:'2px 8px', borderRadius:20, background:cat.bg, color:cat.color, fontSize:'0.72rem', fontWeight:600 }}>
              {cert.category}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn btn-primary btn-sm"
          style={{ gap:6 }}
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
    const content = `CERTIFICATE OF ${cert.category?.toUpperCase() || 'PARTICIPATION'}\n\n${cert.title}\n\nThis certifies that the volunteer has successfully participated in the above activity.\n\nIssued by: ${cert.issuer}\nDate: ${new Date(cert.date).toLocaleDateString()}\n\nVolunteerAI Platform`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${cert.title.replace(/\s+/g,'-')}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const categories = [...new Set(certs.map(c => c.category))];

  if (loading) {
    return <div className="main-content">{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:140,borderRadius:16,marginBottom:16}}/>)}</div>;
  }

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <h1>🎓 My Certificates</h1>
        <p>Download and share your volunteer achievement certificates</p>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom:28 }}>
        <div className="stat-card"><div className="stat-icon amber">🎓</div><div className="stat-value">{certs.length}</div><div className="stat-label">Total Certificates</div></div>
        {categories.map(cat => {
          const cfg = CAT_COLORS[cat] || CAT_COLORS.Recognition;
          return (
            <div key={cat} className="stat-card">
              <div className="stat-icon" style={{ background:cfg.bg, color:cfg.color }}>{cfg.icon}</div>
              <div className="stat-value">{certs.filter(c=>c.category===cat).length}</div>
              <div className="stat-label">{cat}</div>
            </div>
          );
        })}
      </div>

      {!FIREBASE_CONFIGURED && (
        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'var(--radius-md)', padding:'12px 16px', marginBottom:24, fontSize:'0.85rem', color:'#f59e0b' }}>
          ⚠️ <strong>Demo mode:</strong> Configure Firebase in <code>src/firebase.js</code> to load real certificates from Firestore &amp; Storage.
        </div>
      )}

      {certs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <h3>No certificates yet</h3>
          <p>Complete tasks to earn certificates</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:20 }}>
          {certs.map(cert => <CertCard key={cert.id} cert={cert} onDownload={handleDownload} />)}
        </div>
      )}
    </div>
  );
}
