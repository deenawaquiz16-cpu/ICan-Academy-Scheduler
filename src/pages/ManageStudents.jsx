import React, { useState, useMemo } from "react";
import {
  loadStudents,
  loadTeachers,
  addStudent,
  editStudent,
  deleteStudent,
  updateStudent,
  addTeacherToStudent,
  removeTeacherFromStudent,
  syncStudentsToTeachers,
} from "../utils/storage";
import { DAYS, DURATIONS, TIME_SLOTS } from "../utils/timeSlots";
import "../App.css";
import "./ManageStudents.css";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKEND = ["Saturday", "Sunday"];
const ALL_DAYS = [...WEEKDAYS, ...WEEKEND];
const DAY_SHORT = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };

const CLASS_TYPES = [
  { value: "face-to-face", label: "Face-to-Face", icon: "🏫" },
  { value: "online", label: "Online", icon: "💻" },
];

const GRADE_LEVELS = [
  { value: "grade-1", label: "1" },
  { value: "grade-2", label: "2" },
  { value: "grade-3", label: "3" },
  { value: "grade-4", label: "4" },
  { value: "grade-5", label: "5" },
  { value: "grade-6", label: "6" },
  { value: "grade-7", label: "7" },
  { value: "grade-8", label: "8" },
  { value: "grade-9", label: "9" },
  { value: "grade-10", label: "10" },
  { value: "grade-11", label: "11" },
  { value: "grade-12", label: "12" },
  { value: "university", label: "Univ" },
  { value: "adult", label: "Adult" },
];

const STUDENT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "on-break", label: "On Break" },
  { value: "stopped", label: "Stopped" },
];

// Determine student scheduling status
function getStudentStatus(student) {
  // If student has explicit status set, use it
  if (student.status) return student.status;
  // Otherwise derive from schedule data
  const hasTeacher = !!student.currentTeacher;
  const hasSchedule = student.schedules && student.schedules.length > 0;
  if (hasTeacher && hasSchedule) return "active";
  return "not-scheduled";
}

function sortStudentsFn(list, by) {
  return [...list].sort((a, b) => {
    if (by === "name") return a.name.localeCompare(b.name);
    if (by === "startDate") return (a.startDate || "").localeCompare(b.startDate || "");
    if (by === "teacher") return (a.currentTeacher || "").localeCompare(b.currentTeacher || "");
    if (by === "status") {
      const order = { active: 0, "on-break": 1, stopped: 2, "not-scheduled": 3 };
      return (order[getStudentStatus(a)] ?? 4) - (order[getStudentStatus(b)] ?? 4);
    }
    return 0;
  });
}

// ===== STUDENT MODAL COMPONENT =====
function StudentModal({ isOpen, onClose, onAdd, allTeachersList }) {
  const [form, setForm] = useState({
    name: "",
    gradeLevel: "",
    classType: "face-to-face",
    currentTeacher: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    className: "",
    book: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd(form);
    setForm({
      name: "",
      gradeLevel: "",
      classType: "face-to-face",
      currentTeacher: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      className: "",
      book: "",
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎓 Add New Student</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-field">
              <label>Student Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. John Doe"
                autoFocus
                required
              />
            </div>

            <div className="modal-field-row">
              <div className="modal-field">
                <label>Grade</label>
                <select
                  value={form.gradeLevel}
                  onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {GRADE_LEVELS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div className="modal-field">
                <label>Class Type</label>
                <select
                  value={form.classType}
                  onChange={(e) => setForm({ ...form, classType: e.target.value })}
                >
                  {CLASS_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-field-row">
              <div className="modal-field">
                <label>Class Name</label>
                <input
                  type="text"
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                  placeholder="e.g. Reading A"
                />
              </div>
              <div className="modal-field">
                <label>Book</label>
                <input
                  type="text"
                  value={form.book}
                  onChange={(e) => setForm({ ...form, book: e.target.value })}
                  placeholder="e.g. Oxford Phonics"
                />
              </div>
            </div>

            <div className="modal-field">
              <label>Current Teacher</label>
              <select
                value={form.currentTeacher}
                onChange={(e) => setForm({ ...form, currentTeacher: e.target.value })}
              >
                <option value="">— Select Teacher —</option>
                {allTeachersList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            
            <div className="modal-field-row">
              <div className="modal-field">
                <label>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="modal-field">
                <label>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-save-btn">Add Student</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageStudents({ onBack }) {
  const allTeachersList = useMemo(() => {
    const t = loadTeachers();
    return [...new Set([...(t.academy || []), ...(t.wfh || [])])].sort();
  }, []);

  const [students, setStudents] = useState(() => {
    const loaded = loadStudents();
    return sortStudentsFn(loaded, "name");
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingScheduleFor, setEditingScheduleFor] = useState(null);

  // Inline teacher history add state
  const [addingHistoryTeacherFor, setAddingHistoryTeacherFor] = useState(null);
  const [historyTeacherName, setHistoryTeacherName] = useState("");

  // Save feedback state
  const [savedRow, setSavedRow] = useState(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [activeTab, setActiveTab] = useState("all"); // "all", "face-to-face", "online"

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const status = getStudentStatus(s);
      const matchesSearch = searchQuery === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.currentTeacher || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.className || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTeacher = filterTeacher === "" || s.currentTeacher === filterTeacher;
      const matchesStatus = filterStatus === "" || status === filterStatus;
      const matchesTab = activeTab === "all" || s.classType === activeTab;

      return matchesSearch && matchesTeacher && matchesStatus && matchesTab;
    });
  }, [students, searchQuery, filterTeacher, filterStatus, activeTab]);

  const handleAdd = (formData) => {
    const updatedList = addStudent(formData.name);
    const newStudent = updatedList.find(s => s.name === formData.name);
    
    if (newStudent) {
      updateStudent(newStudent.id, {
        gradeLevel: formData.gradeLevel,
        classType: formData.classType,
        currentTeacher: formData.currentTeacher,
        startDate: formData.startDate,
        endDate: formData.endDate,
        className: formData.className,
        book: formData.book,
        status: "active"
      });
    }

    setStudents(sortStudentsFn(loadStudents(), sortBy));
    setIsAdding(false);
  };

  const handleQuickAdd = () => {
    const baseName = "New Student";
    let name = baseName;
    let counter = 1;
    const existingNames = students.map(s => s.name.toLowerCase());
    
    while (existingNames.includes(name.toLowerCase())) {
      name = `${baseName} ${counter}`;
      counter++;
    }

    const today = new Date().toISOString().split("T")[0];
    const updatedList = addStudent(name, "");
    const newStudent = updatedList.find(s => s.name === name);

    if (newStudent) {
      updateStudent(newStudent.id, { 
        startDate: today, 
        status: "active",
        schedules: [{
          id: Date.now().toString(),
          days: [],
          timeSlot: "08:00",
          duration: 25,
          teacherName: "",
          classType: "face-to-face",
          className: "",
          book: "",
        }]
      });
    }
    
    setSearchQuery("");
    setFilterTeacher("");
    setFilterStatus("");
    setActiveTab("all");
    
    setStudents(sortStudentsFn(loadStudents(), sortBy));
    
    setTimeout(() => {
      const row = document.querySelector(`[data-student-id="${newStudent?.id}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('new-row-highlight');
        setTimeout(() => row.classList.remove('new-row-highlight'), 2000);
      }
    }, 100);
  };

  const handleInlineScheduleUpdate = (studentId, updates) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    let schedules = [...(student.schedules || [])];
    if (schedules.length === 0) {
      schedules.push({
        id: "initial-schedule",
        days: [],
        timeSlot: "08:00",
        duration: 25,
        teacherName: student.currentTeacher || "",
        classType: student.classType || "face-to-face",
        className: student.className || "",
        book: student.book || "",
      });
    }

    schedules[0] = { ...schedules[0], ...updates };

    updateStudent(studentId, { schedules });
    setStudents(sortStudentsFn(loadStudents(), sortBy));
  };

  const handleDelete = (id, name) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    const updated = deleteStudent(id);
    setStudents(sortStudentsFn(updated, sortBy));
  };

  const handleAddTeacherToHistory = (studentId, teacherName) => {
    if (!teacherName) return;
    addTeacherToStudent(studentId, {
      name: teacherName,
      duration: 25,
      days: [],
      className: "",
    });
    setStudents(sortStudentsFn(loadStudents(), sortBy));
  };

  const handleRemoveTeacher = (studentId, index) => {
    removeTeacherFromStudent(studentId, index);
    setStudents(sortStudentsFn(loadStudents(), sortBy));
  };

  const formatSchedule = (schedules, studentId) => {
    const sched = schedules?.[0] || { days: [], timeSlot: "08:00", duration: 25 };
    const isEditing = editingScheduleFor === studentId;

    const toggleDay = (day) => {
      const newDays = sched.days.includes(day)
        ? sched.days.filter((d) => d !== day)
        : [...sched.days, day];
      handleInlineScheduleUpdate(studentId, { days: newDays });
    };

    // Custom display end time logic based on user request
    const getDisplayEndTime = (startKey, dur) => {
      const slotIdx = TIME_SLOTS.findIndex(s => s.key === startKey);
      if (slotIdx === -1) return "";
      
      const startSlot = TIME_SLOTS[slotIdx];
      const [h, m] = startSlot.key.split(":").map(Number);
      
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

    if (!isEditing) {
      const daysStr = sched.days.length > 0 
        ? sched.days.map(d => DAY_SHORT[d]).join(", ") 
        : "No days set";
      
      const startTimeLabel = TIME_SLOTS.find(t => t.key === (sched.timeSlot || "08:00"))?.start || "No time set";
      const endTimeLabel = getDisplayEndTime(sched.timeSlot || "08:00", sched.duration || 25);

      return (
        <div 
          className="schedule-summary-chip" 
          onClick={() => setEditingScheduleFor(studentId)}
          title="Click to edit schedule"
        >
          <span className="summary-days">{daysStr}</span>
          <span className="summary-at">@</span>
          <span className="summary-time">{startTimeLabel} – {endTimeLabel}</span>
          <span className="edit-icon-small">✏️</span>
        </div>
      );
    }

    const startTimeLabel = TIME_SLOTS.find(t => t.key === (sched.timeSlot || "08:00"))?.start || "";
    const displayEndTime = getDisplayEndTime(sched.timeSlot || "08:00", sched.duration || 25);

    return (
      <div className="schedule-edit-popover" onClick={(e) => e.stopPropagation()}>
        <div className="popover-section">
          <label>Days</label>
          <div className="day-picker-inline">
            {ALL_DAYS.map((day) => {
              const displayDay = day === "Thursday" ? "Th" : 
                                 day === "Saturday" ? "Sat" : 
                                 day === "Sunday" ? "Sun" : 
                                 day[0];
              return (
                <button
                  key={day}
                  type="button"
                  className={`day-dot ${sched.days.includes(day) ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleDay(day);
                  }}
                  title={day}
                >
                  {displayDay}
                </button>
              );
            })}
          </div>
        </div>

        <div className="popover-section">
          <label>Start Time</label>
          <div className="start-time-grid-mini">
            {TIME_SLOTS.filter(s => !s.isLunch).map((slot) => (
              <button
                key={slot.key}
                type="button"
                className={`time-pill-mini ${sched.timeSlot === slot.key ? "selected" : ""}`}
                onClick={() => handleInlineScheduleUpdate(studentId, { timeSlot: slot.key })}
              >
                {slot.start}
              </button>
            ))}
          </div>
        </div>

        <div className="popover-section">
          <label>Duration</label>
          <div className="duration-segmented-mini">
            {[25, 50, 100].map((d) => (
              <button
                key={d}
                type="button"
                className={`duration-pill-mini ${sched.duration === d ? "selected" : ""}`}
                onClick={() => handleInlineScheduleUpdate(studentId, { duration: d })}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        <div className="preview-card-mini">
          <div className="preview-range-mini">{startTimeLabel} – {displayEndTime}</div>
        </div>

        <button 
          className="done-schedule-btn" 
          onClick={() => setEditingScheduleFor(null)}
        >
          Done
        </button>
      </div>
    );
  };

  const allCurrentTeachers = [...new Set(students.map((s) => s.currentTeacher).filter(Boolean))].sort();

  return (
    <div className="manage-page">
      <div className="manage-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>🤖 ICan Academy — Manage Students</h1>
      </div>

      <div className="manage-section">
        <div className="manage-section-header">
          <h2>Student List</h2>
          <div className="header-right">
            <span className="student-count">{filteredStudents.length} of {students.length} student{students.length !== 1 ? "s" : ""}</span>
            <div className="add-student-actions">
              <button className="add-row-btn" onClick={handleQuickAdd} title="Quickly add a blank row to the table">
                📄 Add Row
              </button>
            </div>
          </div>
        </div>

        {/* Add Student Modal */}
        <StudentModal 
          isOpen={isAdding} 
          onClose={() => setIsAdding(false)} 
          onAdd={handleAdd}
          allTeachersList={allTeachersList}
        />

        {/* Class Type Tabs */}
        <div className="class-type-tabs">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            📋 All Students <span className="tab-count">({students.length})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "face-to-face" ? "active" : ""}`}
            onClick={() => setActiveTab("face-to-face")}
          >
            🏫 Face-to-Face <span className="tab-count">({students.filter((s) => s.classType === "face-to-face").length})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "online" ? "active" : ""}`}
            onClick={() => setActiveTab("online")}
          >
            💻 Online <span className="tab-count">({students.filter((s) => s.classType === "online").length})</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="student-filters">
          <div className="filter-group">
            <span className="filter-icon">🔍</span>
            <input
              type="text"
              className="filter-input"
              placeholder="Search students, teachers, classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="filter-select" value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
            <option value="">All Teachers</option>
            {allCurrentTeachers.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">🟢 Active</option>
            <option value="on-break">🟡 On Break</option>
            <option value="stopped">🔴 Stopped</option>
          </select>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setStudents(sortStudentsFn(loadStudents(), e.target.value));
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="startDate">Sort by Start Date</option>
            <option value="teacher">Sort by Teacher</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        {/* Student Table */}
        <div className="student-table-container">
          <table className="student-table">
            <thead>
              <tr>
                <th className="col-index">#</th>
                <th className="col-name">Student</th>
                <th className="col-grade">Grade</th>
                <th className="col-status">Status</th>
                <th className="col-class">Class Name</th>
                <th className="col-class-type">Type</th>
                <th className="col-schedule">Schedule (Days/Time)</th>
                <th className="col-teacher">Current Teacher</th>
                <th className="col-start">Start Date</th>
                <th className="col-end">End Date</th>
                <th className="col-history">Teacher History</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, index) => {
                const prevTeachers = s.previousTeachers || [];
                const status = getStudentStatus(s);

                return (
                  <tr
                    key={s.id}
                    className={`student-row status-${status}`}
                    data-student-id={s.id}
                  >
                    <td className="col-index">{index + 1}</td>
                    <td className="col-name">
                      <input
                        type="text"
                        className="name-inline-input"
                        defaultValue={s.name}
                        onBlur={(e) => {
                          const newName = e.target.value.trim();
                          if (newName && newName !== s.name) {
                            editStudent(s.id, newName);
                            setStudents(sortStudentsFn(loadStudents(), sortBy));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.target.blur();
                          }
                        }}
                        placeholder="Student Name"
                      />
                    </td>
                    <td className="col-grade">
                      <select
                        className="grade-select"
                        value={s.gradeLevel || ""}
                        onChange={(e) => {
                          updateStudent(s.id, { gradeLevel: e.target.value });
                          setStudents(sortStudentsFn(loadStudents(), sortBy));
                        }}
                      >
                        <option value="">—</option>
                        {GRADE_LEVELS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="col-status">
                      <div className="status-badge-wrapper" onClick={(e) => {
                        e.stopPropagation();
                        const select = e.currentTarget.querySelector('.status-select');
                        if (select) select.showPicker?.();
                      }}>
                        <select
                          className="status-select status-badge-visible"
                          value={s.status || "active"}
                          onChange={(e) => {
                            updateStudent(s.id, { status: e.target.value });
                            setStudents(sortStudentsFn(loadStudents(), sortBy));
                          }}
                        >
                          {STUDENT_STATUSES.map((st) => (
                            <option key={st.value} value={st.value}>{st.label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="col-class">
                      <input
                        type="text"
                        className="class-inline-input"
                        defaultValue={s.className || ""}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val !== (s.className || "")) {
                            updateStudent(s.id, { className: val });
                            setStudents(sortStudentsFn(loadStudents(), sortBy));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                        }}
                        placeholder="Class name"
                      />
                    </td>
                    <td className="col-class-type">
                      <select
                        className="class-type-inline-select"
                        value={s.classType || "face-to-face"}
                        onChange={(e) => {
                          updateStudent(s.id, { classType: e.target.value });
                          setStudents(sortStudentsFn(loadStudents(), sortBy));
                        }}
                      >
                        {CLASS_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="col-schedule">
                      <div className="schedule-cell-container">
                        {formatSchedule(s.schedules, s.id)}
                      </div>
                    </td>
                    <td className="col-teacher">
                      <select
                        className="teacher-inline-select"
                        value={s.currentTeacher || ""}
                        onChange={(e) => {
                          updateStudent(s.id, { currentTeacher: e.target.value });
                          setStudents(sortStudentsFn(loadStudents(), sortBy));
                        }}
                      >
                        <option value="">— Select —</option>
                        {allTeachersList.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="col-start">
                      <input
                        type="date"
                        className="date-inline-input"
                        value={s.startDate || ""}
                        onChange={(e) => {
                          updateStudent(s.id, { startDate: e.target.value });
                          setStudents(sortStudentsFn(loadStudents(), sortBy));
                        }}
                      />
                    </td>
                    <td className="col-end">
                      <input
                        type="date"
                        className="date-inline-input"
                        value={s.endDate || ""}
                        onChange={(e) => {
                          updateStudent(s.id, { endDate: e.target.value });
                          setStudents(sortStudentsFn(loadStudents(), sortBy));
                        }}
                        min={s.startDate || undefined}
                      />
                    </td>
                    <td className="col-history">
                      <div className="teacher-tags">
                        {prevTeachers.slice(0, 3).map((t, i) => (
                          <span key={i} className="teacher-tag">
                            {t.name}
                            <button
                              className="remove-teacher-tag-btn"
                              onClick={(e) => { e.stopPropagation(); handleRemoveTeacher(s.id, i); }}
                              title="Remove"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {prevTeachers.length > 3 && (
                          <span className="teacher-tag more">+{prevTeachers.length - 3}</span>
                        )}
                        {addingHistoryTeacherFor === s.id ? (
                          <div className="inline-history-add" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={historyTeacherName}
                              onChange={(e) => setHistoryTeacherName(e.target.value)}
                              autoFocus
                            >
                              <option value="">Select...</option>
                              {allTeachersList.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            <button
                              className="confirm-history-btn"
                              onClick={() => {
                                handleAddTeacherToHistory(s.id, historyTeacherName);
                                setAddingHistoryTeacherFor(null);
                                setHistoryTeacherName("");
                              }}
                            >✓</button>
                            <button
                              className="cancel-history-btn"
                              onClick={() => {
                                setAddingHistoryTeacherFor(null);
                                setHistoryTeacherName("");
                              }}
                            >✕</button>
                          </div>
                        ) : (
                          <button
                            className="add-history-btn"
                            onClick={(e) => { e.stopPropagation(); setAddingHistoryTeacherFor(s.id); }}
                            title="Add teacher to history"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="col-actions">
                      <div className="row-action-buttons">
                        <button
                          className={`save-changes-btn ${savedRow === s.id ? "flash" : ""}`}
                          onClick={() => {
                            syncStudentsToTeachers();
                            setStudents(sortStudentsFn(loadStudents(), sortBy));
                            setSavedRow(s.id);
                            setTimeout(() => setSavedRow(null), 2000);
                          }}
                        >
                          {savedRow === s.id ? "✓ Saved" : "💾 Save Changes"}
                        </button>
                        <button className="delete-row-btn" onClick={() => handleDelete(s.id, s.name)} title="Delete student">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredStudents.length === 0 && !isAdding && (
            <p className="empty-list-msg">
              {students.length === 0
                ? 'No students added yet. Click "+ Add Student" to begin.'
                : "No students match your filters."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageStudents;
