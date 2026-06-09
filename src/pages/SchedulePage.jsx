import { useState, useEffect, useCallback, useMemo } from "react";
import ScheduleGrid from "../components/ScheduleGrid";
import ClassForm from "../components/ClassForm";
import CellContextMenu from "../components/CellContextMenu";
import WarningToast from "../components/WarningToast";
import {
  loadSchedules,
  saveSchedules,
  loadBlocks,
  saveBlocks,
  isSlotBlocked,
  isDayBlocked,
  blockSlot,
  unblockSlot,
  blockDay,
  unblockDay,
  syncStudentsToTeachers,
  loadStudents,
  updateStudent,
  addScheduleToStudent,
  editStudentSchedule,
  deleteStudentSchedule,
  deleteTeacher,
  loadTeachers,
} from "../utils/storage";
import { getOccupiedSlots, TIME_SLOTS } from "../utils/timeSlots";
import "../App.css";

function SchedulePage({ teacherName, onBack }) {
  // CRITICAL: Removed auto-sync on load to prevent manual grid edits from being overwritten
  const [schedules, setSchedules] = useState(() => loadSchedules());
  const [blocks, setBlocks] = useState(() => loadBlocks());
  const [students, setStudents] = useState(() => loadStudents());
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [saved, setSaved] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [warning, setWarning] = useState(null);

  const teacherSchedule = useMemo(() => schedules[teacherName] || {}, [schedules, teacherName]);
  const teacherBlocks = useMemo(() => blocks[teacherName] || {}, [blocks, teacherName]);

  const handleCellClick = useCallback((day, timeSlot) => {
    if (isSlotBlocked(blocks, teacherName, day, timeSlot.key)) {
      setWarning("This time is unavailable.");
      return;
    }
    const existingClass = teacherSchedule[day]?.[timeSlot.key];
    if (existingClass) {
      // Use the startKey to ensure we open the original record
      setEditingClass({ ...existingClass, day, timeKey: existingClass.startKey || timeSlot.key });
      setSelectedCell({ day, timeSlot });
      setFormOpen(true);
      return;
    }
    setEditingClass(null);
    setSelectedCell({ day, timeSlot, duration: 25 });
    setFormOpen(true);
  }, [teacherSchedule, blocks, teacherName]);

  const handleCellRightClick = useCallback((day, timeSlot, event) => {
    setContextMenu({ x: event.clientX, y: event.clientY, day, timeSlot });
  }, []);

  const handleSaveClass = (classData) => {
    try {
      setSchedules(prev => {
        const updated = { ...prev };
        const teacherSched = updated[teacherName] || (updated[teacherName] = {});
        
        // 1. If moving/editing, clear the OLD slots first
        if (editingClass) {
          const oldDaySched = teacherSched[editingClass.day] || {};
          const oldOccupied = getOccupiedSlots(editingClass.timeKey, editingClass.duration || 25);
          oldOccupied.forEach(k => delete oldDaySched[k]);
        }

        // 2. SAVE NEW ENTRIES DIRECTLY TO GRID
        const targetDaySched = teacherSched[classData.day] || (teacherSched[classData.day] = {});
        const newOccupied = getOccupiedSlots(classData.timeKey, classData.duration || 25);
        newOccupied.forEach(slotKey => {
          targetDaySched[slotKey] = {
            studentName: classData.studentName,
            teacherName: teacherName,
            classType: classData.classType,
            className: classData.className,
            book: classData.book,
            duration: classData.duration,
            startKey: classData.timeKey,
            scheduleId: editingClass?.scheduleId || "manual-" + Date.now()
          };
        });

        saveSchedules(updated);
        return updated;
      });

      setFormOpen(false);
      setEditingClass(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setWarning("Error saving class.");
    }
  };

  const handleMultiDaySave = (days, timeSlot, classData) => {
    try {
      setSchedules(prev => {
        const updated = { ...prev };
        const teacherSched = updated[teacherName] || (updated[teacherName] = {});

        if (editingClass) {
          const oldDaySched = teacherSched[editingClass.day] || {};
          const oldOccupied = getOccupiedSlots(editingClass.timeKey, editingClass.duration || 25);
          oldOccupied.forEach(k => delete oldDaySched[k]);
        }

        days.forEach(day => {
          const daySched = teacherSched[day] || (teacherSched[day] = {});
          const occupied = getOccupiedSlots(timeSlot.key, classData.duration || 25);
          occupied.forEach(slotKey => {
            daySched[slotKey] = {
              ...classData,
              startKey: timeSlot.key,
              scheduleId: editingClass?.scheduleId || "manual-multi-" + Date.now()
            };
          });
        });

        saveSchedules(updated);
        return updated;
      });
      setFormOpen(false);
      setEditingClass(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setWarning("Error saving multi-day class.");
    }
  };

  const handleDeleteClass = (day, timeKey) => {
    const classInfo = teacherSchedule[day]?.[timeKey];
    if (!classInfo) return;

    setSchedules(prev => {
      const updated = { ...prev };
      const daySched = updated[teacherName]?.[day] || {};
      const occupied = getOccupiedSlots(classInfo.startKey || timeKey, classInfo.duration || 25);
      occupied.forEach(k => delete daySched[k]);
      saveSchedules(updated);
      return updated;
    });
    setFormOpen(false);
    setEditingClass(null);
  };

  const handleResetGrid = () => {
    if (confirm("Reset and Rebuild Grid? This will fix mixed-up columns by pulling fresh data from student records once.")) {
      const refreshed = syncStudentsToTeachers();
      setSchedules(refreshed);
      setStudents(loadStudents()); // Update local students too
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="teacher-info">
          <h1>{teacherName}'s Schedule</h1>
          <button className="reset-grid-btn" onClick={handleResetGrid} title="Fix mixed-up columns">🔄 Rebuild Grid</button>
        </div>
        <div className="header-actions">
           {saved && <span className="save-toast">✓ Saved</span>}
           <button className="save-all-btn" onClick={() => { saveSchedules(schedules); setSaved(true); setTimeout(()=>setSaved(false), 2000); }}>💾 Save All</button>
        </div>
      </div>

      <ScheduleGrid 
        teacherName={teacherName}
        schedule={teacherSchedule} 
        blocks={teacherBlocks} 
        students={students}
        onCellClick={handleCellClick} 
        onCellRightClick={handleCellRightClick} 
      />

      {formOpen && selectedCell && (
        <ClassForm 
          editingClass={editingClass} 
          teacherName={teacherName} 
          day={selectedCell.day} 
          timeSlot={selectedCell.timeSlot} 
          schedule={teacherSchedule} 
          onSave={handleSaveClass} 
          onDelete={handleDeleteClass} 
          onMultiDaySave={handleMultiDaySave} 
          onClose={() => { setFormOpen(false); setEditingClass(null); }} 
        />
      )}

      {contextMenu && (
        <CellContextMenu 
          x={contextMenu.x} y={contextMenu.y} 
          onAddClass={() => { setFormOpen(true); setContextMenu(null); }} 
          onClose={() => setContextMenu(null)} 
        />
      )}
      {warning && <WarningToast message={warning} onClose={() => setWarning(null)} />}
    </div>
  );
}

export default SchedulePage;
