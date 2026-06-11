import { FaExclamationTriangle } from 'react-icons/fa';

function ErrorMessage({ message, type, onRetry }) {
  const is404 = type === '404' || type === 'not_found';
  const isRateLimit = type === 'rate_limit';

  const title = is404
    ? 'User Not Found'
    : isRateLimit
    ? 'Rate Limit Exceeded'
    : 'Something Went Wrong';

  const description = is404
    ? "We couldn't find a GitHub user with that username. Please check the spelling and try again."
    : isRateLimit
    ? 'GitHub API rate limit has been reached. Please wait a few minutes before trying again, or configure a GitHub token for higher limits.'
    : message || 'An unexpected error occurred while fetching the data. Please try again.';

  return (
    <div className={`glass-card error-container ${isRateLimit ? 'rate-limit' : ''}`}>
      <FaExclamationTriangle className="error-icon" />
      <h3 className="error-title">{title}</h3>
      <p className="error-message">{description}</p>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
