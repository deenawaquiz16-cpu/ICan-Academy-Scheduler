import { useState } from "react";
import { DAYS, TIME_SLOTS, getClassEndTime } from "../utils/timeSlots";
import "../App.css";

function BlockForm({
  teacherName,
  day,
  timeSlot,
  onSave,
  onClose,
}) {
  const [startTimeKey, setStartTimeKey] = useState(timeSlot?.key || "08:00");
  const [duration, setDuration] = useState(25);
  const [selectedDays, setSelectedDays] = useState([day]);
  const [error, setError] = useState("");

  const startTimeLabel = TIME_SLOTS.find(s => s.key === startTimeKey)?.start || "";
  const displayEndTime = getClassEndTime(startTimeKey, duration);

  const handleDayToggle = (d) => {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const selectAllDays = () => setSelectedDays([...DAYS]);
  const selectWeekdays = () => setSelectedDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const clearDays = () => setSelectedDays([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      setError("Please select at least one day.");
      return;
    }
    onSave(selectedDays, startTimeKey, duration);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Custom Block</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Teacher</label>
              <input type="text" value={teacherName} disabled />
            </div>

            <div className="form-group">
              <label>Start Time</label>
              <div className="start-time-grid">
                {TIME_SLOTS.filter(s => !s.isLunch).map((slot) => (
                  <button
                    key={slot.key}
                    type="button"
                    className={`time-pill ${startTimeKey === slot.key ? "selected" : ""}`}
                    onClick={() => setStartTimeKey(slot.key)}
                  >
                    {slot.start}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Duration</label>
              <div className="duration-segmented">
                {[25, 50, 100, 150, 200, 300].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`duration-pill ${duration === d ? "selected" : ""}`}
                    onClick={() => setDuration(d)}
                  >
                    {d >= 50 ? `${d/50}h` : `${d}m`}
                  </button>
                ))}
              </div>
            </div>

            <div className="schedule-preview-card">
              <div className="preview-label">Block Schedule</div>
              <div className="preview-time">
                <span className="preview-day">
                  {selectedDays.length === 7 ? "Daily" : 
                   selectedDays.length === 5 && !selectedDays.includes("Saturday") && !selectedDays.includes("Sunday") ? "Weekdays" :
                   selectedDays.map(d => d.slice(0,3)).join(", ")}
                </span>
                <span className="preview-range">{startTimeLabel} – {displayEndTime}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Select Days</label>
              <div className="day-presets" style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
                <button type="button" className="preset-btn" onClick={selectAllDays}>All</button>
                <button type="button" className="preset-btn" onClick={selectWeekdays}>Mon-Fri</button>
                <button type="button" className="preset-btn" onClick={clearDays}>Clear</button>
              </div>
              <div className="day-checkboxes">
                {DAYS.map((d) => (
                  <label key={d} className={`day-checkbox ${selectedDays.includes(d) ? "selected" : ""}`}>
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(d)}
                      onChange={() => handleDayToggle(d)}
                    />
                    <span>{d.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <div className="form-actions-right">
                <button type="button" className="cancel-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="save-btn block-btn">
                  Block Slots
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BlockForm;
