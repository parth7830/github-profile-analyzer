import { FaStar, FaCodeBranch, FaExternalLinkAlt } from 'react-icons/fa';
import { getLanguageColor } from '../utils/colors';

function getGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function getRingColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 65) return '#00d4ff';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function RepoScoreCard({ repos }) {
  if (!repos || repos.length === 0) {
    return (
      <div className="glass-card repos-section animate-fadeInUp delay-4">
        <div className="section-title"><FaStar /> Repository Quality Scores</div>
        <div className="empty-state">
          <p>No repository data available</p>
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 27;

  const scoreFactors = (repo) => {
    const factors = [];
    if (repo.breakdown) {
      const breakdown = repo.breakdown;
      if (breakdown.stars !== undefined) factors.push({ label: 'Stars', value: breakdown.stars, max: 100 });
      if (breakdown.forks !== undefined) factors.push({ label: 'Forks', value: breakdown.forks, max: 100 });
      if (breakdown.hasDescription !== undefined) factors.push({ label: 'Description', value: breakdown.hasDescription, max: 100 });
      if (breakdown.hasLicense !== undefined) factors.push({ label: 'License', value: breakdown.hasLicense, max: 100 });
      if (breakdown.recency !== undefined) factors.push({ label: 'Recency', value: breakdown.recency, max: 100 });
      if (breakdown.sizeActivity !== undefined) factors.push({ label: 'Activity', value: breakdown.sizeActivity, max: 100 });
    }
    return factors;
  };

  return (
    <div className="repos-section animate-fadeInUp delay-4">
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <div className="section-title"><FaStar /> Repository Quality Scores</div>
        <p className="repos-subtitle">Showing top {repos.length} repositories by score</p>
      </div>

      <div className="repos-grid">
        {repos.map((repo, index) => {
          const score = repo.overallScore || repo.overall_score || repo.score || 0;
          const grade = getGrade(score);
          const ringColor = getRingColor(score);
          const dashOffset = circumference - (score / 100) * circumference;
          const factors = scoreFactors(repo);
          const repoUrl = repo.html_url || `https://github.com/${repo.full_name || repo.name}`;

          return (
            <div
              key={repo.name || index}
              className="glass-card repo-card animate-fadeInUp"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="repo-card-header">
                {/* Score Ring */}
                <div className="repo-score-ring">
                  <svg viewBox="0 0 64 64">
                    <circle className="ring-bg" cx="32" cy="32" r="27" />
                    <circle
                      className="ring-fill"
                      cx="32"
                      cy="32"
                      r="27"
                      stroke={ringColor}
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                  <span className="repo-score-value" style={{ color: ringColor }}>
                    {Math.round(score)}
                  </span>
                </div>

                <div className="repo-info">
                  <div className="repo-name">
                    <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                      {repo.name}
                    </a>
                  </div>
                  {repo.description && (
                    <p className="repo-description">{repo.description}</p>
                  )}
                </div>

                <span className={`grade-badge grade-${grade}`}>{grade}</span>
              </div>

              {/* Badges */}
              <div className="repo-badges">
                {repo.language && (
                  <span
                    className="badge language-badge"
                    style={{
                      backgroundColor: `${getLanguageColor(repo.language)}20`,
                      color: getLanguageColor(repo.language),
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getLanguageColor(repo.language),
                        display: 'inline-block',
                      }}
                    />
                    {repo.language}
                  </span>
                )}
                <span className="badge stars-badge">
                  <FaStar /> {repo.stars ?? repo.stargazers_count ?? 0}
                </span>
                <span className="badge forks-badge">
                  <FaCodeBranch /> {repo.forks ?? repo.forks_count ?? 0}
                </span>
              </div>

              {/* Score Breakdown */}
              {factors.length > 0 && (
                <div className="score-breakdown">
                  {factors.map((factor) => {
                    const pct = factor.max > 0 ? (factor.value / factor.max) * 100 : 0;
                    return (
                      <div key={factor.label} className="score-factor">
                        <span className="score-factor-label">{factor.label}</span>
                        <div className="score-bar">
                          <div
                            className="score-bar-fill"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="score-factor-value">
                          {Math.round(factor.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RepoScoreCard;
