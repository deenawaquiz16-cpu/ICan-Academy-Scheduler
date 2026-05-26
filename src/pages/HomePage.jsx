import "../App.css";

function HomePage({ onSelectCategory, onManageTeachers, onManageStudents, onOverallSchedule, onFindAvailability, onCalendar, onLiveView, stats }) {
  const { academyCount = 0, wfhCount = 0, totalStudents = 0, totalClasses = 0 } = stats || {};
  const totalTeachers = academyCount + wfhCount;

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>🤖 ICan Academy</h1>
        <p className="subtitle">AI-Powered Learning Scheduler</p>
      </div>
      
      <div className="category-cards">
        <button
          className="category-card main-dir teachers"
          onClick={() => onSelectCategory(null)}
        >
          <div className="card-icon">👩‍🏫</div>
          <h2>Teachers</h2>
          <p>View all academy & remote teachers</p>
          <div className="card-data-display">
            <span className="big-stat-number">{totalTeachers}</span>
            <span className="big-stat-label">Total Teachers</span>
          </div>
        </button>

        <button
          className="category-card main-dir students"
          onClick={onManageStudents}
        >
          <div className="card-icon">🎓</div>
          <h2>Students</h2>
          <p>Manage all student directory and info</p>
          <div className="card-data-display">
            <span className="big-stat-number">{totalStudents}</span>
            <span className="big-stat-label">Total Students</span>
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
        <button className="manage-link-btn live-btn" onClick={onLiveView}>
          📡 Live Data
        </button>
      </div>
    </div>
  );
}

export default HomePage;
