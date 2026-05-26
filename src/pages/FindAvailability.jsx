import { useState, useMemo } from "react";
import { loadSchedules, loadTeachers, loadBlocks } from "../utils/storage";
import { TIME_SLOTS, DAYS } from "../utils/timeSlots";
import "./FindAvailability.css";

function FindAvailability({ onBack, onSelectTeacher }) {
  const [selectedDays, setSelectedDays] = useState(["Monday"]);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherType, setTeacherType] = useState("all"); // "all", "academy", "wfh"

  const [schedules] = useState(() => loadSchedules());
  const [allBlocks] = useState(() => loadBlocks());
  const [allTeachers] = useState(() => loadTeachers());
  const teacherList = useMemo(() => {
    let list = [...(allTeachers.academy || []), ...(allTeachers.wfh || [])];
    
    if (teacherType === "academy") {
      list = allTeachers.academy || [];
    } else if (teacherType === "wfh") {
      list = allTeachers.wfh || [];
    }

    return [...new Set(list)].sort();
  }, [allTeachers, teacherType]);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleTime = (timeKey) => {
    if (selectedTimes.includes(timeKey)) {
      setSelectedTimes(selectedTimes.filter(t => t !== timeKey));
    } else {
      setSelectedTimes([...selectedTimes, timeKey]);
    }
  };

  const clearTimes = () => setSelectedTimes([]);

  const availableTeachers = useMemo(() => {
    if (selectedTimes.length === 0) return [];

    return teacherList.filter(teacher => {
      // Must match search query if present
      if (searchQuery && !teacher.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      const teacherSched = schedules[teacher] || {};
      const teacherBlocks = allBlocks[teacher] || {};
      
      // Check every selected day and every selected time
      return selectedDays.every(day => {
        // If whole day is blocked, teacher is not available
        if (teacherBlocks.blockedDays?.includes(day)) return false;

        const daySched = teacherSched[day] || {};
        const dayBlocks = teacherBlocks.blockedSlots?.[day] || [];

        return selectedTimes.every(timeKey => {
          // Teacher is available ONLY IF:
          // 1. No class at this time (!daySched[timeKey])
          // 2. Not blocked at this time (!dayBlocks.includes(timeKey))
          return !daySched[timeKey] && !dayBlocks.includes(timeKey);
        });
      });
    });
  }, [selectedDays, selectedTimes, teacherList, schedules, allBlocks, searchQuery]);

  const timeSlotsToShow = TIME_SLOTS.filter(s => !s.isLunch);

  return (
    <div className="find-availability-page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>🔍 Find Availability</h1>
      </div>

      <div className="search-container">
        <div className="search-section">
          <h3>1. Select Days</h3>
          <div className="day-selector">
            {DAYS.map(day => (
              <button
                key={day}
                className={`day-btn ${selectedDays.includes(day) ? "active" : ""}`}
                onClick={() => toggleDay(day)}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="search-section">
          <div className="section-header">
            <h3>2. Select Time Slots</h3>
            {selectedTimes.length > 0 && (
              <button className="clear-btn" onClick={clearTimes}>Clear All</button>
            )}
          </div>
          <p className="helper-text">Select one or more slots. We'll find teachers available for ALL selected times on ALL selected days.</p>
          <div className="time-grid">
            {timeSlotsToShow.map(slot => (
              <button
                key={slot.key}
                className={`time-btn ${selectedTimes.includes(slot.key) ? "active" : ""}`}
                onClick={() => toggleTime(slot.key)}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        <div className="search-section">
          <h3>3. Filters (Optional)</h3>
          <div className="filter-controls">
            <div className="type-filters">
              <button 
                className={`filter-tab ${teacherType === "all" ? "active" : ""}`}
                onClick={() => setTeacherType("all")}
              >
                All
              </button>
              <button 
                className={`filter-tab ${teacherType === "academy" ? "active" : ""}`}
                onClick={() => setTeacherType("academy")}
              >
                Academy
              </button>
              <button 
                className={`filter-tab ${teacherType === "wfh" ? "active" : ""}`}
                onClick={() => setTeacherType("wfh")}
              >
                WFH
              </button>
            </div>
            <input
              type="text"
              placeholder="Search teacher name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="teacher-search-input"
            />
          </div>
        </div>
      </div>

      <div className="results-section">
        <h2>
          Available Teachers ({availableTeachers.length})
          {selectedTimes.length === 0 && <span className="hint"> — Select at least one time slot</span>}
        </h2>
        
        {selectedTimes.length > 0 && (
          <div className="teacher-results-grid">
            {availableTeachers.length > 0 ? (
              availableTeachers.map(teacher => {
                const isWFH = allTeachers.wfh?.includes(teacher);
                return (
                  <div 
                    key={teacher} 
                    className={`available-teacher-card clickable ${isWFH ? 'wfh' : 'academy'}`}
                    onClick={() => onSelectTeacher(teacher)}
                    title="Click to view full schedule"
                  >
                    <div className="teacher-avatar">{teacher.charAt(0)}</div>
                    <div className="teacher-info">
                      <span className="teacher-name">{teacher}</span>
                      <span className="teacher-type">{isWFH ? '🏠 Remote' : '🏫 Academy'}</span>
                    </div>
                    <div className="view-link">View Schedule →</div>
                  </div>
                );
              })
            ) : (
              <div className="no-results">
                <p>No teachers available for all selected slots. 😔</p>
                <p>Try selecting fewer days or different times.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FindAvailability;
