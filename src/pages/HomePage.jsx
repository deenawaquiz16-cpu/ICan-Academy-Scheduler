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
          <div className="card-data-display">
            <span className="big-stat-number">{academyCount}</span>
            <span className="big-stat-label">Teachers</span>
          </div>
        </button>
        <button
          className="category-card wfh"
          onClick={() => onSelectCategory("wfh")}
        >
          <div className="card-icon">🏠</div>
          <h2>Work From Home</h2>
          <p>Remote teachers working from home</p>
          <div className="card-data-display">
            <span className="big-stat-number">{wfhCount}</span>
            <span className="big-stat-label">Teachers</span>
          </div>
        </button>
      </div>

      <div className="home-summary">
        <div className="summary-item">
          <span className="summary-value prominent">{totalStudents}</span>
          <span className="summary-label">Active Students</span>
          <button className="summary-add-link" onClick={onManageStudents}>+ Add Student</button>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-item">
          <span className="summary-value prominent">{totalClasses}</span>
          <span className="summary-label">Total Classes</span>
          <button className="summary-add-link" onClick={onFindAvailability}>+ Schedule Class</button>
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
