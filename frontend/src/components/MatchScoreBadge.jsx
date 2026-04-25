import React from 'react';

export default function MatchScoreBadge({ score }) {
  let cls = 'low';
  if (score >= 70) cls = 'high';
  else if (score >= 40) cls = 'medium';

  return (
    <span className={`match-score ${cls}`}>
      {score.toFixed(0)}%
    </span>
  );
}
