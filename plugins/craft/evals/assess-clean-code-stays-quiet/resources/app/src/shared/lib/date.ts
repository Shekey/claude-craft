const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function localToday(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isIsoDate(value: string) {
  return ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));
}
