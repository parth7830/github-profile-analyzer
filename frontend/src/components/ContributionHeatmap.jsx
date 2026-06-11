import { useState, useMemo } from 'react';
import { FaFire } from 'react-icons/fa';
import { heatmapColors } from '../utils/colors';

function ContributionHeatmap({ data }) {
  const [tooltip, setTooltip] = useState(null);

  const isGraphQL = data?.source === 'graphql';
  const contributions = data?.contributions || [];

  const { grid, months, totalCount, maxCount } = useMemo(() => {
    if (!contributions || contributions.length === 0) {
      return { grid: [], months: [], totalCount: 0, maxCount: 0 };
    }

    // Sort contributions by date
    const sorted = [...contributions].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    const total = sorted.reduce((sum, d) => sum + (d.count || 0), 0);
    const max = Math.max(...sorted.map((d) => d.count || 0), 1);

    // Build grid: columns are weeks, rows are days (0=Sun..6=Sat)
    // First, figure out the date range
    const startDate = new Date(sorted[0].date);
    const endDate = new Date(sorted[sorted.length - 1].date);

    // Create a map for quick lookup
    const dateMap = {};
    sorted.forEach((d) => {
      dateMap[d.date] = d.count || 0;
    });

    // Start from the Sunday of the start week
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const columns = [];
    const monthLabels = [];
    let currentDate = new Date(gridStart);
    let lastMonth = -1;

    while (currentDate <= endDate || columns.length < 4) {
      const week = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = dateMap[dateStr] || 0;
        const isInRange = currentDate >= startDate && currentDate <= endDate;

        week.push({
          date: dateStr,
          count: isInRange ? count : -1, // -1 means out of range
          dayOfWeek: day,
        });

        // Track month labels on the first day of each month
        if (currentDate.getDate() <= 7 && day === 0) {
          const month = currentDate.getMonth();
          if (month !== lastMonth) {
            monthLabels.push({
              label: currentDate.toLocaleDateString('en-US', { month: 'short' }),
              index: columns.length,
            });
            lastMonth = month;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
      columns.push(week);

      if (currentDate > endDate && columns.length >= 4) break;
      if (columns.length > 55) break; // safety
    }

    return { grid: columns, months: monthLabels, totalCount: total, maxCount: max };
  }, [contributions]);

  const getLevel = (count) => {
    if (count <= 0) return 0;
    const quartile = maxCount / 4;
    if (count <= quartile) return 1;
    if (count <= quartile * 2) return 2;
    if (count <= quartile * 3) return 3;
    return 4;
  };

  const handleMouseEnter = (e, cell) => {
    if (cell.count < 0) return;
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      date: cell.date,
      count: cell.count,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!data || contributions.length === 0) {
    return (
      <div className="glass-card contribution-section animate-fadeInUp delay-3">
        <div className="section-title"><FaFire /> Contribution Activity</div>
        <div className="empty-state">
          <p>No contribution data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card contribution-section animate-fadeInUp delay-3">
      <div className="contribution-header">
        <div className="section-title" style={{ marginBottom: 0 }}>
          <FaFire /> Contribution Activity
        </div>
        <span className="contribution-total-badge">
          {totalCount.toLocaleString()} contributions
        </span>
      </div>

      {!isGraphQL && (
        <p className="contribution-source-note">
          Based on recent public events (last 30 days). Connect a GitHub token for full history.
        </p>
      )}

      <div className="heatmap-wrapper">
        {/* Month labels */}
        <div className="heatmap-months">
          {months.map((m, i) => (
            <span
              key={i}
              className="heatmap-month-label"
              style={{ marginLeft: i === 0 ? 0 : `${(m.index - (months[i - 1]?.index || 0)) * 16 - 24}px` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="heatmap-container">
          {/* Day-of-week labels */}
          <div className="heatmap-day-labels">
            {dayLabels.map((label, i) => (
              <span
                key={i}
                className="heatmap-day-label"
                style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="heatmap-grid">
            {grid.map((week, wi) => (
              <div key={wi} className="heatmap-column">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={`heatmap-cell level-${cell.count < 0 ? 0 : getLevel(cell.count)}`}
                    style={{ opacity: cell.count < 0 ? 0.3 : 1 }}
                    onMouseEnter={(e) => handleMouseEnter(e, cell)}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span className="heatmap-legend-label">Less</span>
          {heatmapColors.map((color, i) => (
            <div
              key={i}
              className="heatmap-legend-cell"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="heatmap-legend-label">More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <strong>{tooltip.count} contribution{tooltip.count !== 1 ? 's' : ''}</strong>{' '}
          on {new Date(tooltip.date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      )}
    </div>
  );
}

export default ContributionHeatmap;
