import { useState, useMemo } from "react";
import { getHoliday } from "../utils/holidayUtils";
import "../App.css";
import "./CalendarPage.css";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarPage({ onBack }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // Default to May 2026
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("ican-academy-notes");
    return saved ? JSON.parse(saved) : {};
  });
  const [currentNote, setCurrentNote] = useState("");

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
      days.push({
        day: i,
        dateKey,
        holiday: getHoliday(dateKey),
        hasNote: !!notes[dateKey]
      });
    }
    return days;
  }, [year, month, daysInMonth, firstDayOfMonth, notes]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
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

  const selectedDayInfo = useMemo(() => {
    if (!selectedDateKey) return null;
    return calendarDays.find(d => d?.dateKey === selectedDateKey);
  }, [selectedDateKey, calendarDays]);

  return (
    <div className="calendar-page">
      <div className="calendar-header-nav">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>📅 Philippine Calendar & Notes</h1>
      </div>

      <div className="calendar-layout">
        <div className="calendar-main">
          <div className="calendar-month-nav">
            <button onClick={handlePrevMonth}>&lt;</button>
            <h2>{MONTHS[month]} {year}</h2>
            <button onClick={handleNextMonth}>&gt;</button>
          </div>

          <div className="calendar-grid">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="weekday-header">{day}</div>
            ))}
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                className={`calendar-day ${!day ? "empty" : ""} ${day?.holiday ? "holiday" : ""} ${day?.dateKey === selectedDateKey ? "selected" : ""} ${day?.hasNote ? "has-note" : ""}`}
                onClick={() => handleDateClick(day)}
              >
                {day && (
                  <>
                    <span className="day-number">{day.day}</span>
                    {day.holiday && <span className="holiday-dot" title={day.holiday}>•</span>}
                    {day.hasNote && <span className="note-indicator">📝</span>}
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
            <h3>2026 Holidays</h3>
            <div className="holiday-list">
              {Object.entries(getPhilippineHolidays()).map(([date, name]) => (
                <div key={date} className="holiday-item">
                  <span className="holiday-date">{date}</span>
                  <span className="holiday-name">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to list all holidays for the sidebar
function getPhilippineHolidays() {
  return {
    "Jan 1": "New Year's Day",
    "Feb 25": "EDSA People Power",
    "Apr 2": "Maundy Thursday",
    "Apr 3": "Good Friday",
    "Apr 4": "Black Saturday",
    "Apr 9": "Araw ng Kagitingan",
    "May 1": "Labor Day",
    "Jun 12": "Independence Day",
    "Aug 21": "Ninoy Aquino Day",
    "Aug 31": "National Heroes Day",
    "Nov 1": "All Saints' Day",
    "Nov 2": "All Souls' Day",
    "Nov 30": "Bonifacio Day",
    "Dec 8": "Immaculate Conception",
    "Dec 25": "Christmas Day",
    "Dec 30": "Rizal Day",
    "Dec 31": "New Year's Eve"
  };
}

export default CalendarPage;
