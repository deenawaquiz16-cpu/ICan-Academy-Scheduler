import React, { useState, useMemo, useEffect } from "react";
import {
  loadStudents,
  loadTeachers,
  addStudent,
  deleteStudent,
  updateStudent,
  addScheduleToStudent,
} from "../utils/storage";
import { DAYS, DURATIONS, TIME_SLOTS } from "../utils/timeSlots";
import "../App.css";
import "./ManageStudents.css";

const DAY_SHORT = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };

const GRADE_LEVELS = [
  { value: "grade-1", label: "1" }, { value: "grade-2", label: "2" }, { value: "grade-3", label: "3" },
  { value: "grade-4", label: "4" }, { value: "grade-5", label: "5" }, { value: "grade-6", label: "6" },
  { value: "grade-7", label: "7" }, { value: "grade-8", label: "8" }, { value: "grade-9", label: "9" },
  { value: "grade-10", label: "10" }, { value: "grade-11", label: "11" }, { value: "grade-12", label: "12" },
  { value: "university", label: "Univ" }, { value: "adult", label: "Adult" },
];

const STUDENT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "on-break", label: "On Break" },
  { value: "stopped", label: "Stopped" },
];

const CLASS_TYPES = [
  { value: "online", label: "Online", icon: "💻" },
  { value: "face-to-face", label: "Face-to-Face", icon: "👤" },
];

function StudentModal({ isOpen, onClose, onSave, allTeachersList, initialData = null }) {
  const [form, setForm] = useState({
    name: "", gradeLevel: "", classType: "online", currentTeacher: "",
    startDate: new Date().toISOString().split("T")[0], endDate: "", className: "", book: "",
    previousTeacher: ""
  });

  // Array of schedule objects: { id, days, timeSlot, duration }
  const [schedules, setSchedules] = useState([{ id: Date.now().toString(), days: [], timeSlot: "08:00", duration: 25 }]);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        gradeLevel: initialData.gradeLevel || "",
        classType: initialData.classType || "online",
        currentTeacher: initialData.currentTeacher || "",
        startDate: initialData.startDate || new Date().toISOString().split("T")[0],
        endDate: initialData.endDate || "",
        className: initialData.className || "",
        book: initialData.book || "",
        previousTeacher: (initialData.previousTeachers && initialData.previousTeachers[0]?.name) || ""
      });
      if (initialData.schedules && initialData.schedules.length > 0) {
        setSchedules(initialData.schedules.map(s => ({ ...s })));
      } else {
        setSchedules([{ id: Date.now().toString(), days: [], timeSlot: "08:00", duration: 25 }]);
      }
    } else if (isOpen) {
      setForm({
        name: "", gradeLevel: "", classType: "online", currentTeacher: "",
        startDate: new Date().toISOString().split("T")[0], endDate: "", className: "", book: "",
        previousTeacher: ""
      });
      setSchedules([{ id: Date.now().toString(), days: [], timeSlot: "08:00", duration: 25 }]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddSchedule = () => {
    setSchedules([...schedules, { id: Date.now().toString(), days: [], timeSlot: "08:00", duration: 25 }]);
  };

  const handleRemoveSchedule = (id) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const handleUpdateSchedule = (id, updates) => {
    setSchedules(schedules.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDayToggle = (scheduleId, d) => {
    const sched = schedules.find(s => s.id === scheduleId);
    if (!sched) return;
    const newDays = sched.days.includes(d) 
      ? sched.days.filter(x => x !== d) 
      : [...sched.days, d];
    handleUpdateSchedule(scheduleId, { days: newDays });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, schedules });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? "📝 Edit Student Record" : "🎓 Add New Student"}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-field">
              <label>Student Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Doe" autoFocus required />
            </div>

            <div className="modal-field-row">
              <div className="modal-field">
                <label>Grade</label>
                <select value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}>
                  <option value="">— Select —</option>
                  {GRADE_LEVELS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label>Type</label>
                <select value={form.classType} onChange={(e) => setForm({ ...form, classType: e.target.value })}>
                  {CLASS_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{ct.icon} {ct.label}</option>)}
                </select>
              </div>
            </div>

            <div className="modal-field-row">
              <div className="modal-field">
                <label>Current Teacher</label>
                <select value={form.currentTeacher} onChange={(e) => setForm({ ...form, currentTeacher: e.target.value })}>
                  <option value="">— Select Teacher —</option>
                  {allTeachersList.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label>Previous Teacher</label>
                <input type="text" value={form.previousTeacher} onChange={(e) => setForm({ ...form, previousTeacher: e.target.value })} placeholder="Teacher name" />
              </div>
            </div>

            <div className="modal-divider">Schedules</div>

            <div className="schedules-container">
              {schedules.map((sched, idx) => (
                <div key={sched.id} className="schedule-entry-block">
                  <div className="schedule-entry-header">
                    <span>Schedule #{idx + 1}</span>
                    {schedules.length > 1 && (
                      <button type="button" className="remove-sched-btn" onClick={() => handleRemoveSchedule(sched.id)}>Remove</button>
                    )}
                  </div>
                  
                  <div className="modal-field">
                    <label>Days</label>
                    <div className="day-checkboxes" style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                      {DAYS.map(d => (
                        <button 
                          key={d} 
                          type="button" 
                          className={`day-pill ${sched.days.includes(d) ? 'active' : ''}`} 
                          onClick={() => handleDayToggle(sched.id, d)}
                          style={{padding: '4px 10px', fontSize: '11px', border: '1px solid #ddd', borderRadius: '20px', background: sched.days.includes(d) ? '#111' : '#fff', color: sched.days.includes(d) ? '#fff' : '#111', cursor: 'pointer'}}
                        >
                          {d.slice(0,3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="modal-field-row">
                    <div className="modal-field">
                      <label>Start Time</label>
                      <select value={sched.timeSlot} onChange={(e) => handleUpdateSchedule(sched.id, { timeSlot: e.target.value })}>
                        {TIME_SLOTS.filter(s => !s.isLunch).map(s => <option key={s.key} value={s.key}>{s.start}</option>)}
                      </select>
                    </div>
                    <div className="modal-field">
                      <label>Duration</label>
                      <select value={sched.duration} onChange={(e) => handleUpdateSchedule(sched.id, { duration: Number(e.target.value) })}>
                        {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="add-another-sched-btn" onClick={handleAddSchedule}>+ Add Another Time</button>
            </div>

            <div className="modal-divider">Class Details</div>

            <div className="modal-field-row">
              <div className="modal-field">
                <label>Class Name</label>
                <input type="text" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} placeholder="e.g. Reading" />
              </div>
              <div className="modal-field">
                <label>Book</label>
                <input type="text" value={form.book} onChange={(e) => setForm({ ...form, book: e.target.value })} placeholder="e.g. Phonics 1" />
              </div>
            </div>

            <div className="modal-field-row">
               <div className="modal-field">
                 <label>Start Date</label>
                 <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
               </div>
               <div className="modal-field">
                 <label>End Date (Optional)</label>
                 <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
               </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-save-btn">{initialData ? "Save Changes" : "Add Student"}</button>
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

  const [students, setStudents] = useState(() => loadStudents());
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = searchQuery === "" || s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeacher = filterTeacher === "" || s.currentTeacher === filterTeacher;
      const matchesStatus = filterStatus === "" || (s.status || "active") === filterStatus;
      return matchesSearch && matchesTeacher && matchesStatus;
    });
  }, [students, searchQuery, filterTeacher, filterStatus]);

  const handleQuickAdd = () => {
    const baseName = "New Student";
    let name = baseName;
    let counter = 1;
    while (students.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      name = `${baseName} ${counter++}`;
    }
    addStudent(name);
    setStudents(loadStudents());
  };

  const handleSaveStudent = (data) => {
    if (editingStudent) {
      updateStudent(editingStudent.id, {
        name: data.name,
        gradeLevel: data.gradeLevel,
        classType: data.classType,
        currentTeacher: data.currentTeacher,
        startDate: data.startDate,
        endDate: data.endDate,
        className: data.className,
        book: data.book,
        previousTeachers: data.previousTeacher ? [{ name: data.previousTeacher, date: new Date().toLocaleDateString() }] : (editingStudent.previousTeachers || []),
        schedules: data.schedules.map(s => ({
          ...s,
          classType: data.classType,
          className: data.className,
          book: data.book
        }))
      });
    } else {
      const newStudents = addStudent(data.name);
      const newId = newStudents[newStudents.length - 1].id;
      
      updateStudent(newId, {
        gradeLevel: data.gradeLevel,
        classType: data.classType,
        currentTeacher: data.currentTeacher,
        startDate: data.startDate,
        endDate: data.endDate,
        className: data.className,
        book: data.book,
        previousTeachers: data.previousTeacher ? [{ name: data.previousTeacher, date: new Date().toLocaleDateString() }] : [],
        schedules: data.schedules.map(s => ({
          ...s,
          classType: data.classType,
          className: data.className,
          book: data.book
        }))
      });
    }
    setStudents(loadStudents());
    setEditingStudent(null);
    setIsAdding(false);
  };

  const formatSchedule = (student) => {
    const schedules = student.schedules;
    if (!schedules || schedules.length === 0) return (
      <button 
        className="add-inline-sched-btn"
        onClick={() => {
          addScheduleToStudent(student.id, {
            days: ["Monday"],
            timeSlot: "08:00",
            duration: 25,
            classType: student.classType || "online"
          });
          setStudents(loadStudents());
        }}
      >
        + Set
      </button>
    );
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {schedules.map((sched, i) => {
          const daysStr = sched.days?.length > 0 
            ? sched.days.map(d => DAY_SHORT[d] || d.slice(0,3)).join(", ") 
            : "No days";
          const startTimeLabel = TIME_SLOTS.find(t => t.key === (sched.timeSlot || "08:00"))?.start || "N/A";
          
          return (
            <div 
              key={i} 
              className="editable-schedule-pill"
              onClick={() => {
                const newDaysInput = prompt("Enter days (e.g. Mon, Wed, Fri):", daysStr);
                if (newDaysInput === null) return;
                
                const DAY_CLEAN = {
                  "mon": "Monday", "tue": "Tuesday", "wed": "Wednesday", "thu": "Thursday", 
                  "fri": "Friday", "sat": "Saturday", "sun": "Sunday"
                };
                
                const newDays = newDaysInput.split(",")
                  .map(d => d.trim().toLowerCase().slice(0,3))
                  .map(d => DAY_CLEAN[d])
                  .filter(Boolean);

                const newTime = prompt("Enter time (e.g. 5:00 PM):", startTimeLabel);
                if (newTime === null) return;
                
                // Robust time matching: remove spaces and compare
                const cleanInputTime = newTime.replace(/\s/g, '').toLowerCase();
                const matchedSlot = TIME_SLOTS.find(ts => ts.start.replace(/\s/g, '').toLowerCase() === cleanInputTime);
                
                if (newDays.length > 0 && matchedSlot) {
                  const updatedSchedules = [...student.schedules];
                  updatedSchedules[i] = {
                    ...sched,
                    days: newDays,
                    timeSlot: matchedSlot.key
                  };
                  updateStudent(student.id, { schedules: updatedSchedules });
                  setStudents(loadStudents());
                } else {
                  alert("Invalid days or time. Please try again (e.g. 'Mon, Wed' and '5:00 PM')");
                }
              }}
              title="Click to edit schedule"
            >
              {daysStr} | {startTimeLabel}
            </div>
          );
        })}
      </div>
    );
  };

  const formatHistory = (student) => {
    const history = student.previousTeachers || [];
    
    const handleAdd = () => {
      const name = prompt("Enter previous teacher name:");
      if (name) {
        const updatedHistory = [...history, { name: name.trim(), date: new Date().toLocaleDateString() }];
        updateStudent(student.id, { previousTeachers: updatedHistory });
        setStudents(loadStudents());
      }
    };

    if (history.length === 0) return (
      <button className="add-inline-history-btn" onClick={handleAdd}>+ Add</button>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {history.map((pt, i) => (
          <div key={i} className="history-pill" title={`Added on ${pt.date}`}>
            {pt.name}
            <button 
              className="remove-history-btn" 
              onClick={(e) => {
                e.stopPropagation();
                if(confirm(`Remove ${pt.name} from history?`)) {
                  const updatedHistory = history.filter((_, idx) => idx !== i);
                  updateStudent(student.id, { previousTeachers: updatedHistory });
                  setStudents(loadStudents());
                }
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button className="add-history-plus" onClick={handleAdd}>+</button>
      </div>
    );
  };

  return (
    <div className="manage-page">
      <div className="manage-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>🤖 Manage Students (Complete View)</h1>
      </div>

      <div className="manage-section" style={{ maxWidth: '100%' }}>
        <div className="manage-section-header">
          <div className="header-left">
             <h2>Database Records ({filteredStudents.length})</h2>
             <button className="add-row-btn" onClick={() => setIsAdding(true)}>+ Add Student</button>
             <button className="add-row-btn" onClick={handleQuickAdd} style={{marginLeft: '10px'}}>📄 Quick Row</button>
          </div>
          <div className="student-filters" style={{display: 'flex', gap: '10px'}}>
            <input type="text" className="filter-input" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <select className="filter-select" value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
              <option value="">All Teachers</option>
              {allTeachersList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STUDENT_STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
            </select>
          </div>
        </div>

        <StudentModal 
          isOpen={isAdding || !!editingStudent} 
          onClose={() => { setIsAdding(false); setEditingStudent(null); }} 
          initialData={editingStudent}
          onSave={handleSaveStudent} 
          allTeachersList={allTeachersList} 
        />

        <div className="student-table-container">
          <table className="student-table complete-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Class</th>
                <th>Type</th>
                <th>Schedule</th>
                <th>Teacher</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Previous Teachers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, index) => (
                <tr key={s.id}>
                  <td>{index + 1}</td>
                  <td><input 
                    className="name-inline-input" 
                    defaultValue={s.name} 
                    onBlur={(e) => { updateStudent(s.id, { name: e.target.value.trim() }); setStudents(loadStudents()); }} 
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                  /></td>
                  <td>
                    <select value={s.gradeLevel || ""} onChange={(e) => { updateStudent(s.id, { gradeLevel: e.target.value }); setStudents(loadStudents()); }}>
                      <option value="">—</option>
                      {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={s.status || "active"} onChange={(e) => { updateStudent(s.id, { status: e.target.value }); setStudents(loadStudents()); }}>
                      {STUDENT_STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                    </select>
                  </td>
                  <td><input 
                    className="class-inline-input" 
                    defaultValue={s.className || ""} 
                    onBlur={(e) => { updateStudent(s.id, { className: e.target.value.trim() }); setStudents(loadStudents()); }} 
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                  /></td>
                  <td>
                    <select 
                      value={s.classType || "online"} 
                      onChange={(e) => { 
                        const newType = e.target.value;
                        const updatedSchedules = (s.schedules || []).map(sched => ({
                          ...sched,
                          classType: newType
                        }));
                        updateStudent(s.id, { 
                          classType: newType,
                          schedules: updatedSchedules
                        }); 
                        setStudents(loadStudents()); 
                      }}
                    >
                      {CLASS_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.icon} {ct.label}</option>)}
                    </select>
                  </td>
                  <td>{formatSchedule(s)}</td>
                  <td>
                    <select value={s.currentTeacher || ""} onChange={(e) => { updateStudent(s.id, { currentTeacher: e.target.value }); setStudents(loadStudents()); }}>
                      <option value="">—</option>
                      {allTeachersList.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td><input type="date" value={s.startDate || ""} onChange={(e) => { updateStudent(s.id, { startDate: e.target.value }); setStudents(loadStudents()); }} /></td>
                  <td><input type="date" value={s.endDate || ""} onChange={(e) => { updateStudent(s.id, { endDate: e.target.value }); setStudents(loadStudents()); }} /></td>
                  <td>{formatHistory(s)}</td>
                  <td className="actions-cell">
                    <button className="edit-row-btn" onClick={() => setEditingStudent(s)} title="Edit Full Record">✏️</button>
                    <button className="delete-row-btn" onClick={() => { if(confirm(`Delete ${s.name}?`)) { deleteStudent(s.id); setStudents(loadStudents()); } }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManageStudents;
