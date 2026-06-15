import AnnouncementTracker from "../components/AnnouncementTracker";
import StudentNotes from "../components/StudentNotes";
import "../App.css";

function HomePage({ stats, onSelectCategory, onManageStudents }) {
  const { academyCount = 0, wfhCount = 0, totalStudents = 0, totalClasses = 0 } = stats || {};

  return (
    <div className="home-page-dashboard">
      <header className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, Admin 👋</h1>
          <p>Here's what's happening with ICan Academy today.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-card main-stats">
          <h2>Overview</h2>
          <div className="stats-display">
            <div className="stat-item">
              <span className="stat-value">{totalStudents}</span>
              <span className="stat-label">Active Students</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{totalClasses}</span>
              <span className="stat-label">Total Classes</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{academyCount + wfhCount}</span>
              <span className="stat-label">Teachers</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card quick-actions">
          <h2>Quick Navigation</h2>
          <div className="action-buttons">
            <button className="dashboard-action-btn" onClick={() => onSelectCategory("academy")}>
              <span className="action-icon">🏢</span>
              <div className="action-text">
                <strong>Academy Teachers</strong>
                <span>View on-site staff</span>
              </div>
            </button>
            <button className="dashboard-action-btn" onClick={() => onSelectCategory("wfh")}>
              <span className="action-icon">🏠</span>
              <div className="action-text">
                <strong>WFH Teachers</strong>
                <span>Remote instructors</span>
              </div>
            </button>
            <button className="dashboard-action-btn" onClick={onManageStudents}>
              <span className="action-icon">🎓</span>
              <div className="action-text">
                <strong>Student Records</strong>
                <span>Manage directory</span>
              </div>
            </button>
          </div>
        </div>

        <AnnouncementTracker />
        <StudentNotes />
      </div>

      <footer className="dashboard-footer">
        <div className="ai-tip">
          <span className="tip-icon">💡</span>
          <p><strong>Pro Tip:</strong> You can quickly find teacher availability using the "Find Availability" tool in the sidebar.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
