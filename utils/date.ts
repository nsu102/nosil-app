export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const fmtDate = (d: Date): string =>
  (d.getMonth() + 1) + '월 ' + d.getDate() + '일';

export const fmtFull = (d: Date): string => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + days[d.getDay()] + ')';
};
