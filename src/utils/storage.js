const TEACHERS_KEY = "english-academy-teachers";
const STUDENTS_KEY = "english-academy-students";
const SCHEDULES_KEY = "english-academy-schedules";
const BLOCKS_KEY = "english-academy-blocks";
const TRASH_KEY = "ican-academy-trash";

// ===== TEACHERS =====
export function loadTeachers() {
  try {
    let data = localStorage.getItem(TEACHERS_KEY);
    
    // Recovery for teachers
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

    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load teachers:", e);
  }
  const defaults = {
    academy: [
      "Greg", "Mari", "Analyn", "Argel", "Ceige", "Deena", "Eunice", "Ezra", 
      "Faye", "Janice", "Karen", "Melody", "Paula", "Rafael", "Rozeil", 
      "Ianne", "Christine", "Demple", "JM", "Luis"
    ],
    wfh: ["Anna", "James", "Lisa", "Thomas", "Rachel", "Daniel", "Laura", "Kevin"],
  };
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
    name,
    startDate: "",
    endDate: "",
    className: "",
    classType: "face-to-face",
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
  const data = loadStudents();
  const student = data.find((s) => s.id === id);
  if (student) {
    Object.assign(student, updates);
    saveStudents(data);
    // Sync changes to teacher schedules
    syncStudentsToTeachers();
  }
  return data;
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
    syncStudentsToTeachers();
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
        const daysToProcess = typeof sched.days === "string" 
          ? sched.days.match(/.{1,3}/g) || [] 
          : Array.isArray(sched.days) ? sched.days : [];

        daysToProcess.forEach((day) => {
          if (!newSchedules[teacherName][day]) newSchedules[teacherName][day] = {};

          // Use 08:00 as default start key
          const startKey = sched.timeSlot || "08:00";
          const occupied = getOccupiedSlotsForSync(startKey, sched.duration || 25);

          occupied.forEach((slotKey) => {
            newSchedules[teacherName][day][slotKey] = {
              studentName: student.name,
              teacherName: teacherName,
              classType: sched.classType || student.classType || "face-to-face",
              className: sched.className || student.className || "",
              book: sched.book || student.book || "",
              duration: sched.duration || 25,
              studentStatus: student.status || "active",
              scheduleId: sched.id || "",
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

// Helper: get occupied slots (duplicated from timeSlots to avoid circular import)
function getOccupiedSlotsForSync(startKey, duration) {
  const DURATIONS = [
    { label: "25 min", value: 25, slots: 1 },
    { label: "50 min (1 hr)", value: 50, slots: 2 },
    { label: "100 min (2 hrs)", value: 100, slots: 4 },
  ];

  const TIME_SLOTS = generateTimeSlotsForSync();

  const durationConfig = DURATIONS.find((d) => d.value === duration);
  if (!durationConfig) return [startKey];

  const startIndex = TIME_SLOTS.findIndex((s) => s.key === startKey);
  if (startIndex === -1) return [startKey];

  const occupied = [];
  for (let i = 0; i < durationConfig.slots; i++) {
    const idx = startIndex + i;
    if (idx < TIME_SLOTS.length && !TIME_SLOTS[idx].isLunch) {
      occupied.push(TIME_SLOTS[idx].key);
    }
  }
  return occupied;
}

function generateTimeSlotsForSync() {
  const slots = [];
  let hour = 8;
  let minute = 0;

  while (hour < 24) {
    if (hour === 12 && minute === 0) {
      slots.push({ start: "12:00 PM", end: "1:00 PM", label: "12:00 PM", isLunch: true, key: "12:00" });
      hour = 13;
      minute = 0;
      continue;
    }

    const endMinute = minute + 25;
    let endMin = endMinute;
    if (endMin >= 60) {
      endMin = endMin % 60;
    }

    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMinute = minute.toString().padStart(2, "0");
    const startTime = `${displayHour}:${displayMinute} ${period}`;
    const key = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    slots.push({ start: startTime, end: "", label: startTime, isLunch: false, key });

    minute += 30;
    if (minute >= 60) {
      hour += Math.floor(minute / 60);
      minute = minute % 60;
    }
  }

  return slots;
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
