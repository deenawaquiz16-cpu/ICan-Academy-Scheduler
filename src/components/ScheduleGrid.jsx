import { DAYS, DAYS_SHORT, TIME_SLOTS, getOccupiedSlots } from "../utils/timeSlots";
import "../App.css";

function ScheduleGrid({
  schedule,
  blocks,
  firstSelectedCell,
  onCellClick,
  onCellRightClick,
}) {
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
                  const classInfo = getClassForCell(day, slot.key);
                  
                  // Check if this slot is a continuation of a class that started earlier
                  const daySchedule = schedule[day] || {};
                  let isContinuation = false;
                  let parentClass = null;

                  for (const [startKey, cls] of Object.entries(daySchedule)) {
                    const occupied = getOccupiedSlots(startKey, cls.duration || 25);
                    if (startKey !== slot.key && occupied.includes(slot.key)) {
                      isContinuation = true;
                      parentClass = cls;
                      break;
                    }
                  }

                  // 1. Class Start Cell
                  if (classInfo && classInfo.isStart && !slot.isLunch) {
                    const isOnline = classInfo.classType?.toLowerCase() === "online";
                    const typeClass = isOnline ? "online" : "f2f";
                    const studentStatus = classInfo.studentStatus || "active";
                    const statusIndicator = studentStatus === "on-break" ? "🟡" : studentStatus === "stopped" ? "🔴" : "";

                    return (
                      <td
                        key={cellKey}
                        className={`schedule-cell class-${typeClass} class-start`}
                        onClick={() => onCellClick(day, slot)}
                      >
                        <div className="class-block" title={`${classInfo.studentName} (${classInfo.classType}) - ${classInfo.duration}min\nBook: ${classInfo.book || "N/A"}`}>
                          <div className="class-student">
                            <span className="student-name-text">{classInfo.studentName}</span>
                            {statusIndicator && <span className="student-status-indicator" title={`Status: ${studentStatus}`}>{statusIndicator}</span>}
                          </div>
                          <div className="class-details">
                            <span className={`class-type-badge ${typeClass}`}>
                              {isOnline ? "💻" : "👤"} {classInfo.classType}
                            </span>
                          </div>
                          <div className="class-time-tag">{classInfo.duration}m</div>
                        </div>
                      </td>
                    );
                  }

                  // 2. Class Continuation Cell
                  if (isContinuation && !slot.isLunch) {
                    const typeClass = parentClass.classType?.toLowerCase() === "online" ? "online" : "f2f";
                    return (
                      <td 
                        key={cellKey} 
                        className={`schedule-cell class-${typeClass} class-continuation`}
                        onClick={() => onCellClick(day, slot)}
                      ></td>
                    );
                  }

                  // 3. Blocked Cell
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

                  // 4. Default Empty or Lunch Cell (ALWAYS RENDER A TD)
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
