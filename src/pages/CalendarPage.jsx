import { useState, useMemo } from "react";
import { getHoliday, getAllHolidaysForYear } from "../utils/holidayUtils";
import "../App.css";
import "./CalendarPage.css";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarPage({ onBack }) {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(new Date()); // Default to current month
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("ican-academy-notes");
    return saved ? JSON.parse(saved) : {};
  });
  const [currentNote, setCurrentNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sentAnnouncements, setSentAnnouncements] = useState(() => {
    const saved = localStorage.getItem("ican-holiday-announcements");
    return saved ? JSON.parse(saved) : {};
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    // Padding for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const d = new Date(year, month, i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === i;

      days.push({
        day: i,
        dateKey,
        isWeekend,
        isToday,
        holiday: getHoliday(dateKey),
        hasNote: !!notes[dateKey],
        note: notes[dateKey] || ""
      });
    }
    return days;
  }, [year, month, daysInMonth, firstDayOfMonth, notes, today]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setSelectedDateKey(todayKey);
    setCurrentNote(notes[todayKey] || "");
  };

  const handleDateClick = (day) => {
    if (!day) return;
    setSelectedDateKey(day.dateKey);
    setCurrentNote(notes[day.dateKey] || "");
  };

  const handleSaveNote = () => {
    const updatedNotes = { ...notes };
    if (currentNote.trim()) {
      updatedNotes[selectedDateKey] = currentNote;
    } else {
      delete updatedNotes[selectedDateKey];
    }
    setNotes(updatedNotes);
    localStorage.setItem("ican-academy-notes", JSON.stringify(updatedNotes));
  };

  const toggleAnnouncement = (dateKey) => {
    const updated = { ...sentAnnouncements, [dateKey]: !sentAnnouncements[dateKey] };
    setSentAnnouncements(updated);
    localStorage.setItem("ican-holiday-announcements", JSON.stringify(updated));
  };

  const selectedDayInfo = useMemo(() => {
    if (!selectedDateKey) return null;
    return calendarDays.find(d => d?.dateKey === selectedDateKey);
  }, [selectedDateKey, calendarDays]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return Object.entries(notes)
      .filter(([date, note]) => note.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b[0].localeCompare(a[0])); // Recent first
  }, [notes, searchQuery]);

  const handleSearchResultClick = (dateKey) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    setCurrentDate(new Date(y, m - 1, 1));
    setSelectedDateKey(dateKey);
    setCurrentNote(notes[dateKey] || "");
  };

  return (
    <div className="calendar-page">
      <div className="calendar-header-nav">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>📅 Philippine Calendar & Notes</h1>
      </div>

      <div className="calendar-layout">
        <div className="calendar-main">
          <div className="calendar-month-nav">
            <div className="month-nav-left">
              <button onClick={handlePrevMonth}>&lt;</button>
              <h2>{MONTHS[month]} {year}</h2>
              <button onClick={handleNextMonth}>&gt;</button>
            </div>
            <button className="today-btn" onClick={handleGoToToday}>Today</button>
          </div>

          <div className="calendar-grid">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className={`weekday-header ${day === "Sun" || day === "Sat" ? "weekend" : ""}`}>{day}</div>
            ))}
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                className={`calendar-day ${!day ? "empty" : ""} ${day?.holiday ? "holiday" : ""} ${day?.isWeekend ? "weekend" : ""} ${day?.isToday ? "today" : ""} ${day?.dateKey === selectedDateKey ? "selected" : ""} ${day?.hasNote ? "has-note" : ""}`}
                onClick={() => handleDateClick(day)}
              >
                {day && (
                  <>
                    <div className="cal-day-header">
                      <span className="day-number">{day.day}</span>
                      {day.holiday && <span className="holiday-dot" title={day.holiday}>•</span>}
                    </div>
                    {day.hasNote && (
                      <div className="day-note-preview">
                        {day.note}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="calendar-sidebar">
          {selectedDateKey ? (
            <div className="note-section">
              <h3>Notes for {selectedDateKey}</h3>
              {selectedDayInfo?.holiday && (
                <div className="holiday-badge">{selectedDayInfo.holiday}</div>
              )}
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Write your notes for this day..."
              />
              <button className="save-note-btn" onClick={handleSaveNote}>Save Note</button>
            </div>
          ) : (
            <div className="no-selection">
              <p>Select a date to view holidays or add notes.</p>
            </div>
          )}

          <div className="upcoming-holidays">
            <h3>{year} Holiday Announcements</h3>
            <div className="holiday-list">
              {Object.entries(getAllHolidaysForYear(year)).map(([dateKey, name]) => {
                const [,, day] = dateKey.split("-");
                const mIdx = parseInt(dateKey.split("-")[1]) - 1;
                const displayDate = `${MONTHS[mIdx].substring(0, 3)} ${day}`;
                const isSent = !!sentAnnouncements[dateKey];
                
                return (
                  <div 
                    key={dateKey} 
                    className={`holiday-item ${isSent ? 'sent' : ''}`}
                    onClick={() => toggleAnnouncement(dateKey)}
                    title={isSent ? "Announcement Sent" : "Mark as Sent"}
                  >
                    <div className="holiday-info">
                      <span className="holiday-date">{displayDate}</span>
                      <span className="holiday-name">{name}</span>
                    </div>
                    <div className="sent-indicator">
                      {isSent ? "✅ Sent" : "🔔 Send?"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="search-notes-section">
            <h3>Search Notes</h3>
            <input
              type="text"
              placeholder="Search in notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="note-search-input"
            />
            {searchQuery && (
              <div className="search-results">
                {searchResults.length > 0 ? (
                  searchResults.map(([date, note]) => (
                    <div 
                      key={date} 
                      className="search-result-item"
                      onClick={() => handleSearchResultClick(date)}
                    >
                      <div className="result-date">{date}</div>
                      <div className="result-preview">{note}</div>
                    </div>
                  ))
                ) : (
                  <p className="no-results">No notes found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
