import { useState, useCallback } from 'react';
import { FaGithub } from 'react-icons/fa';
import SearchBar from './components/SearchBar';
import ProfileCard from './components/ProfileCard';
import StatsOverview from './components/StatsOverview';
import LanguageChart from './components/LanguageChart';
import ContributionHeatmap from './components/ContributionHeatmap';
import RepoScoreCard from './components/RepoScoreCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { fetchProfile, fetchLanguages, fetchContributions, fetchRepos } from './utils/api';

function App() {
  const [currentUsername, setCurrentUsername] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [languageData, setLanguageData] = useState(null);
  const [contributionData, setContributionData] = useState(null);
  const [repoData, setRepoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = useCallback(async (username) => {
    setLoading(true);
    setError(null);
    setProfileData(null);
    setLanguageData(null);
    setContributionData(null);
    setRepoData(null);
    setCurrentUsername(username);

    try {
      const results = await Promise.allSettled([
        fetchProfile(username),
        fetchLanguages(username),
        fetchContributions(username),
        fetchRepos(username),
      ]);

      const [profileResult, langResult, contribResult, repoResult] = results;

      // Check if profile request failed (critical)
      if (profileResult.status === 'rejected') {
        const err = profileResult.reason;
        const status = err?.response?.status;
        if (status === 404) {
          setError({ message: 'User not found', type: 'not_found' });
        } else if (status === 403 || status === 429) {
          setError({ message: 'Rate limit exceeded', type: 'rate_limit' });
        } else {
          setError({
            message: err?.response?.data?.error || err?.message || 'Failed to fetch profile',
            type: 'generic',
          });
        }
        setLoading(false);
        return;
      }

      // Profile succeeded
      setProfileData(profileResult.value.data);

      // Set other data if successful
      if (langResult.status === 'fulfilled') {
        setLanguageData(langResult.value.data);
      }

      if (contribResult.status === 'fulfilled') {
        setContributionData(contribResult.value.data);
      }

      if (repoResult.status === 'fulfilled') {
        setRepoData(repoResult.value.data);
      }
    } catch (err) {
      setError({
        message: err?.message || 'An unexpected error occurred',
        type: 'generic',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = () => {
    if (currentUsername) {
      handleSearch(currentUsername);
    }
  };

  const hasData = profileData || languageData || contributionData || repoData;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <FaGithub className="app-header-icon" />
        <h1>GitHub Profile Analyzer</h1>
        <p>Discover insights about any GitHub developer</p>
      </header>

      {/* Search */}
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Loading */}
      {loading && <LoadingSpinner />}

      {/* Error */}
      {error && !loading && (
        <ErrorMessage
          message={error.message}
          type={error.type}
          onRetry={handleRetry}
        />
      )}

      {/* Dashboard */}
      {hasData && !loading && !error && (
        <div className="dashboard">
          {/* Profile Card */}
          {profileData && (
            <div className="dashboard-row full-width">
              <ProfileCard profile={profileData} />
            </div>
          )}

          {/* Stats Overview */}
          {(repoData || languageData) && (
            <div className="dashboard-row full-width">
              <StatsOverview
                repos={Array.isArray(repoData) ? repoData : repoData?.repos || []}
                languages={languageData}
              />
            </div>
          )}

          {/* Two-column: Language Chart + Contribution Heatmap */}
          {(languageData || contributionData) && (
            <div className="dashboard-row two-col">
              {languageData ? (
                <LanguageChart data={languageData} />
              ) : (
                <div />
              )}
              {contributionData ? (
                <ContributionHeatmap data={contributionData} />
              ) : (
                <div />
              )}
            </div>
          )}

          {/* Repository Score Cards */}
          {repoData && (
            <div className="dashboard-row full-width">
              <RepoScoreCard
                repos={Array.isArray(repoData) ? repoData : repoData?.repos || []}
              />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !hasData && (
        <div className="empty-state animate-fadeIn">
          <FaGithub className="empty-state-icon" />
          <h3>Search for a GitHub user</h3>
          <p>Enter a username above to analyze their profile, languages, contributions, and repositories.</p>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        Built with React & Chart.js • GitHub Profile Analyzer
      </footer>
    </div>
  );
}

export default App;
