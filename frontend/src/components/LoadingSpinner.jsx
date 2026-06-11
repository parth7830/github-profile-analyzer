import { FaGithub } from 'react-icons/fa';

function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <FaGithub className="loading-icon" />
      <p className="loading-text">Analyzing profile...</p>

      {/* Skeleton placeholders */}
      <div className="glass-card skeleton-profile" style={{ width: '100%', maxWidth: 800 }}>
        <div className="skeleton skeleton-avatar" />
        <div className="skeleton-lines">
          <div className="skeleton skeleton-line w-60" />
          <div className="skeleton skeleton-line w-40" />
          <div className="skeleton skeleton-line w-80" />
          <div className="skeleton skeleton-line w-30" />
        </div>
      </div>
    </div>
  );
}

export default LoadingSpinner;
