import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { FaCode } from 'react-icons/fa';
import { getLanguageColor } from '../utils/colors';

ChartJS.register(ArcElement, Tooltip, Legend);

function LanguageChart({ data }) {
  if (!data) return null;

  // Support both raw format and backend DTO format (with bytes and totalBytes)
  const bytesMap = data.bytes || data.languages || data;
  
  if (!bytesMap || typeof bytesMap !== 'object' || Object.keys(bytesMap).length === 0) {
    return (
      <div className="glass-card language-section animate-fadeInUp delay-2">
        <div className="section-title"><FaCode /> Top Languages</div>
        <div className="empty-state">
          <p>No language data available</p>
        </div>
      </div>
    );
  }
  
  const entries = Object.entries(bytesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  const totalBytes = data.totalBytes || entries.reduce((sum, [, val]) => sum + val, 0);
  const labels = entries.map(([lang]) => lang);
  const values = entries.map(([, val]) => val);
  const colors = labels.map((lang) => getLanguageColor(lang));

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 2,
        hoverBorderColor: '#fff',
        hoverBorderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#f0f0f0',
        bodyColor: '#8b95a5',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (context) => {
            const pct = ((context.raw / totalBytes) * 100).toFixed(1);
            const kb = (context.raw / 1024).toFixed(1);
            return ` ${pct}% (${kb} KB)`;
          },
        },
      },
    },
  };

  return (
    <div className="glass-card language-section animate-fadeInUp delay-2">
      <div className="section-title"><FaCode /> Top Languages</div>
      <div className="chart-container">
        <Doughnut data={chartData} options={chartOptions} />
      </div>
      <div className="language-legend">
        {entries.map(([lang, bytes], i) => {
          const pct = ((bytes / totalBytes) * 100).toFixed(1);
          return (
            <div key={lang} className="language-legend-item">
              <span
                className="language-legend-dot"
                style={{ backgroundColor: colors[i] }}
              />
              <span className="language-legend-name">{lang}</span>
              <span className="language-legend-pct">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LanguageChart;
