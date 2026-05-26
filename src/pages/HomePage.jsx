import "../App.css";

function HomePage({ onSelectCategory, onManageTeachers, onManageStudents, onOverallSchedule, onFindAvailability, onCalendar, onLiveView, stats }) {
  const { academyCount = 0, wfhCount = 0, totalStudents = 0, totalClasses = 0 } = stats || {};

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>🤖 ICan Academy</h1>
        <p className="subtitle">AI-Powered Learning Scheduler</p>
      </div>
      <div className="category-cards">
        <button
          className="category-card academy"
          onClick={() => onSelectCategory("academy")}
        >
          <div className="card-icon">🏫</div>
          <h2>Academy Teachers</h2>
          <p>Teachers working at the academy campus</p>
          <div className="card-stats">
            <span className="stat-badge">{academyCount} Teachers</span>
          </div>
        </button>
        <button
          className="category-card wfh"
          onClick={() => onSelectCategory("wfh")}
        >
          <div className="card-icon">🏠</div>
          <h2>Work From Home</h2>
          <p>Remote teachers working from home</p>
          <div className="card-stats">
            <span className="stat-badge">{wfhCount} Teachers</span>
          </div>
        </button>
      </div>

      <div className="home-summary">
        <div className="summary-item">
          <span className="summary-value">{totalStudents}</span>
          <span className="summary-label">Active Students</span>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-item">
          <span className="summary-value">{totalClasses}</span>
          <span className="summary-label">Total Classes</span>
        </div>
      </div>

      <div className="home-manage-links">
        <button className="manage-link-btn" onClick={onOverallSchedule}>
          📋 Overall Schedule
        </button>
        <button className="manage-link-btn" onClick={onCalendar}>
          📅 Calendar & Notes
        </button>
        <button className="manage-link-btn" onClick={onFindAvailability}>
          🔍 Find Availability
        </button>
        <button className="manage-link-btn" onClick={onManageStudents}>
          🎓 Manage Students
        </button>
        <button className="manage-link-btn live-btn" onClick={onLiveView}>
          📡 Live Data
        </button>
      </div>
    </div>
  );
}

export default HomePage;
