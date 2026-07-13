const monthNames = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
];

export function getCivilDateInputValue(value?: string | null) {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

export function formatCivilDateLong(value: string) {
  const parts = getCivilDateParts(value);
  if (!parts) return value;
  return `${parts.day} de ${monthNames[parts.month - 1]} de ${parts.year}`;
}

export function formatCivilDateShort(value: string) {
  const parts = getCivilDateParts(value);
  if (!parts) return value;
  return `${parts.day}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

export function formatDateObjectShort(value: Date) {
  return `${String(value.getDate()).padStart(2, "0")}/${String(value.getMonth() + 1).padStart(2, "0")}/${value.getFullYear()}`;
}

export function formatInstantDateLong(value: string) {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatLocalTime24(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function getLocalTimeOfDayInMinutes(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return (date.getHours() * 60) + date.getMinutes();
}

export function isSameCivilDay(value: string, date: Date) {
  const candidate = new Date(value);
  return (
    candidate.getFullYear() === date.getFullYear() &&
    candidate.getMonth() === date.getMonth() &&
    candidate.getDate() === date.getDate()
  );
}

export function isBirthdayToday(value?: string | null) {
  const parts = value ? getCivilDateParts(value) : null;
  if (!parts) return false;
  const today = new Date();
  return parts.month === today.getMonth() + 1 && Number(parts.day) === today.getDate();
}

function getCivilDateParts(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return {
    year: match[1],
    month: Number(match[2]),
    day: match[3]
  };
}
