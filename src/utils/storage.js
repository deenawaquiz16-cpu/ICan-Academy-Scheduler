import { getOccupiedSlots, TIME_SLOTS } from "./timeSlots";

const TEACHERS_KEY = "english-academy-teachers";
const STUDENTS_KEY = "english-academy-students";
const SCHEDULES_KEY = "english-academy-schedules";
const BLOCKS_KEY = "english-academy-blocks";
const TRASH_KEY = "ican-academy-trash";

// ===== TEACHERS =====
export function loadTeachers() {
  const defaults = {
    academy: [
      "Greg", "Mari", "Analyn", "Argel", "Ceige", "Deena", "Eunice", "Ezra", 
      "Faye", "Janice", "Karen", "Melody", "Paula", "Rafael", "Rozeil", 
      "Ianne", "Christine", "Demple", "JM", "Luis"
    ],
    wfh: ["Jennifer", "John", "Joric", "Kath", "Leo"],
  };

  try {
    let data = localStorage.getItem(TEACHERS_KEY);
    
    // Recovery for teachers if no data at all
    if (!data) {
      const oldKeys = ["teachers", "ican-teachers", "academy-teachers"];
      for (const k of oldKeys) {
        const old = localStorage.getItem(k);
        if (old) {
          data = old;
          localStorage.setItem(TEACHERS_KEY, data);
          break;
        }
      }
    }

    if (data) {
      const parsed = JSON.parse(data);
      
      // MIGRATION: If the list contains generic placeholder names (David, Jessica, etc.), 
      // replace them with the actual teacher list.
      const placeholders = ["David", "Jessica", "John", "Maria", "Michael", "Robert", "Sarah", "Emily"];
      const currentAcademy = parsed.academy || [];
      const isPlaceholder = currentAcademy.length > 0 && currentAcademy.every(name => 
        placeholders.includes(name) || name.startsWith("Teacher ")
      );

      if (isPlaceholder) {
        saveTeachers(defaults);
        return defaults;
      }

      // Migration: if it's an old array format, put them in academy
      if (Array.isArray(parsed)) {
        return { academy: parsed, wfh: [] };
      }
      
      // Ensure structure integrity
      if (parsed && typeof parsed === 'object') {
        const hasAcademy = parsed.academy && Array.isArray(parsed.academy) && parsed.academy.length > 0;
        const hasWfh = parsed.wfh && Array.isArray(parsed.wfh) && parsed.wfh.length > 0;
        
        // Only return defaults if BOTH lists are truly missing/empty
        if (!hasAcademy && !hasWfh) {
          // If we had data but it's empty, we might want to check if it's intentional
          // For now, let's just ensure the structure exists
          if (!parsed.academy) parsed.academy = [];
          if (!parsed.wfh) parsed.wfh = [];
          return parsed;
        }
        
        if (!parsed.academy) parsed.academy = [];
        if (!parsed.wfh) parsed.wfh = [];
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load teachers:", e);
  }

  saveTeachers(defaults);
  return defaults;
}

export function saveTeachers(data) {
  try {
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save teachers:", e);
  }
}

export function addTeacher(category, name) {
  const data = loadTeachers();
  if (!data[category]) data[category] = [];
  if (!data[category].includes(name)) {
    data[category].push(name);
    saveTeachers(data);
  }
  return data;
}

export function editTeacher(category, oldName, newName) {
  const data = loadTeachers();
  if (!data[category]) return data;
  const idx = data[category].indexOf(oldName);
  if (idx !== -1) {
    data[category][idx] = newName;
    saveTeachers(data);
  }
  return data;
}

export function deleteTeacher(category, name) {
  const data = loadTeachers();
  if (!data[category]) return data;
  data[category] = data[category].filter((n) => n !== name);
  saveTeachers(data);
  return data;
}

// ===== STUDENTS =====
export function loadStudents() {
  try {
    let data = localStorage.getItem(STUDENTS_KEY);
    
    // AUTOMATIC RECOVERY: Check for the specific keys seen in the screenshot
    if (!data || data === "[]") {
      const recoveryKeys = ["ican-academy-trash", "english-academy-trash"];
      for (const k of recoveryKeys) {
        const trashData = localStorage.getItem(k);
        if (trashData) {
          try {
            const parsed = JSON.parse(trashData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const recovered = parsed.map(item => item.data || item).filter(s => s.name || s.id);
              if (recovered.length > 0) {
                data = JSON.stringify(recovered);
                localStorage.setItem(STUDENTS_KEY, data);
                break;
              }
            }
          } catch(e) {}
        }
      }
    }

    if (!data || data === "[]") {
      saveStudents([]);
      return [];
    }

    let students = JSON.parse(data);
    if (!Array.isArray(students)) {
      saveStudents([]);
      return [];
    }

    // Migration & Cleanup: Ensure 'name' exists for everyone
    let migrated = false;
    const updated = students.map((s) => {
      if (!s || typeof s !== 'object') return { id: Date.now().toString(), name: "Unknown" };
      
      // Map old englishName to name if name is missing
      if (!s.name && s.englishName) s.name = s.englishName;
      if (!s.name) s.name = "Unknown";

      // Ensure ID
      if (!s.id) {
        s.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        migrated = true;
      }

      // Ensure schedules is an array and each schedule has an ID
      if (s.schedules && Array.isArray(s.schedules)) {
        s.schedules.forEach(sched => {
          if (!sched.id) {
            sched.id = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 5);
            migrated = true;
          }
        });
      } else if (s.schedules && !Array.isArray(s.schedules)) {
        s.schedules = [];
        migrated = true;
      }

      // Migrate old top-level days/time to schedules array if schedules is empty
      if ((s.days || s.time) && (!s.schedules || s.schedules.length === 0)) {
        const daysArray = typeof s.days === "string" 
          ? s.days.match(/.{1,3}/g) || [] 
          : Array.isArray(s.days) ? s.days : [];
          
        s.schedules = [{
          id: Date.now().toString() + "-migrated-" + Math.random().toString(36).substr(2, 5),
          days: daysArray,
          timeSlot: s.time || "08:00",
          duration: 25,
          className: s.className || "",
          classType: s.classType || "face-to-face"
        }];
        migrated = true;
      }

      // Ensure status
      if (!s.status) {
        s.status = "active";
        migrated = true;
      }

      return s;
    });

    if (migrated) saveStudents(updated);
    return updated;
  } catch (e) {
    console.error("Failed to load students:", e);
    return [];
  }
}

export function saveStudents(data) {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save students:", e);
  }
}

export function addStudent(name) {
  const data = loadStudents();
  data.push({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: name.trim(),
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    className: "",
    classType: "online",
    status: "active",
    gradeLevel: "",
    book: "",
    currentTeacher: "",
    previousTeachers: [],
    schedules: [],
  });
  saveStudents(data);
  return data;
}

export function updateStudent(id, updates) {
  try {
    const data = loadStudents();
    const student = data.find((s) => s.id === id);
    if (student) {
      // Normalize classType if it's being updated
      if (updates.classType) {
        updates.classType = updates.classType.toLowerCase();
      }
      Object.assign(student, updates);
      saveStudents(data);
      syncStudentsToTeachers();
    }
    return data;
  } catch (err) {
    console.error("Error updating student:", err);
    return loadStudents();
  }
}

export function editStudent(id, newName) {
  const data = loadStudents();
  const student = data.find((s) => s.id === id);
  if (student) {
    student.name = newName;
    saveStudents(data);
  }
  return data;
}

export function deleteStudent(id) {
  const data = loadStudents();
  const student = data.find((s) => s.id === id);
  if (student) {
    // Move to trash instead of permanent delete
    moveToTrash(student);
  }
  const filtered = data.filter((s) => s.id !== id);
  saveStudents(filtered);
  syncStudentsToTeachers();
  return filtered;
}

export function addTeacherToStudent(id, teacherEntry) {
  const data = loadStudents();
  const student = data.find((s) => s.id === id);
  if (student) {
    if (!student.previousTeachers) student.previousTeachers = [];
    student.previousTeachers.push(teacherEntry);
    saveStudents(data);
  }
  return data;
}

export function removeTeacherFromStudent(id, index) {
  const data = loadStudents();
  const student = data.find((s) => s.id === id);
  if (student && student.previousTeachers) {
    student.previousTeachers.splice(index, 1);
    saveStudents(data);
  }
  return data;
}

// ===== STUDENT SCHEDULES =====
export function addScheduleToStudent(id, scheduleEntry) {
  const data = loadStudents();
  const student = data.find((s) => s.id === id);
  if (student) {
    if (!student.schedules) student.schedules = [];
    scheduleEntry.id = scheduleEntry.id || Date.now().toString();
    student.schedules.push(scheduleEntry);
    saveStudents(data);
    syncStudentsToTeachers(); // Automatically update teacher schedules
  }
  return data;
}

export function editStudentSchedule(id, scheduleId, updates) {
  const data = loadStudents();
  const student = data.find((s) => s.id === id);
  if (student && student.schedules) {
    const schedule = student.schedules.find((sc) => sc.id === scheduleId);
    if (schedule) {
      Object.assign(schedule, updates);
      saveStudents(data);
      syncStudentsToTeachers();
    }
  }
  return data;
}

export function deleteStudentSchedule(id, scheduleId) {
  const data = loadStudents();
  const student = data.find((s) => s.id === id);
  if (student && student.schedules) {
    student.schedules = student.schedules.filter((sc) => sc.id !== scheduleId);
    saveStudents(data);
    syncStudentsToTeachers();
  }
  return data;
}

// ===== SCHEDULES =====
export function loadSchedules() {
  try {
    const data = localStorage.getItem(SCHEDULES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveSchedules(schedules) {
  try {
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  } catch (e) {
    console.error("Failed to save schedules:", e);
  }
}

// ===== BLOCKED SLOTS =====
// Structure: { "TeacherName": { blockedDays: ["Monday"], blockedSlots: { "Monday": ["08:00", "08:30"] } } }
export function loadBlocks() {
  try {
    const data = localStorage.getItem(BLOCKS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveBlocks(blocks) {
  try {
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
  } catch (e) {
    console.error("Failed to save blocks:", e);
  }
}

export function isSlotBlocked(blocks, teacherName, day, timeKey) {
  const teacherBlocks = blocks[teacherName];
  if (!teacherBlocks) return false;

  // Check if entire day is blocked
  if (teacherBlocks.blockedDays?.includes(day)) return true;

  // Check if specific slot is blocked
  return teacherBlocks.blockedSlots?.[day]?.includes(timeKey) || false;
}

export function isDayBlocked(blocks, teacherName, day) {
  return blocks[teacherName]?.blockedDays?.includes(day) || false;
}

export function blockSlot(blocks, teacherName, day, timeKey) {
  if (!blocks[teacherName]) blocks[teacherName] = { blockedDays: [], blockedSlots: {} };
  if (!blocks[teacherName].blockedSlots) blocks[teacherName].blockedSlots = {};
  if (!blocks[teacherName].blockedSlots[day]) blocks[teacherName].blockedSlots[day] = [];

  if (!blocks[teacherName].blockedSlots[day].includes(timeKey)) {
    blocks[teacherName].blockedSlots[day].push(timeKey);
  }

  saveBlocks(blocks);
  return blocks;
}

export function unblockSlot(blocks, teacherName, day, timeKey) {
  if (!blocks[teacherName]) return blocks;
  if (blocks[teacherName].blockedSlots?.[day]) {
    blocks[teacherName].blockedSlots[day] = blocks[teacherName].blockedSlots[day].filter(
      (k) => k !== timeKey
    );
    if (blocks[teacherName].blockedSlots[day].length === 0) {
      delete blocks[teacherName].blockedSlots[day];
    }
  }
  saveBlocks(blocks);
  return blocks;
}

export function blockDay(blocks, teacherName, day) {
  if (!blocks[teacherName]) blocks[teacherName] = { blockedDays: [], blockedSlots: {} };
  if (!blocks[teacherName].blockedDays) blocks[teacherName].blockedDays = [];

  if (!blocks[teacherName].blockedDays.includes(day)) {
    blocks[teacherName].blockedDays.push(day);
  }

  // Remove individual slot blocks for this day since the whole day is now blocked
  if (blocks[teacherName].blockedSlots?.[day]) {
    delete blocks[teacherName].blockedSlots[day];
  }

  saveBlocks(blocks);
  return blocks;
}

export function unblockDay(blocks, teacherName, day) {
  if (!blocks[teacherName]) return blocks;
  if (blocks[teacherName].blockedDays) {
    blocks[teacherName].blockedDays = blocks[teacherName].blockedDays.filter((d) => d !== day);
  }
  saveBlocks(blocks);
  return blocks;
}

// ===== HELPERS =====
export function getScheduledStudents(schedules, teacherName) {
  const teacherSched = schedules[teacherName] || {};
  const students = new Set();
  for (const day of Object.keys(teacherSched)) {
    for (const slot of Object.keys(teacherSched[day])) {
      if (teacherSched[day][slot]?.studentName) {
        students.add(teacherSched[day][slot].studentName);
      }
    }
  }
  return students;
}

export function getScheduledTeachers(schedules) {
  return new Set(Object.keys(schedules));
}

// ===== SYNC: Students → Teacher Schedules =====
// This is the central function that rebuilds all teacher schedules from student data.
// Every time a student is updated, this syncs the changes to the teacher schedule store.
export function syncStudentsToTeachers() {
  try {
    const students = loadStudents();

    // Build fresh teacher schedules from student data
    const newSchedules = {};

    students.forEach((student) => {
      // Skip students who are stopped or on break — they shouldn't appear in teacher schedules
      if (student.status === "stopped" || student.status === "on-break") return;

      // Skip students without a teacher or schedules
      if (!student.currentTeacher) return;
      if (!student.schedules || !Array.isArray(student.schedules) || student.schedules.length === 0) return;

      const teacherName = student.currentTeacher;
      if (!newSchedules[teacherName]) newSchedules[teacherName] = {};

      student.schedules.forEach((sched) => {
        if (!sched || !sched.days) return;
        
        // Handle days as string (old format) or array (new format)
        let daysToProcess = [];
        if (Array.isArray(sched.days)) {
          daysToProcess = sched.days;
        } else if (typeof sched.days === "string") {
          const raw = sched.days.trim().toLowerCase();
          if (raw === "mwf") daysToProcess = ["Monday", "Wednesday", "Friday"];
          else if (raw === "tth") daysToProcess = ["Tuesday", "Thursday"];
          else if (raw === "daily") daysToProcess = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          else if (raw === "weekend") daysToProcess = ["Saturday", "Sunday"];
          else if (raw.includes(",")) daysToProcess = raw.split(",").map(d => d.trim());
          else if (raw.includes(" ")) daysToProcess = raw.split(" ").map(d => d.trim());
          else daysToProcess = raw.match(/[A-Z][a-z]+/g) || raw.match(/.{1,3}/g) || [raw];
        }

        const DAYS_MAP = {
          "mon": "Monday", "tue": "Tuesday", "wed": "Wednesday", "thu": "Thursday", 
          "fri": "Friday", "sat": "Saturday", "sun": "Sunday",
          "monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday", 
          "thursday": "Thursday", "friday": "Friday", "saturday": "Saturday", "sunday": "Sunday"
        };
        
        daysToProcess = [...new Set(daysToProcess
          .map(d => {
            const key = d.toLowerCase().trim();
            return DAYS_MAP[key] || null;
          })
          .filter(Boolean)
        )];

        daysToProcess.forEach((day) => {
          if (!newSchedules[teacherName][day]) newSchedules[teacherName][day] = {};

          const startKey = sched.timeSlot || "08:00";
          const occupied = getOccupiedSlots(startKey, sched.duration || 25);

          occupied.forEach((slotKey) => {
            newSchedules[teacherName][day][slotKey] = {
              studentName: student.name,
              teacherName: teacherName,
              classType: (sched.classType || student.classType || "online").toLowerCase(),
              className: sched.className || student.className || "",
              book: sched.book || student.book || "",
              duration: sched.duration || 25,
              studentStatus: student.status || "active",
              scheduleId: sched.id || "",
              startKey: startKey,
            };
          });
        });
      });
    });

    saveSchedules(newSchedules);
    return newSchedules;
  } catch (err) {
    console.error("Error in syncStudentsToTeachers:", err);
    return loadSchedules();
  }
}

// ===== TRASH / RECYCLE BIN =====
export function loadTrash() {
  try {
    const data = localStorage.getItem(TRASH_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTrash(data) {
  try {
    localStorage.setItem(TRASH_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save trash:", e);
  }
}

// Move student to trash (soft delete)
export function moveToTrash(student) {
  const trash = loadTrash();
  const trashItem = {
    id: Date.now().toString(),
    type: "student",
    data: { ...student },
    deletedAt: new Date().toISOString(),
    deletedBy: "admin",
  };
  trash.unshift(trashItem); // Add to beginning
  saveTrash(trash);
  return trash;
}

// Restore student from trash
export function restoreFromTrash(trashId) {
  const trash = loadTrash();
  const item = trash.find((t) => t.id === trashId);
  if (!item) return { trash: trash, restored: null };

  const restoredStudent = item.data;
  const remainingTrash = trash.filter((t) => t.id !== trashId);
  saveTrash(remainingTrash);

  // Add student back
  const students = loadStudents();
  students.push(restoredStudent);
  saveStudents(students);
  syncStudentsToTeachers();

  return { trash: remainingTrash, restored: restoredStudent };
}

// Permanently delete from trash
export function permanentlyDeleteFromTrash(trashId) {
  const trash = loadTrash();
  const remainingTrash = trash.filter((t) => t.id !== trashId);
  saveTrash(remainingTrash);
  return remainingTrash;
}

// Empty entire trash
export function emptyTrash() {
  saveTrash([]);
  return [];
}

// Get trash count
export function getTrashCount() {
  return loadTrash().length;
}
