import { useState, useMemo, useEffect } from "react";
import { loadStudents } from "../utils/storage";
import "./AnnouncementTracker.css";

function AnnouncementTracker() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideNotAffected, setHideNotAffected] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sentStatus, setSentStatus] = useState(() => {
    const saved = localStorage.getItem("ican-holiday-sent-students");
    return saved ? JSON.parse(saved) : {};
  });
  const [notAffectedStatus, setNotAffectedStatus] = useState(() => {
    const saved = localStorage.getItem("ican-holiday-not-affected");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const allStudents = loadStudents();
    setStudents(allStudents.filter(s => s.status === 'active'));
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (hideNotAffected && notAffectedStatus[s.id]) return false;
      return matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, searchQuery, hideNotAffected, notAffectedStatus]);

  const toggleSent = (id) => {
    if (notAffectedStatus[id]) return; // Can't send to not affected
    const updated = { ...sentStatus, [id]: !sentStatus[id] };
    setSentStatus(updated);
    localStorage.setItem("ican-holiday-sent-students", JSON.stringify(updated));
  };

  const toggleNotAffected = (e, id) => {
    e.stopPropagation();
    const updated = { ...notAffectedStatus, [id]: !notAffectedStatus[id] };
    setNotAffectedStatus(updated);
    localStorage.setItem("ican-holiday-not-affected", JSON.stringify(updated));
    
    // If marking as N/A, remove from sent
    if (updated[id] && sentStatus[id]) {
      const updatedSent = { ...sentStatus };
      delete updatedSent[id];
      setSentStatus(updatedSent);
      localStorage.setItem("ican-holiday-sent-students", JSON.stringify(updatedSent));
    }
  };

  const stats = useMemo(() => {
    const affectedStudents = students.filter(s => !notAffectedStatus[s.id]);
    const sentCount = affectedStudents.filter(s => sentStatus[s.id]).length;
    return {
      sent: sentCount,
      total: affectedStudents.length,
      percent: affectedStudents.length > 0 ? Math.round((sentCount / affectedStudents.length) * 100) : 0
    };
  }, [students, sentStatus, notAffectedStatus]);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all tracking? This will uncheck all students.")) {
      setSentStatus({});
      setNotAffectedStatus({});
      localStorage.removeItem("ican-holiday-sent-students");
      localStorage.removeItem("ican-holiday-not-affected");
    }
  };

  const summaryData = useMemo(() => {
    const sent = students.filter(s => sentStatus[s.id]).sort((a, b) => a.name.localeCompare(b.name));
    const exempted = students.filter(s => notAffectedStatus[s.id]).sort((a, b) => a.name.localeCompare(b.name));
    const pending = students.filter(s => !sentStatus[s.id] && !notAffectedStatus[s.id]).sort((a, b) => a.name.localeCompare(b.name));
    
    return { sent, exempted, pending };
  }, [students, sentStatus, notAffectedStatus]);

  return (
    <div className="dashboard-card announcement-tracker">
      <div className="tracker-header">
        <div className="tracker-title-area">
          <h2>Holiday Announcement Tracking</h2>
          <div className="tracker-stats-pill">
            {stats.sent} / {stats.total} Affected Sent ({stats.percent}%)
          </div>
        </div>
        <div className="tracker-header-actions">
          <label className="filter-toggle">
            <input 
              type="checkbox" 
              checked={hideNotAffected} 
              onChange={(e) => setHideNotAffected(e.target.checked)} 
            />
            <span>Hide Not Affected</span>
          </label>
          <button className="reset-tracker-btn" onClick={handleReset} title="Clear all checkboxes">
            🔄 Reset
          </button>
          <button className="summary-btn" onClick={() => setShowSummary(true)}>
            📊 Summary
          </button>
        </div>
      </div>

      {showSummary && (
        <div className="tracker-modal-overlay" onClick={() => setShowSummary(false)}>
          <div className="tracker-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Announcement Summary</h2>
              <button className="close-modal" onClick={() => setShowSummary(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="summary-section">
                <h3 className="sent-title">✅ Sent ({summaryData.sent.length})</h3>
                <div className="summary-list">
                  {summaryData.sent.length > 0 ? (
                    summaryData.sent.map((s, i) => <div key={s.id} className="summary-name">{i+1}. {s.name}</div>)
                  ) : <p className="empty-text">No announcements sent yet.</p>}
                </div>
              </div>

              <div className="summary-section">
                <h3 className="exempt-title">🚫 Exempted ({summaryData.exempted.length})</h3>
                <div className="summary-list">
                  {summaryData.exempted.length > 0 ? (
                    summaryData.exempted.map((s, i) => <div key={s.id} className="summary-name">{i+1}. {s.name}</div>)
                  ) : <p className="empty-text">No students exempted.</p>}
                </div>
              </div>

              <div className="summary-section">
                <h3 className="pending-title">⏳ Remaining ({summaryData.pending.length})</h3>
                <div className="summary-list">
                  {summaryData.pending.length > 0 ? (
                    summaryData.pending.map((s, i) => <div key={s.id} className="summary-name">{i+1}. {s.name}</div>)
                  ) : <p className="empty-text">All caught up!</p>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="close-btn-footer" onClick={() => setShowSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

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
          filteredStudents.map((student, index) => {
            const isSent = !!sentStatus[student.id];
            const isNA = !!notAffectedStatus[student.id];
            
            return (
              <div 
                key={student.id} 
                className={`tracker-item ${isSent ? 'is-sent' : ''} ${isNA ? 'is-na' : ''}`}
                onClick={() => toggleSent(student.id)}
              >
                <div className="student-info">
                  <span className="student-name">
                    <span className="student-index">{index + 1}.</span> {student.name}
                  </span>
                  <div className="student-meta-row">
                    {student.currentTeacher && (
                      <span className="student-teacher-tag">{student.currentTeacher}</span>
                    )}
                    {isNA && <span className="na-badge">Not Affected</span>}
                  </div>
                </div>
                <div className="tracker-item-actions">
                  <button 
                    className={`na-toggle-btn ${isNA ? 'active' : ''}`}
                    onClick={(e) => toggleNotAffected(e, student.id)}
                    title={isNA ? "Mark as Affected" : "Mark as Not Affected"}
                  >
                    N/A
                  </button>
                  <div className="checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      checked={isSent} 
                      disabled={isNA}
                      readOnly 
                    />
                    <span className="checkbox-custom"></span>
                  </div>
                </div>
              </div>
            );
          })
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
