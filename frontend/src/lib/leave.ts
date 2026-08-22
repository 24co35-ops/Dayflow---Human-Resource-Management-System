export type LeaveStatus = "pending" | "approved" | "rejected"

export function leaveStatusTone(status: LeaveStatus) {
  return status === "approved" ? "success" : status === "rejected" ? "danger" : "attention"
}

export function inclusiveLeaveDays(start: string, end: string) {
  const from = new Date(`${start}T00:00:00`).getTime()
  const to = new Date(`${end}T00:00:00`).getTime()
  return Math.floor((to - from) / 86400000) + 1
}
