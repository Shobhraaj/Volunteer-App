import React from 'react';

export default function StatCard({ icon, label, value, color = 'cyan', onClick }) {
  return (
    <div 
      className={`stat-card apple-hover group ${onClick ? 'cursor-pointer' : 'cursor-default'}`} 
      onClick={onClick}
    >
      <div className={`stat-icon ${color} group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label uppercase tracking-tighter font-black text-[10px]">{label}</div>
    </div>
  );
}

