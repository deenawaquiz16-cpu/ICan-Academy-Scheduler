import { DAYS, DAYS_SHORT, TIME_SLOTS, getOccupiedSlots } from "../utils/timeSlots";
import "../App.css";

function ScheduleGrid({
  schedule,
  blocks,
  firstSelectedCell,
  onCellClick,
  onCellRightClick,
}) {
  const renderedCells = new Set();

  const getClassForCell = (day, timeKey) => {
    const daySchedule = schedule[day];
    if (!daySchedule) return null;
    for (const [startKey, cls] of Object.entries(daySchedule)) {
      const occupied = getOccupiedSlots(startKey, cls.duration || 25);
      if (occupied.includes(timeKey)) {
        return { ...cls, startKey, occupied, isStart: startKey === timeKey };
      }
    }
    return null;
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
                  if (renderedCells.has(cellKey)) return null;

                  const blocked = isBlocked(day, slot.key);
                  const classInfo = getClassForCell(day, slot.key);

                  // Blocked cell (no class)
                  if (blocked && !classInfo) {
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

                  // Empty cell
                  if (!classInfo) {
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
                  }

                  // Class cell
                  if (classInfo.isStart) {
                    const rowspan = classInfo.occupied.length;
                    const typeClass = classInfo.classType === "Online" ? "online" : "f2f";
                    classInfo.occupied.forEach((k) => renderedCells.add(`${day}-${k}`));

                    // Determine status display
                    const studentStatus = classInfo.studentStatus || "active";
                    const statusIndicator = studentStatus === "on-break" ? "🟡" : studentStatus === "stopped" ? "🔴" : "";

                    return (
                      <td
                        key={cellKey}
                        className={`schedule-cell class-${typeClass}`}
                        rowSpan={rowspan}
                        onClick={() => onCellClick(day, slot)}
                      >
                        <div className="class-block" title={`${classInfo.studentName} (${classInfo.classType}) - ${classInfo.duration}min\nBook: ${classInfo.book || "N/A"}`}>
                          <div className="class-student">
                            <span className="student-name-text">{classInfo.studentName}</span>
                            {statusIndicator && <span className="student-status-indicator" title={`Status: ${studentStatus}`}>{statusIndicator}</span>}
                          </div>
                          <div className="class-details">
                            <span className={`class-type-badge ${typeClass}`}>
                              {classInfo.classType === "Online" ? "💻" : "👤"} {classInfo.classType}
                            </span>
                          </div>
                          {classInfo.book && (
                            <div className="class-book" title={`Book: ${classInfo.book}`}>📖 {classInfo.book}</div>
                          )}
                          <div className="class-time-tag">{classInfo.duration}m</div>
                        </div>
                      </td>
                    );
                  }

                  return null;
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
