import { useState, useMemo } from "react";
import { DAYS, DURATIONS, getOccupiedSlots, TIME_SLOTS } from "../utils/timeSlots";
import { loadTeachers, loadStudents, getScheduledStudents } from "../utils/storage";
import "../App.css";

function ClassForm({
  editingClass,
  teacherName,
  day,
  timeSlot,
  defaultDuration,
  schedule,
  onSave,
  onDelete,
  onMultiDaySave,
  onClose,
}) {
  const allTeachers = loadTeachers();
  const allStudents = loadStudents();

  // Flatten all teachers into one list
  const teacherList = useMemo(() => {
    const list = [...(allTeachers.academy || []), ...(allTeachers.wfh || [])];
    return [...new Set(list)].sort();
  }, [allTeachers]);

  // Get students already scheduled for this teacher
  const scheduledStudents = useMemo(() => getScheduledStudents(schedule, teacherName), [schedule, teacherName]);

  // Filter students: show only those NOT already scheduled (unless editing the same student)
  const availableStudents = useMemo(() => {
    const filtered = allStudents.filter((s) => {
      const studentKey = s.name || s;
      if (editingClass && editingClass.studentName === studentKey) return true;
      return !scheduledStudents.has(studentKey);
    });
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [allStudents, scheduledStudents, editingClass]);

  const [studentName, setStudentName] = useState(editingClass?.studentName || "");
  const [selectedTeacher, setSelectedTeacher] = useState(editingClass?.teacherName || teacherName);
  const [classType, setClassType] = useState(editingClass?.classType || "Online");
  const [duration, setDuration] = useState(editingClass?.duration || defaultDuration || 25);
  const [className, setClassName] = useState(editingClass?.className || "");
  const [book, setBook] = useState(editingClass?.book || "");
  const [selectedDays, setSelectedDays] = useState(editingClass ? [editingClass.day] : [day]);
  const [startTimeKey, setStartTimeKey] = useState(editingClass?.timeKey || timeSlot?.key || "08:00");
  const [error, setError] = useState("");

  const handleStudentSelect = (selectedName) => {
    setStudentName(selectedName);
    
    // Auto-fill from student data if not editing
    if (!isEditing && selectedName !== "") {
      const studentData = allStudents.find((s) => s.name === selectedName);
      if (studentData) {
        if (studentData.classType) {
          const normalizedType = studentData.classType === "online" ? "Online" : "Face-to-Face";
          setClassType(normalizedType);
        }
        if (studentData.className) setClassName(studentData.className);
        if (studentData.book) setBook(studentData.book);
        if (studentData.currentTeacher) setSelectedTeacher(studentData.currentTeacher);
        if (studentData.schedules && studentData.schedules.length > 0) {
          const firstSched = studentData.schedules[0];
          if (firstSched.duration) setDuration(firstSched.duration);
          if (firstSched.days) setSelectedDays(firstSched.days);
        }
      }
    }
  };

  const isEditing = !!editingClass;
  
  // Custom display end time logic based on user request
  const getDisplayEndTime = (startKey, dur) => {
    const slotIdx = TIME_SLOTS.findIndex(s => s.key === startKey);
    if (slotIdx === -1) return "";
    
    const startSlot = TIME_SLOTS[slotIdx];
    const [h, m] = startSlot.key.split(":").map(Number);
    
    // Exact duration logic: End Time = Start Time + Duration
    // For 100 min classes, add 10 min break (total 110 min)
    let extraMinutes = dur;
    if (dur === 100) extraMinutes = 110;

    const totalMinutes = m + extraMinutes;
    let endH = h + Math.floor(totalMinutes / 60);
    let endM = totalMinutes % 60;
    
    const period = endH >= 12 ? "PM" : "AM";
    const displayHour = endH > 12 ? endH - 12 : endH === 0 ? 12 : endH;
    const displayMinute = endM.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const startTimeLabel = TIME_SLOTS.find(s => s.key === startTimeKey)?.start || "";
  const displayEndTime = getDisplayEndTime(startTimeKey, duration);

  const isSlotOccupied = (checkDay, timeKey) => {
    const daySchedule = schedule[checkDay];
    if (!daySchedule) return false;
    for (const [startKey, cls] of Object.entries(daySchedule)) {
      const occupied = getOccupiedSlots(startKey, cls.duration || 25);
      if (occupied.includes(timeKey)) return true;
    }
    return false;
  };

  const checkOverlap = (checkDay, excludeStartKey = null) => {
    const occupiedSlots = getOccupiedSlots(startTimeKey, duration);
    for (const slotKey of occupiedSlots) {
      if (excludeStartKey) {
        const excludedOccupied = getOccupiedSlots(excludeStartKey, editingClass?.duration || 25);
        if (excludedOccupied.includes(slotKey)) continue;
      }
      if (isSlotOccupied(checkDay, slotKey)) return slotKey;
    }
    return null;
  };

  const handleDayToggle = (d) => {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!studentName) {
      setError("Please select a student.");
      return;
    }
    if (!selectedTeacher) {
      setError("Please select a teacher.");
      return;
    }

    for (const d of selectedDays) {
      const conflictSlot = checkOverlap(d, isEditing ? editingClass.timeKey : null);
      if (conflictSlot) {
        setError(`Schedule conflict on ${d}. A class already occupies this time range.`);
        return;
      }
    }

    const classData = {
      studentName,
      teacherName: selectedTeacher,
      classType,
      className: className.trim(),
      book: book.trim(),
      duration,
    };

    if (selectedDays.length === 1) {
      onSave({ ...classData, day: selectedDays[0], timeKey: startTimeKey });
    } else {
      const currentSlot = TIME_SLOTS.find(s => s.key === startTimeKey);
      onMultiDaySave(selectedDays, currentSlot, classData);
    }
  };

  const handleDelete = () => {
    if (isEditing) {
      onDelete(editingClass.day, editingClass.timeKey);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? "Edit Class" : "Add Class"}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Student Selection */}
            <div className="form-group">
              <label>Student *</label>
              <div className="student-select-grid">
                <button
                  type="button"
                  className={`student-select-card ${studentName === "" ? "selected" : ""}`}
                  onClick={() => handleStudentSelect("")}
                >
                  <span className="student-select-placeholder">— Select Student —</span>
                </button>
                {availableStudents.map((s) => {
                  const studentKey = s.name || s;
                  const studentData = allStudents.find((st) => st.name === studentKey) || {};
                  const isSelected = studentName === studentKey;
                  const studentStatus = studentData.status || "active";
                  return (
                    <button
                      key={studentKey}
                      type="button"
                      className={`student-select-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleStudentSelect(studentKey)}
                    >
                      <div className="student-select-info">
                        <span className="student-select-english">{studentKey}</span>
                      </div>
                      <div className="student-select-meta">
                        <span className={`student-status-badge student-status-${studentStatus}`}>
                          {studentStatus === "active" ? "🟢" : studentStatus === "on-break" ? "🟡" : "🔴"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Teacher *</label>
                <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                  <option value="">— Select Teacher —</option>
                  {teacherList.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group half">
                <label>Class Type</label>
                <select value={classType} onChange={(e) => setClassType(e.target.value)}>
                  <option value="Online">💻 Online</option>
                  <option value="Face-to-Face">👤 Face-to-Face</option>
                </select>
              </div>
            </div>

            {/* NEW TIME SELECTION UI */}
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
                {[25, 50, 100].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`duration-pill ${duration === d ? "selected" : ""}`}
                    onClick={() => setDuration(d)}
                  >
                    {d} mins
                  </button>
                ))}
              </div>
            </div>

            {/* PREVIEW CARD */}
            <div className="schedule-preview-card">
              <div className="preview-label">Selected Schedule</div>
              <div className="preview-time">
                <span className="preview-day">{selectedDays.length === 1 ? selectedDays[0] : selectedDays.map(d => d.slice(0,3)).join(", ")}</span>
                <span className="preview-range">{startTimeLabel} – {displayEndTime}</span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Class Name</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., ESL 101"
                />
              </div>
              <div className="form-group half">
                <label>Book</label>
                <input
                  type="text"
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  placeholder="e.g., Grammar in Use"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Apply to Multiple Days</label>
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
              {isEditing && (
                <button type="button" className="delete-btn" onClick={handleDelete}>
                  🗑️ Delete
                </button>
              )}
              <div className="form-actions-right">
                <button type="button" className="cancel-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {isEditing ? "Update" : "Add Class"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClassForm;
