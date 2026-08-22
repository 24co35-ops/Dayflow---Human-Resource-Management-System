export type AttendanceStatus = "present" | "absent" | "half_day" | "leave"

export function attendanceLabel(status: AttendanceStatus) {
  return status === "half_day" ? "Half-day" : status.charAt(0).toUpperCase() + status.slice(1)
}

export function workedHours(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
