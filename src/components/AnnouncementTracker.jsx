import { useState, useMemo, useEffect } from "react";
import { loadStudents } from "../utils/storage";
import "./AnnouncementTracker.css";

function AnnouncementTracker() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentStatus, setSentStatus] = useState(() => {
    const saved = localStorage.getItem("ican-holiday-sent-students");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const allStudents = loadStudents();
    setStudents(allStudents.filter(s => s.status === 'active'));
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, searchQuery]);

  const toggleSent = (id) => {
    const updated = { ...sentStatus, [id]: !sentStatus[id] };
    setSentStatus(updated);
    localStorage.setItem("ican-holiday-sent-students", JSON.stringify(updated));
  };

  const stats = useMemo(() => {
    const sentCount = students.filter(s => sentStatus[s.id]).length;
    return {
      sent: sentCount,
      total: students.length,
      percent: students.length > 0 ? Math.round((sentCount / students.length) * 100) : 0
    };
  }, [students, sentStatus]);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all tracking? This will uncheck all students.")) {
      setSentStatus({});
      localStorage.removeItem("ican-holiday-sent-students");
    }
  };

  return (
    <div className="dashboard-card announcement-tracker">
      <div className="tracker-header">
        <div className="tracker-title-area">
          <h2>Holiday Announcement Tracking</h2>
          <div className="tracker-stats-pill">
            {stats.sent} / {stats.total} Sent ({stats.percent}%)
          </div>
        </div>
        <button className="reset-tracker-btn" onClick={handleReset} title="Clear all checkboxes">
          🔄 Reset
        </button>
      </div>

      <div className="tracker-controls">
        <input 
          type="text" 
          placeholder="Search students..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tracker-search"
        />
      </div>

      <div className="tracker-list">
        {filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
            <div 
              key={student.id} 
              className={`tracker-item ${sentStatus[student.id] ? 'is-sent' : ''}`}
              onClick={() => toggleSent(student.id)}
            >
              <div className="student-info">
                <span className="student-name">{student.name}</span>
                {student.currentTeacher && (
                  <span className="student-teacher-tag">{student.currentTeacher}</span>
                )}
              </div>
              <div className="checkbox-wrapper">
                <input 
                  type="checkbox" 
                  checked={!!sentStatus[student.id]} 
                  readOnly 
                />
                <span className="checkbox-custom"></span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-tracker">
            {searchQuery ? "No matching students found." : "No active students to track."}
          </div>
        )}
      </div>

      <div className="tracker-progress-bar">
        <div className="progress-fill" style={{ width: `${stats.percent}%` }}></div>
      </div>
    </div>
  );
}

export default AnnouncementTracker;
