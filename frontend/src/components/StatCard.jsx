import React from 'react';

export default function StatCard({ icon, label, value, color = 'cyan', onClick }) {
  return (
    <div 
      className={`stat-card apple-hover group ${onClick ? 'cursor-pointer' : 'cursor-default'}`} 
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
        <div className={`stat-icon ${color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>{icon}</div>
      </div>
    </div>
  );
}

