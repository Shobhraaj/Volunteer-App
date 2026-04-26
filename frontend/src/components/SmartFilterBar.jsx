/**
 * SmartFilterBar — Dynamic search and filter component for Analytics.
 * Allows filtering by Location, Skills, and Task Type.
 */
import React from 'react';

export default function SmartFilterBar({ filters, setFilters, locations = [], skills = [] }) {
  return (
    <div className="card mb-6" style={{ padding: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        
        {/* Location Filter */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>🌍 Filter by Location</label>
          <select 
            className="form-control"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          >
            <option value="all">All Locations</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>

        {/* Skill Filter */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>🛠️ Filter by Skill</label>
          <select 
            className="form-control"
            value={filters.skill}
            onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
          >
            <option value="all">All Skills</option>
            {skills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
          </select>
        </div>

        {/* Search Bar */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>🔍 Smart Search</label>
          <input 
            type="text" 
            placeholder="e.g. 'Medical' or 'Bhopal'" 
            className="form-control"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

      </div>
    </div>
  );
}
