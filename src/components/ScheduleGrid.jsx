import { useState, useMemo } from "react";
import { DAYS, DAYS_SHORT, TIME_SLOTS, getOccupiedSlots } from "../utils/timeSlots";
import { loadStudents } from "../utils/storage";
import "../App.css";

function ScheduleGrid({
  teacherName,
  schedule,
  blocks,
  firstSelectedCell,
  onCellClick,
  onCellRightClick,
}) {
  const students = useMemo(() => loadStudents(), []);
  const studentNames = useMemo(() => {
    return new Set(students.map(s => (s.name || "").trim().toLowerCase()));
  }, [students]);
  const getClassForCell = (day, timeKey) => {
    const cls = schedule[day]?.[timeKey];
    if (!cls || timeKey === "12:00") return null;

    // A class "starts" a new block if:
    // 1. It's the actual start of the class
    // 2. OR it's the first slot after lunch (13:00) and the class spans across lunch
    const isStartOfBlock = cls.startKey === timeKey || (timeKey === "13:00" && cls.startKey < "12:00");
    if (!isStartOfBlock) return null;

    const allOccupied = getOccupiedSlots(cls.startKey, cls.duration || 25);
    
    // Calculate occupied slots for THIS specific block only (stopping at lunch or starting after)
    let blockOccupied = [];
    if (timeKey < "12:00") {
      blockOccupied = allOccupied.filter(k => k < "12:00");
    } else {
      blockOccupied = allOccupied.filter(k => k >= "13:00");
    }

    return { 
      ...cls, 
      occupied: blockOccupied, 
      isStart: true 
    };
  };

  const isBlocked = (day, timeKey) => {
    const teacherBlocks = blocks;
    if (!teacherBlocks) return false;
    if (teacherBlocks.blockedDays?.includes(day)) return true;
    return teacherBlocks.blockedSlots?.[day]?.includes(timeKey) || false;
  };

  const isDayBlocked = (day) => {
    return blocks?.blockedDays?.includes(day) || false;
  };

  return (
    <div className="schedule-grid-wrapper">
      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            {/* Spreadsheet Style Teacher Header */}
            <tr>
              <th colSpan="8" className="spreadsheet-teacher-header">
                {teacherName || "Teacher"} Schedule
              </th>
            </tr>
            {/* Spreadsheet Style Legend Row */}
            <tr className="legend-row">
              <th className="legend-label">Template</th>
              <th className="legend-item legend-free">FREE</th>
              <th className="legend-item legend-f2f">Student Name</th>
              <th className="legend-item legend-online">[Online] Student Name</th>
              <th className="legend-item legend-reserved">[Reserved]</th>
              <th colSpan="3" className="legend-empty"></th>
            </tr>
            {/* Spreadsheet Style Meta Header */}
            <tr className="meta-header-row">
              <th className="time-column-meta">TIME (PT)</th>
              <th colSpan="7" className="days-column-meta">Days</th>
            </tr>
            <tr>
              <th className="time-column-header">Time</th>
              {DAYS_SHORT.map((day, i) => (
                <th key={day} className={`day-header ${isDayBlocked(DAYS[i]) ? "day-header-blocked" : ""}`}>
                  <span className="day-full">{DAYS[i]}</span>
                  <span className="day-short">{day}</span>
                  {isDayBlocked(DAYS[i]) && <span className="day-blocked-badge">🚫</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot.key} className={slot.isLunch ? "lunch-row" : ""}>
                <td className="time-cell">
                  {slot.isLunch ? (
                    <span className="lunch-label">🍽️ Lunch</span>
                  ) : (
                    <span className="time-label">{slot.label}</span>
                  )}
                </td>
                {DAYS.map((day) => {
                  const cellKey = `${day}-${slot.key}`;
                  const blocked = isBlocked(day, slot.key);
                  const classInfo = schedule[day]?.[slot.key];
                  
                  // Solid Grid Rule: A class "starts" a block ONLY if the slot matches its true startKey
                  // (OR if it's the first slot after lunch for a class that spans lunch)
                  const isStartOfBlock = classInfo && (
                    classInfo.startKey === slot.key || 
                    (slot.key === "13:00" && classInfo.startKey < "12:00")
                  );
                  
                  const isContinuation = classInfo && !isStartOfBlock;

                  // 1. Class Cell (Start or Continuation)
                  if (classInfo && !slot.isLunch) {
                    const normalizedName = (classInfo.studentName || "").trim().toLowerCase();
                    const isFree = normalizedName === "free";
                    const isKnownStudent = studentNames.has(normalizedName);
                    
                    // If not in database and not FREE, it's a memo (likely Face-to-Face)
                    // If in database, use its saved classType
                    let effectiveType = classInfo.classType?.toLowerCase() || "online";
                    if (!isKnownStudent && !isFree) {
                      effectiveType = "face-to-face";
                    }

                    const isOnline = effectiveType === "online";
                    const typeClass = isOnline ? "online" : "f2f";
                    const studentStatus = classInfo.studentStatus || "active";
                    const statusIndicator = studentStatus === "on-break" ? "🟡" : studentStatus === "stopped" ? "🔴" : "";

                    return (
                      <td
                        key={cellKey}
                        className={`schedule-cell class-${typeClass} ${isStartOfBlock ? "class-start" : "class-continuation"}`}
                        onClick={() => onCellClick(day, slot)}
                      >
                        <div className="class-block" title={`${classInfo.studentName} (${effectiveType}) - ${classInfo.duration}min\nBook: ${classInfo.book || "N/A"}`}>
                          <div className="class-student">
                            <span className="student-name-text">{classInfo.studentName}</span>
                            {statusIndicator && <span className="student-status-indicator" title={`Status: ${studentStatus}`}>{statusIndicator}</span>}
                          </div>
                          {classInfo.className && (
                            <div className="class-name-tag">{classInfo.className}</div>
                          )}
                          <div className="class-details">
                            <span className={`class-type-badge ${typeClass}`}>
                              {isOnline ? "💻" : "👤"} {effectiveType}
                            </span>
                          </div>
                        </div>
                      </td>
                    );
                  }

                  // 2. Blocked Cell
                  if (blocked && !slot.isLunch) {
                    return (
                      <td
                        key={cellKey}
                        className="schedule-cell blocked-cell"
                        onClick={() => onCellClick(day, slot)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onCellRightClick(day, slot, e);
                        }}
                        title="Blocked — right-click to manage"
                      >
                        <span className="blocked-icon">🔒</span>
                      </td>
                    );
                  }

                  // 4. Default Empty or Lunch Cell
                  const isFirstSelected = firstSelectedCell?.day === day && firstSelectedCell?.timeSlot?.key === slot.key;
                  return (
                    <td
                      key={cellKey}
                      className={`schedule-cell ${slot.isLunch ? "lunch-cell" : ""} ${isFirstSelected ? "selected-cell" : ""}`}
                      onClick={() => !slot.isLunch && onCellClick(day, slot)}
                      onContextMenu={(e) => {
                        if (!slot.isLunch) {
                          e.preventDefault();
                          onCellRightClick(day, slot, e);
                        }
                      }}
                    >
                      {slot.isLunch ? (
                        <span className="lunch-text">Break</span>
                      ) : (
                        <span className="empty-slot">+</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ScheduleGrid;
