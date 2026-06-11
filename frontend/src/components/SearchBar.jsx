import { useState } from 'react';
import { FaGithub, FaSearch } from 'react-icons/fa';

function SearchBar({ onSearch, loading }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    let trimmed = username.trim();
    if (!trimmed) return;

    // Handle GitHub URLs (e.g. https://github.com/username or github.com/username)
    if (trimmed.includes('/')) {
      // Remove protocol and domain
      let path = trimmed.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
      // Strip query params or hash
      path = path.split('?')[0].split('#')[0];
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 0) {
        trimmed = segments[0];
      }
    }

    // Strip leading @ symbol if present
    if (trimmed.startsWith('@')) {
      trimmed = trimmed.substring(1);
    }

    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <div className="search-container">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <FaGithub className="search-input-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Enter a GitHub username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>
        <button type="submit" className="search-btn" disabled={loading || !username.trim()}>
          {loading ? (
            <>
              <span className="btn-spinner" />
              Analyzing...
            </>
          ) : (
            <>
              <FaSearch />
              Analyze
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default SearchBar;
