const FIXED_HOLIDAYS = {
  "01-01": "New Year's Day",
  "02-25": "EDSA People Power Revolution Anniversary",
  "04-09": "Araw ng Kagitingan",
  "05-01": "Labor Day",
  "06-12": "Independence Day",
  "08-21": "Ninoy Aquino Day",
  "11-01": "All Saints' Day",
  "11-02": "All Souls' Day",
  "11-30": "Bonifacio Day",
  "12-08": "Feast of the Immaculate Conception",
  "12-25": "Christmas Day",
  "12-30": "Rizal Day",
  "12-31": "Last Day of the Year",
};

// Moving holidays for 2025-2027
const MOVABLE_HOLIDAYS = {
  "2025": {
    "2025-04-17": "Maundy Thursday",
    "2025-04-18": "Good Friday",
    "2025-04-19": "Black Saturday",
    "2025-08-25": "National Heroes Day",
  },
  "2026": {
    "2026-04-02": "Maundy Thursday",
    "2026-04-03": "Good Friday",
    "2026-04-04": "Black Saturday",
    "2026-08-31": "National Heroes Day",
  },
  "2027": {
    "2027-03-25": "Maundy Thursday",
    "2027-03-26": "Good Friday",
    "2027-03-27": "Black Saturday",
    "2027-08-30": "National Heroes Day",
  }
};

export function getHoliday(dateKey) {
  // dateKey is YYYY-MM-DD
  const [year, month, day] = dateKey.split("-");
  const monthDay = `${month}-${day}`;

  // Check fixed holidays
  if (FIXED_HOLIDAYS[monthDay]) {
    return FIXED_HOLIDAYS[monthDay];
  }

  // Check movable holidays
  if (MOVABLE_HOLIDAYS[year] && MOVABLE_HOLIDAYS[year][dateKey]) {
    return MOVABLE_HOLIDAYS[year][dateKey];
  }

  return null;
}

export function getAllHolidaysForYear(year) {
  const holidays = {};
  
  // Add fixed
  Object.entries(FIXED_HOLIDAYS).forEach(([md, name]) => {
    holidays[`${year}-${md}`] = name;
  });

  // Add movable
  if (MOVABLE_HOLIDAYS[year]) {
    Object.entries(MOVABLE_HOLIDAYS[year]).forEach(([dk, name]) => {
      holidays[dk] = name;
    });
  }

  // Sort by date
  return Object.keys(holidays)
    .sort()
    .reduce((acc, key) => {
      acc[key] = holidays[key];
      return acc;
    }, {});
}
