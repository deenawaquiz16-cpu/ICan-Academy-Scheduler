import { useState, useMemo } from "react";
import { loadSchedules, loadTeachers, loadStudents } from "../utils/storage";
import { TIME_SLOTS, getClassEndTime, getOccupiedSlots } from "../utils/timeSlots";
import "../App.css";
import "./OverallSchedule.css";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKEND = ["Saturday", "Sunday"];
const ALL_DAYS = [...WEEKDAYS, ...WEEKEND];

function OverallSchedule({ onBack }) {
  const [schedules] = useState(() => loadSchedules());
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [viewMode, setViewMode] = useState("day"); // "day" or "week"
  const [expandedTeacher, setExpandedTeacher] = useState(null);

  const [allTeachers] = useState(() => loadTeachers());
  const [allStudents] = useState(() => loadStudents());

  const teacherList = useMemo(() => {
    const list = [...(allTeachers.academy || []), ...(allTeachers.wfh || [])];
    return [...new Set(list)].sort();
  }, [allTeachers]);

  const teacherScheduleMap = useMemo(() => {
    const map = {};
    teacherList.forEach((teacher) => {
      map[teacher] = schedules[teacher] || {};
    });
    return map;
  }, [schedules, teacherList]);

  const getStudentInfo = (studentKey) => {
    const student = allStudents.find((s) => s.name === studentKey);
    if (!student) return { name: studentKey, className: "" };
    return { name: student.name, className: student.className || "" };
  };

  const getClassForCell = (teacher, day, timeKey) => {
    const cls = teacherScheduleMap[teacher]?.[day]?.[timeKey];
    if (!cls || timeKey === "12:00") return null;

    // A block starts if it's the actual start OR first slot after lunch
    const isStartOfBlock = cls.startKey === timeKey || (timeKey === "13:00" && cls.startKey < "12:00");
    if (!isStartOfBlock) return null;

    const allOccupied = getOccupiedSlots(cls.startKey, cls.duration || 25);
    // Double check that the current timeKey is actually part of this class
    if (!allOccupied.includes(timeKey)) return null;

    let blockOccupied = [];
    if (timeKey < "12:00") {
      blockOccupied = allOccupied.filter(k => k < "12:00");
    } else {
      blockOccupied = allOccupied.filter(k => k >= "13:00");
    }

    return { ...cls, occupied: blockOccupied };
  };

  const renderTableHeaders = () => (
    <thead>
      <tr>
        <th className="time-col">Time</th>
        {teacherList.map((teacher) => (
          <th key={teacher} className="teacher-col">
            <div className="teacher-header">
              <span className="teacher-initial">{teacher.charAt(0)}</span>
              <span className="teacher-name-text">{teacher}</span>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderGridRows = (day) => {
    return TIME_SLOTS.map((slot) => (
      <tr key={slot.key} className={slot.isLunch ? "lunch-row" : ""}>
        <td className="time-col">
          {slot.isLunch ? "BREAK" : slot.label}
        </td>
        {teacherList.map((teacher) => {
          const classInfo = getClassForCell(teacher, day, slot.key);
          
          // Solid Grid: Check if this slot is a continuation of a class
          const teacherSched = teacherScheduleMap[teacher]?.[day] || {};
          let isContinuation = false;
          let parentClass = null;

          if (!classInfo || slot.isLunch) {
            for (const [startKey, cls] of Object.entries(teacherSched)) {
              const occupied = getOccupiedSlots(startKey, cls.duration || 25);
              if (startKey !== slot.key && occupied.includes(slot.key)) {
                isContinuation = true;
                parentClass = cls;
                break;
              }
            }
          }

          // 1. Class Start Cell
          if (classInfo && !slot.isLunch) {
            const studentInfo = getStudentInfo(classInfo.studentName);
            const endTime = getClassEndTime(slot.key, classInfo.duration || 25);
            const isOnline = classInfo.classType?.toLowerCase() === "online";
            const typeClass = isOnline ? "online" : "f2f";

            return (
              <td key={teacher} className={`class-cell ${typeClass} class-start`}>
                <div className="class-card">
                  <strong className="class-student-name">{studentInfo.name}</strong>
                  <div className="class-card-body">
                    {studentInfo.className && <span className="class-badge">{studentInfo.className}</span>}
                    <span className="class-time">{slot.start}-{endTime}</span>
                    <span className={`type-badge ${typeClass}`}>
                      {isOnline ? "💻" : "👤"} {classInfo.classType}
                    </span>
                  </div>
                </div>
              </td>
            );
          }

          // 2. Class Continuation Cell
          if (isContinuation && !slot.isLunch) {
            const typeClass = parentClass.classType?.toLowerCase() === "online" ? "online" : "f2f";
            return (
              <td key={teacher} className={`class-cell ${typeClass} class-continuation`}></td>
            );
          }

          // 3. Empty or Lunch Cell (Default)
          return (
            <td key={teacher} className={slot.isLunch ? "lunch-cell" : "empty-cell"}>
              {slot.isLunch ? "—" : ""}
            </td>
          );
        })}
      </tr>
    ));
  };

  return (
    <div className="overall-schedule-page">
      <div className="overall-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>📋 Overall Schedule</h1>
      </div>

      <div className="overall-controls">
        <div className="view-toggle">
          <button className={`toggle-btn ${viewMode === "day" ? "active" : ""}`} onClick={() => setViewMode("day")}>📅 Day View</button>
          <button className={`toggle-btn ${viewMode === "week" ? "active" : ""}`} onClick={() => setViewMode("week")}>📆 Week View</button>
        </div>
        {viewMode === "day" && (
          <div className="day-selector">
            {DAYS.map((day) => (
              <button key={day} className={`day-btn ${selectedDay === day ? "active" : ""} ${["Saturday", "Sunday"].includes(day) ? "weekend" : ""}`} onClick={() => setSelectedDay(day)}>{day.slice(0, 3)}</button>
            ))}
          </div>
        )}
      </div>

      {viewMode === "day" && (
        <div className="overall-day-view">
          <h2>{selectedDay}'s Schedule</h2>
          <div className="day-schedule-grid">
            <table className="overall-day-table">
              {renderTableHeaders()}
              <tbody>{renderGridRows(selectedDay)}</tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "week" && (
        <div className="overall-week-view">
          {DAYS.map((day) => (
            <div key={day} className="week-day-section">
              <div className="week-day-header" onClick={() => setExpandedTeacher(expandedTeacher === day ? null : day)}>
                <span>{expandedTeacher === day ? "▼" : "▶"}</span>
                <h3>{day}</h3>
              </div>
              {expandedTeacher === day && (
                <div className="week-day-content">
                  <table className="overall-day-table">
                    {renderTableHeaders()}
                    <tbody>{renderGridRows(day)}</tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OverallSchedule;
