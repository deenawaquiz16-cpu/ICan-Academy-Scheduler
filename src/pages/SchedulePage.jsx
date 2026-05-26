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
} from "../utils/storage";
import { getOccupiedSlots, TIME_SLOTS } from "../utils/timeSlots";
import "../App.css";

function SchedulePage({ teacherName, onBack }) {
  const [schedules, setSchedules] = useState(() => {
    syncStudentsToTeachers();
    return loadSchedules();
  });
  const [blocks, setBlocks] = useState(() => loadBlocks());
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [firstSelectedCell, setFirstSelectedCell] = useState(null);
  const [saved, setSaved] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);

  // Warning toast state
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    // Already initialized in useState factory
  }, []);

  const teacherSchedule = useMemo(() => schedules[teacherName] || {}, [schedules, teacherName]);
  const teacherBlocks = useMemo(() => blocks[teacherName] || {}, [blocks, teacherName]);

  // Handle left-click on cell
  const handleCellClick = useCallback((day, timeSlot) => {
    // Check if blocked
    if (isSlotBlocked(blocks, teacherName, day, timeSlot.key)) {
      setWarning("This time is unavailable.");
      setFirstSelectedCell(null);
      return;
    }

    const existingClass = teacherSchedule[day]?.[timeSlot.key];
    
    // If clicking a cell that has a class, just open it for editing (ignore multi-select)
    if (existingClass) {
      setEditingClass({ ...existingClass, day, timeKey: timeSlot.key, timeSlot });
      setSelectedCell({ day, timeSlot });
      setFirstSelectedCell(null);
      setFormOpen(true);
      return;
    }

    // Logic for multi-select (50 min class)
    if (firstSelectedCell) {
      // If clicking the same cell again, deselect it
      if (firstSelectedCell.day === day && firstSelectedCell.timeSlot.key === timeSlot.key) {
        setFirstSelectedCell(null);
        return;
      }

      // Check if it's the same day and the slot is consecutive
      if (firstSelectedCell.day === day) {
        const firstIdx = TIME_SLOTS.findIndex(s => s.key === firstSelectedCell.timeSlot.key);
        const secondIdx = TIME_SLOTS.findIndex(s => s.key === timeSlot.key);
        
        // If consecutive (either order)
        if (Math.abs(firstIdx - secondIdx) === 1) {
          const startIdx = Math.min(firstIdx, secondIdx);
          const startSlot = TIME_SLOTS[startIdx];
          
          setEditingClass(null);
          setSelectedCell({ day, timeSlot: startSlot, duration: 50 });
          setFirstSelectedCell(null);
          setFormOpen(true);
          return;
        }
      }
      
      // If not consecutive or different day, make the new click the first selected cell
      setFirstSelectedCell({ day, timeSlot });
    } else {
      // First click on an empty cell
      setFirstSelectedCell({ day, timeSlot });
    }
  }, [teacherSchedule, blocks, teacherName, firstSelectedCell]);

  // Handle right-click on cell
  const handleCellRightClick = useCallback((day, timeSlot, event) => {
    setFirstSelectedCell(null);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      day,
      timeSlot,
    });
  }, []);

  // Context menu actions
  const handleAddClass = () => {
    if (!contextMenu) return;
    const { day, timeSlot } = contextMenu;
    setContextMenu(null);
    setEditingClass(null);
    setSelectedCell({ day, timeSlot });
    setFormOpen(true);
  };

  const handleBlockSlot = () => {
    if (!contextMenu) return;
    const { day, timeSlot } = contextMenu;
    setContextMenu(null);
    setBlocks((prev) => {
      const updated = { ...prev };
      const result = blockSlot(updated, teacherName, day, timeSlot.key);
      saveBlocks(result);
      return result;
    });
  };

  const handleUnblockSlot = () => {
    if (!contextMenu) return;
    const { day, timeSlot } = contextMenu;
    setContextMenu(null);
    setBlocks((prev) => {
      const updated = { ...prev };
      const result = unblockSlot(updated, teacherName, day, timeSlot.key);
      saveBlocks(result);
      return result;
    });
  };

  const handleBlockDay = () => {
    if (!contextMenu) return;
    const { day } = contextMenu;
    setContextMenu(null);
    setBlocks((prev) => {
      const updated = { ...prev };
      const result = blockDay(updated, teacherName, day);
      saveBlocks(result);
      return result;
    });
  };

  const handleUnblockDay = () => {
    if (!contextMenu) return;
    const { day } = contextMenu;
    setContextMenu(null);
    setBlocks((prev) => {
      const updated = { ...prev };
      const result = unblockDay(updated, teacherName, day);
      saveBlocks(result);
      return result;
    });
  };

  const handleSaveClass = (classData) => {
    // 1. Find the student
    const students = loadStudents();
    const student = students.find(s => s.name === classData.studentName);
    
    if (student) {
      // Update student's main info
      updateStudent(student.id, {
        currentTeacher: classData.teacherName,
        classType: classData.classType === "Online" ? "online" : "face-to-face",
        className: classData.className,
        book: classData.book
      });

      const scheduleEntry = {
        days: [classData.day],
        timeSlot: classData.timeKey,
        duration: classData.duration,
        className: classData.className,
        book: classData.book,
        classType: classData.classType === "Online" ? "online" : "face-to-face",
      };

      if (editingClass && editingClass.scheduleId) {
        // Update existing schedule entry
        editStudentSchedule(student.id, editingClass.scheduleId, scheduleEntry);
      } else {
        // Add new schedule entry
        addScheduleToStudent(student.id, scheduleEntry);
      }
    }

    // Refresh local state from the newly synced data
    setSchedules(syncStudentsToTeachers());
    setFormOpen(false);
    setEditingClass(null);
    setSelectedCell(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteClass = (day, timeKey) => {
    const cls = teacherSchedule[day]?.[timeKey];
    if (cls && cls.scheduleId) {
      const students = loadStudents();
      const student = students.find(s => s.name === cls.studentName);
      if (student) {
        deleteStudentSchedule(student.id, cls.scheduleId);
      }
    }

    // Refresh local state from the newly synced data
    setSchedules(syncStudentsToTeachers());
    setFormOpen(false);
    setEditingClass(null);
    setSelectedCell(null);
  };

  const handleMultiDaySave = (days, timeSlot, classData) => {
    const students = loadStudents();
    const student = students.find(s => s.name === classData.studentName);
    
    if (student) {
      updateStudent(student.id, {
        currentTeacher: classData.teacherName,
        classType: classData.classType === "Online" ? "online" : "face-to-face",
        className: classData.className,
        book: classData.book
      });

      const scheduleEntry = {
        days: days,
        timeSlot: timeSlot.key,
        duration: classData.duration,
        className: classData.className,
        book: classData.book,
        classType: classData.classType === "Online" ? "online" : "face-to-face",
      };

      if (editingClass && editingClass.scheduleId) {
        editStudentSchedule(student.id, editingClass.scheduleId, scheduleEntry);
      } else {
        addScheduleToStudent(student.id, scheduleEntry);
      }
    }

    // Refresh local state from the newly synced data
    setSchedules(syncStudentsToTeachers());
    setFormOpen(false);
    setEditingClass(null);
    setSelectedCell(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveAllChanges = () => {
    saveSchedules(schedules);
    saveBlocks(blocks);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>{teacherName}</h1>
        <div className="header-actions">
          {saved && <span className="saved-badge">✓ All Changes Saved</span>}
          <button className="save-all-btn" onClick={handleSaveAllChanges}>
            💾 Save Changes
          </button>
        </div>
      </div>

      <div className="schedule-hint">
        💡 <strong>Left-click</strong> a cell to add/edit a class. <strong>Right-click</strong> to block or unblock time.
      </div>

      <ScheduleGrid
        schedule={teacherSchedule}
        blocks={teacherBlocks}
        firstSelectedCell={firstSelectedCell}
        onCellClick={handleCellClick}
        onCellRightClick={handleCellRightClick}
      />

      {/* Class Form */}
      {formOpen && selectedCell && (
        <ClassForm
          editingClass={editingClass}
          teacherName={teacherName}
          day={selectedCell.day}
          timeSlot={selectedCell.timeSlot}
          defaultDuration={selectedCell.duration}
          schedule={teacherSchedule}
          onSave={handleSaveClass}
          onDelete={handleDeleteClass}
          onMultiDaySave={handleMultiDaySave}
          onClose={() => {
            setFormOpen(false);
            setEditingClass(null);
            setSelectedCell(null);
          }}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <CellContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          day={contextMenu.day}
          isBlocked={isSlotBlocked(blocks, teacherName, contextMenu.day, contextMenu.timeSlot.key)}
          isDayBlocked={isDayBlocked(blocks, teacherName, contextMenu.day)}
          onAddClass={handleAddClass}
          onBlockSlot={handleBlockSlot}
          onUnblockSlot={handleUnblockSlot}
          onBlockDay={handleBlockDay}
          onUnblockDay={handleUnblockDay}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Warning Toast */}
      {warning && (
        <WarningToast
          message={warning}
          onClose={() => setWarning(null)}
        />
      )}
    </div>
  );
}

export default SchedulePage;
