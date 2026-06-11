import { FaStar, FaCodeBranch, FaCode, FaTrophy } from 'react-icons/fa';

function StatsOverview({ repos, languages }) {
  const totalStars = repos
    ? repos.reduce((sum, r) => sum + (r.stars || r.stargazers_count || 0), 0)
    : 0;

  const totalForks = repos
    ? repos.reduce((sum, r) => sum + (r.forks || r.forks_count || 0), 0)
    : 0;

  const mostUsedLanguage = (() => {
    if (!languages || typeof languages !== 'object') return 'N/A';
    const langs = languages.languages || languages;
    if (!langs || typeof langs !== 'object') return 'N/A';
    const entries = Object.entries(langs);
    if (entries.length === 0) return 'N/A';
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  })();

  const avgScore = repos && repos.length > 0
    ? Math.round(
        repos.reduce((sum, r) => sum + (r.overallScore || r.overall_score || r.score || 0), 0) / repos.length
      )
    : 0;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const stats = [
    {
      icon: <FaStar />,
      color: 'amber',
      value: formatNumber(totalStars),
      label: 'Total Stars',
    },
    {
      icon: <FaCodeBranch />,
      color: 'cyan',
      value: formatNumber(totalForks),
      label: 'Total Forks',
    },
    {
      icon: <FaCode />,
      color: 'violet',
      value: mostUsedLanguage,
      label: 'Top Language',
    },
    {
      icon: <FaTrophy />,
      color: 'green',
      value: avgScore,
      label: 'Avg Score',
    },
  ];

  return (
    <div className="stats-overview animate-fadeInUp delay-1">
      {stats.map((stat, i) => (
        <div className="glass-card stat-card" key={i}>
          <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
          <div className="stat-card-content">
            <div className="stat-card-number">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsOverview;
