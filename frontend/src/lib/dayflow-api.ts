export type DayflowRole = "employee" | "hr" | "admin"

export type DayflowActor = {
  role: DayflowRole
  profileId: string
}

export type DayflowProfile = {
  id: string
  employee_code: string
  full_name: string
  email: string
  role: DayflowRole
  department: string
  job_position: string
  location: string
}

export type DayflowAttendance = {
  id: string
  profile_id: string
  attendance_date: string
  status: "present" | "absent" | "half_day" | "leave"
  check_in_at: string | null
  check_out_at: string | null
  worked_minutes: number
}

export type DayflowLeave = {
  id: string
  profile_id: string
  employee_name: string
  leave_type: "paid" | "sick" | "unpaid"
  start_date: string
  end_date: string
  days: number
  remarks: string
  status: "pending" | "approved" | "rejected"
  review_comment: string | null
  reviewer_id: string | null
  reviewed_at: string | null
}

export type DayflowPayroll = {
  profile_id: string
  employee_name: string
  employee_code: string
  period_year: number
  period_month: number
  basic_salary: number
  hra_allowance: number
  standard_allowance: number
  performance_bonus: number
  deductions: number
  net_salary: number
  payable_days: number
  attendance_days: number
}

export type DayflowActivity = {
  id: string
  actor_id: string
  event_type: string
  entity_type: string
  entity_id: string
  message: string
  created_at: string
}

export type DayflowDashboard = {
  role: DayflowRole
  employee_count: number
  pending_leaves: number
  present_today: number
  absent_today: number
  pulse: Array<{
    name: string
    status: string
    check_in_at: string | null
  }>
  recent_activity: string[]
}

export type FlowAction = {
  action: "apply_leave"
  data: {
    leave_type: DayflowLeave["leave_type"]
    start_date: string
    end_date: string
    remarks: string
  }
}

export type FlowResponse = {
  answer: string
  action: FlowAction | null
}

export type DayflowLeaveInput = {
  leave_type: DayflowLeave["leave_type"]
  start_date: string
  end_date: string
  remarks?: string
}

export class DayflowApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "DayflowApiError"
    this.status = status
  }
}

const apiBase = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/$/, "")

function actorHeaders(actor: DayflowActor): Record<string, string> {
  return {
    "X-Dayflow-Demo-Role": actor.role,
    "X-Dayflow-Demo-Profile-Id": actor.profileId,
  }
}

function actorParams(actor: DayflowActor): string {
  const params = new URLSearchParams({ role: actor.role, profile_id: actor.profileId })
  return params.toString()
}

async function request<T>(
  path: string,
  actor: DayflowActor,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBase}/api/v1/dayflow${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...actorHeaders(actor),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = typeof body?.detail === "string" ? body.detail : "Dayflow request failed"
    throw new DayflowApiError(detail, response.status)
  }
  return body as T
}

export function createDayflowClient(actor: DayflowActor) {
  const query = actorParams(actor)
  return {
    actor,
    getMe: () => request<DayflowProfile>(`/me?${query}`, actor),
    getDashboard: () => request<DayflowDashboard>(`/dashboard?${query}`, actor),
    getAttendance: () => request<DayflowAttendance[]>(`/attendance?${query}`, actor),
    checkIn: () => request<DayflowAttendance>(`/attendance/check-in?${query}`, actor, { method: "POST" }),
    checkOut: () => request<DayflowAttendance>(`/attendance/check-out?${query}`, actor, { method: "POST" }),
    getLeaves: () => request<DayflowLeave[]>(`/leave-requests?${query}`, actor),
    getPayroll: () => request<DayflowPayroll[]>(`/payroll?${query}`, actor),
    createLeave: (input: DayflowLeaveInput) =>
      request<DayflowLeave>(`/leave-requests?${query}`, actor, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    reviewLeave: (requestId: string, status: "approved" | "rejected", reviewComment = "") =>
      request<DayflowLeave>(`/leave-requests/${requestId}?${query}`, actor, {
        method: "PATCH",
        body: JSON.stringify({ status, review_comment: reviewComment }),
      }),
    getActivity: () => request<DayflowActivity[]>(`/activity?${query}`, actor),
    flowMessage: (message: string) =>
      request<FlowResponse>("/flow/message", actor, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
  }
}
