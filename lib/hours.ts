// Library hours utility — will later be sourced from Sanity CMS
export interface DayHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export const LIBRARY_HOURS: DayHours[] = [
  { day: "Monday", open: "10:00 AM", close: "5:00 PM", closed: false },
  { day: "Tuesday", open: "10:00 AM", close: "7:00 PM", closed: false },
  { day: "Wednesday", open: "10:00 AM", close: "5:00 PM", closed: false },
  { day: "Thursday", open: "10:00 AM", close: "5:00 PM", closed: false },
  { day: "Friday", open: "10:00 AM", close: "5:00 PM", closed: false },
  { day: "Saturday", open: "10:00 AM", close: "2:00 PM", closed: false },
  { day: "Sunday", open: "", close: "", closed: true },
];

export const PASSPORT_HOURS: DayHours[] = [
  { day: "Monday", open: "10:00 AM", close: "5:00 PM", closed: false },
  { day: "Tuesday", open: "", close: "", closed: true },
  { day: "Wednesday", open: "", close: "", closed: true },
  { day: "Thursday", open: "10:00 AM", close: "5:00 PM", closed: false },
  { day: "Friday", open: "10:00 AM", close: "5:00 PM", closed: false },
  { day: "Saturday", open: "10:00 AM", close: "2:00 PM", closed: false }, // First Saturday only
  { day: "Sunday", open: "", close: "", closed: true },
];

export function getLibraryStatus(): { isOpen: boolean; message: string } {
  const now = new Date();
  const dayIndex = now.getDay(); // 0=Sunday
  // Remap to our array: Mon=0, Tue=1, ... Sun=6
  const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const today = LIBRARY_HOURS[mappedIndex];

  if (today.closed) {
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextIndex = (mappedIndex + i) % 7;
      const nextDay = LIBRARY_HOURS[nextIndex];
      if (!nextDay.closed) {
        return {
          isOpen: false,
          message: `Closed · Opens ${nextDay.day} ${nextDay.open}`,
        };
      }
    }
    return { isOpen: false, message: "Closed" };
  }

  // Parse hours for comparison
  const parseTime = (timeStr: string): Date => {
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date(now);
    let h = hours;
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    date.setHours(h, minutes, 0, 0);
    return date;
  };

  const openTime = parseTime(today.open);
  const closeTime = parseTime(today.close);

  if (now >= openTime && now < closeTime) {
    return { isOpen: true, message: `Open until ${today.close}` };
  } else if (now < openTime) {
    return { isOpen: false, message: `Closed · Opens today at ${today.open}` };
  } else {
    // After closing — find next open day
    for (let i = 1; i <= 7; i++) {
      const nextIndex = (mappedIndex + i) % 7;
      const nextDay = LIBRARY_HOURS[nextIndex];
      if (!nextDay.closed) {
        return {
          isOpen: false,
          message: `Closed · Opens ${nextDay.day} ${nextDay.open}`,
        };
      }
    }
    return { isOpen: false, message: "Closed" };
  }
}
