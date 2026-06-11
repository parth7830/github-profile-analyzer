import {
  FaMapMarkerAlt,
  FaBuilding,
  FaLink,
  FaTwitter,
  FaExternalLinkAlt,
  FaCalendarAlt,
} from 'react-icons/fa';

function ProfileCard({ profile }) {
  if (!profile) return null;

  const createdDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num?.toString() || '0';
  };

  return (
    <div className="glass-card profile-card animate-fadeInUp">
      <div className="profile-avatar-container">
        <div className="profile-avatar-ring" />
        <img
          src={profile.avatar_url}
          alt={profile.login}
          className="profile-avatar"
        />
      </div>

      <div className="profile-info">
        {profile.name && <h2 className="profile-name">{profile.name}</h2>}
        <div className="profile-username">@{profile.login}</div>

        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        <div className="profile-meta">
          {profile.location && (
            <span className="profile-meta-item">
              <FaMapMarkerAlt /> {profile.location}
            </span>
          )}
          {profile.company && (
            <span className="profile-meta-item">
              <FaBuilding /> {profile.company}
            </span>
          )}
          {profile.blog && (
            <span className="profile-meta-item">
              <FaLink />
              <a
                href={
                  profile.blog.startsWith('http')
                    ? profile.blog
                    : `https://${profile.blog}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {profile.blog}
              </a>
            </span>
          )}
          {profile.twitter_username && (
            <span className="profile-meta-item">
              <FaTwitter />
              <a
                href={`https://twitter.com/${profile.twitter_username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{profile.twitter_username}
              </a>
            </span>
          )}
        </div>

        <div className="profile-stats">
          <div className="profile-stat-item">
            <div className="profile-stat-number">{formatNumber(profile.public_repos)}</div>
            <div className="profile-stat-label">Repos</div>
          </div>
          <div className="profile-stat-item">
            <div className="profile-stat-number">{formatNumber(profile.followers)}</div>
            <div className="profile-stat-label">Followers</div>
          </div>
          <div className="profile-stat-item">
            <div className="profile-stat-number">{formatNumber(profile.following)}</div>
            <div className="profile-stat-label">Following</div>
          </div>
          <div className="profile-stat-item">
            <div className="profile-stat-number">{formatNumber(profile.public_gists)}</div>
            <div className="profile-stat-label">Gists</div>
          </div>
        </div>

        <div className="profile-footer">
          {createdDate && (
            <span className="profile-member-since">
              <FaCalendarAlt style={{ marginRight: 6, opacity: 0.5 }} />
              Member since {createdDate}
            </span>
          )}
          <a
            href={profile.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="profile-github-link"
          >
            View on GitHub <FaExternalLinkAlt />
          </a>
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;
