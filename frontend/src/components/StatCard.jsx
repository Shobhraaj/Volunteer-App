import React from 'react';

export default function StatCard({ icon, label, value, color = 'cyan', onClick }) {
  return (
    <div 
      className={`stat-card apple-hover group ${onClick ? 'cursor-pointer' : 'cursor-default'}`} 
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="stat-label uppercase tracking-wider font-bold text-xs">{label}</div>
          <div className="stat-value text-3xl">{value}</div>
        </div>
        <div className={`stat-icon ${color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>{icon}</div>
      </div>
    </div>
  );
}

