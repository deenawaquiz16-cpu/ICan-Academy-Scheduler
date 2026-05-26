export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const DURATIONS = [
  { label: "25 min", value: 25, slots: 1 },
  { label: "50 min (1 hr)", value: 50, slots: 2 },
  { label: "100 min (2 hrs)", value: 100, slots: 4 },
];

// Generate time slots from 8:00 AM to 11:55 PM with 25-min classes and 5-min gaps
export function generateTimeSlots() {
  const slots = [];
  let hour = 8;
  let minute = 0;

  while (hour < 24) {
    // Skip lunch break 12:00-1:00 PM
    if (hour === 12 && minute === 0) {
      slots.push({
        start: "12:00 PM",
        end: "1:00 PM",
        label: "12:00 PM",
        isLunch: true,
        key: "12:00",
      });
      hour = 13;
      minute = 0;
      continue;
    }

    const key = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const startTime = formatTime(hour, minute);
    
    // Calculate end time (25 mins later)
    let endH = hour;
    let endM = minute + 25;
    if (endM >= 60) {
      endH += Math.floor(endM / 60);
      endM = endM % 60;
    }
    const endTime = formatTime(endH, endM);
    const label = `${startTime} – ${endTime}`;

    let period = "Morning";
    if (hour === 12) period = "Lunch Break";
    else if (hour >= 13 && hour < 18) period = "Afternoon";
    else if (hour >= 18) period = "Evening";

    slots.push({
      start: startTime,
      end: endTime,
      label: label,
      isLunch: hour === 12,
      period: period,
      key,
    });

    // Add 5-minute gap
    minute += 30;
    if (minute >= 60) {
      hour += Math.floor(minute / 60);
      minute = minute % 60;
    }
  }

  return slots;
}

function formatTime(hour, minute) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}

export const TIME_SLOTS = generateTimeSlots();

// Get the index of a time slot by its key
export function getTimeSlotIndex(key) {
  return TIME_SLOTS.findIndex((s) => s.key === key);
}

// Get time slots that a class spans given a start key and duration
export function getOccupiedSlots(startKey, duration) {
  const durationConfig = DURATIONS.find((d) => d.value === duration);
  if (!durationConfig) return [startKey];

  const startIndex = getTimeSlotIndex(startKey);
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

// Calculate the actual end time string for a class given start key and duration
export function getClassEndTime(startKey, duration) {
  const startIndex = getTimeSlotIndex(startKey);
  if (startIndex === -1) return "";

  const startSlot = TIME_SLOTS[startIndex];
  const [h, m] = startSlot.key.split(":").map(Number);
  const totalMinutes = m + duration;
  let endH = h + Math.floor(totalMinutes / 60);
  let endM = totalMinutes % 60;
  return formatTime(endH, endM);
}
