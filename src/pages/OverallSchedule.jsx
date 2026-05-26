import { useState, useMemo } from "react";
import { loadSchedules, loadTeachers, loadStudents } from "../utils/storage";
import { TIME_SLOTS, getClassEndTime } from "../utils/timeSlots";
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

  // Flatten all teachers
  const teacherList = useMemo(() => {
    const list = [...(allTeachers.academy || []), ...(allTeachers.wfh || [])];
    return [...new Set(list)].sort();
  }, [allTeachers]);

  // Build a lookup: teacherName -> day -> timeKey -> class
  const teacherScheduleMap = useMemo(() => {
    const map = {};
    teacherList.forEach((teacher) => {
      map[teacher] = schedules[teacher] || {};
    });
    return map;
  }, [schedules, teacherList]);

  // Get student display info
  const getStudentInfo = (studentKey) => {
    const student = allStudents.find((s) => s.name === studentKey);
    if (!student) return { name: studentKey, className: "" };
    return {
      name: student.name,
      className: student.className || "",
    };
  };

  // Count total classes
  const totalClasses = useMemo(() => {
    let count = 0;
    const seenSessions = new Set();
    teacherList.forEach((teacher) => {
      const teacherSched = schedules[teacher] || {};
      Object.entries(teacherSched).forEach(([day, daySched]) => {
        if (daySched && typeof daySched === "object") {
          Object.entries(daySched).forEach(([timeKey, slotData]) => {
            const scheduleId = slotData.scheduleId;
            if (scheduleId) {
              const sessionKey = `${teacher}-${day}-${scheduleId}`;
              if (!seenSessions.has(sessionKey)) {
                count++;
                seenSessions.add(sessionKey);
              }
            } else {
              // Legacy fallback
              count++;
            }
          });
        }
      });
    });
    return count;
  }, [schedules, teacherList]);

  const timeSlotsToShow = TIME_SLOTS.filter((s) => !s.isLunch);

  return (
    <div className="overall-schedule-page">
      <div className="overall-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>📋 Overall Schedule</h1>
        <div className="overall-stats">
          <span className="stat-badge">{teacherList.length} teachers</span>
          <span className="stat-badge">{totalClasses} classes</span>
        </div>
      </div>

      <div className="overall-controls">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === "day" ? "active" : ""}`}
            onClick={() => setViewMode("day")}
          >
            📅 Day View
          </button>
          <button
            className={`toggle-btn ${viewMode === "week" ? "active" : ""}`}
            onClick={() => setViewMode("week")}
          >
            📆 Week View
          </button>
        </div>

        {viewMode === "day" && (
          <div className="day-selector">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                className={`day-btn ${selectedDay === day ? "active" : ""} ${WEEKEND.includes(day) ? "weekend" : ""}`}
                onClick={() => setSelectedDay(day)}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
      </div>

      {viewMode === "day" && (
        <div className="overall-day-view">
          <h2>{selectedDay}'s Schedule</h2>
          <div className="day-schedule-grid">
            <table className="overall-day-table">
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
              <tbody>
                {timeSlotsToShow.map((slot) => {
                  const hasAnyClass = teacherList.some(
                    (teacher) => teacherScheduleMap[teacher]?.[selectedDay]?.[slot.key]
                  );

                  return (
                    <tr key={slot.key} className={hasAnyClass ? "has-class" : ""}>
                      <td className="time-col">{slot.label}</td>
                      {teacherList.map((teacher) => {
                        const cls = teacherScheduleMap[teacher]?.[selectedDay]?.[slot.key];
                        if (!cls) {
                          return <td key={teacher} className="empty-cell"></td>;
                        }

                        const studentInfo = getStudentInfo(cls.studentName);
                        const endTime = getClassEndTime(slot.key, cls.duration || 25);

                        return (
                          <td key={teacher} className={`class-cell ${cls.classType === "Online" ? "online" : "f2f"}`}>
                            <div className="class-card">
                              <div className="class-card-header">
                                <strong className="class-student-name">
                                  {studentInfo.name}
                                </strong>
                              </div>
                              <div className="class-card-body">
                                {studentInfo.className && (
                                  <span className="class-badge">{studentInfo.className}</span>
                                )}
                                <span className="class-time">{slot.label} – {endTime}</span>
                                <span className={`type-badge ${cls.classType === "Online" ? "online" : "f2f"}`}>
                                  {cls.classType === "Online" ? "💻" : "👤"} {cls.classType}
                                </span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "week" && (
        <div className="overall-week-view">
          <h2>Weekly Overview</h2>
          {ALL_DAYS.map((day) => {
            const dayHasClasses = teacherList.some(
              (teacher) => teacherScheduleMap[teacher]?.[day]
            );

            return (
              <div key={day} className={`week-day-section ${WEEKEND.includes(day) ? "weekend" : ""}`}>
                <div
                  className="week-day-header"
                  onClick={() => {
                    setExpandedTeacher(expandedTeacher === day ? null : day);
                  }}
                >
                  <span className="expand-icon">{expandedTeacher === day ? "▼" : "▶"}</span>
                  <h3>{day}</h3>
                  {!dayHasClasses && <span className="no-classes-badge">No classes</span>}
                </div>

                {expandedTeacher === day && dayHasClasses && (
                  <div className="week-day-content">
                    <table className="overall-week-table">
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
                      <tbody>
                        {timeSlotsToShow.map((slot) => {
                          const hasAnyClass = teacherList.some(
                            (teacher) => teacherScheduleMap[teacher]?.[day]?.[slot.key]
                          );

                          return (
                            <tr key={slot.key} className={hasAnyClass ? "has-class" : ""}>
                              <td className="time-col">{slot.label}</td>
                              {teacherList.map((teacher) => {
                                const cls = teacherScheduleMap[teacher]?.[day]?.[slot.key];
                                if (!cls) {
                                  return <td key={teacher} className="empty-cell"></td>;
                                }

                                const studentInfo = getStudentInfo(cls.studentName);
                                const endTime = getClassEndTime(slot.key, cls.duration || 25);

                                return (
                                  <td key={teacher} className={`class-cell ${cls.classType === "Online" ? "online" : "f2f"}`}>
                                    <div className="class-card">
                                      <div className="class-card-header">
                                        <div className="week-student-info">
                                          <strong>{studentInfo.name}</strong>
                                        </div>
                                      </div>
                                      <div className="class-card-body">
                                        {studentInfo.className && (
                                          <span className="class-badge">{studentInfo.className}</span>
                                        )}
                                        <span className="class-time">{slot.label} – {endTime}</span>
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OverallSchedule;
