export const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

export const toStartOfDay = (input: Date) => {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const toEndOfDay = (input: Date) => {
  const date = new Date(input);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const addDays = (input: Date, amount: number) => {
  const date = new Date(input);
  date.setDate(date.getDate() + amount);
  return date;
};

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const formatYear = (date: Date) => String(date.getFullYear());

export const startOfISOWeek = (date: Date) => {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  clone.setDate(clone.getDate() + diff);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

export const endOfISOWeek = (date: Date) => {
  const start = startOfISOWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const isoWeekLabel = (date: Date) => {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${temp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

export const enumerateDays = (start: Date, end: Date) => {
  const days: Date[] = [];
  let cursor = toStartOfDay(start);
  const last = toStartOfDay(end);

  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  return days;
};
