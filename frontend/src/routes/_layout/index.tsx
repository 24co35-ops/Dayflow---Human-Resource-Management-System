import { createFileRoute } from "@tanstack/react-router"
import {
  ArrowUpRight,
  Bot,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Flame,
  Globe2,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { AsyncState } from "@/components/AsyncState"
import { EmployeeProvisioningForm } from "@/components/EmployeeProvisioningForm"
import { LeaveRequestForm, type LeaveDraft } from "@/components/LeaveRequestForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  DayflowApiError,
  type DayflowAttendance,
  type DayflowLeave,
  type DayflowEmployeeInput,
  type DayflowLeaveInput,
  type DayflowProfile,
  type DayflowProvisionedEmployee,
} from "@/lib/dayflow-api"
import { cn } from "@/lib/utils"
import { dayflowApiEnabled, useDayflow } from "@/hooks/useDayflow"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [{ title: "Dayflow — Every workday, perfectly aligned" }],
  }),
})

type Role = "employee" | "hr"
type View = "Overview" | "Attendance" | "Leave & time off" | "People" | "Payroll" | "Profile"
type LeaveStatus = "pending" | "approved" | "rejected"

type LeaveRequest = {
  id: string
  name: string
  initials: string
  type: string
  dates: string
  days: number
  status: LeaveStatus
  tone: string
}

const employees = [
  { name: "Arjun Singh", role: "Software Engineer", department: "Engineering", initials: "AS", status: "present", time: "09:02 AM", tone: "bg-[#d8efbd] text-[#3c6c32]" },
  { name: "Priya Nair", role: "Product Designer", department: "Design", initials: "PN", status: "present", time: "09:15 AM", tone: "bg-[#f7d8d0] text-[#9b4e40]" },
  { name: "Rahul Mehta", role: "Product Manager", department: "Product", initials: "RM", status: "late", time: "Expected 09:00", tone: "bg-[#f9e5ba] text-[#8d6817]" },
  { name: "Sara D'Souza", role: "People Partner", department: "People Ops", initials: "SD", status: "leave", time: "Approved leave", tone: "bg-[#dce4f7] text-[#4f6291]" },
  { name: "Karan Shah", role: "Frontend Engineer", department: "Engineering", initials: "KS", status: "away", time: "Not checked in", tone: "bg-[#e9e9e3] text-[#75796f]" },
]

const initialLeaves: LeaveRequest[] = [
  { id: "leave-1", name: "Meera Joshi", initials: "MJ", type: "Sick leave", dates: "Aug 25 – 26", days: 2, status: "pending", tone: "bg-[#f1d3c9] text-[#8a4738]" },
  { id: "leave-2", name: "Arjun Singh", initials: "AS", type: "Paid time off", dates: "Aug 20 – 21", days: 2, status: "approved", tone: "bg-[#d8efbd] text-[#3c6c32]" },
  { id: "leave-3", name: "Priya Nair", initials: "PN", type: "Unpaid leave", dates: "Aug 18", days: 1, status: "rejected", tone: "bg-[#f7d8d0] text-[#9b4e40]" },
]

const attendanceBars = [68, 82, 74, 94, 78, 88, 95, 81, 92, 86, 98, 90, 84, 95, 93, 87, 96, 89, 94, 91, 97]

const leaveTypeLabels = { paid: "Paid time off", sick: "Sick leave", unpaid: "Unpaid leave" } as const

function mapApiLeave(leave: DayflowLeave): LeaveRequest {
  const start = new Date(`${leave.start_date}T00:00:00`)
  const end = new Date(`${leave.end_date}T00:00:00`)
  const formatDate = (value: Date) => value.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  return {
    id: leave.id,
    name: leave.employee_name,
    initials: leave.employee_name.split(" ").map((part) => part[0]).join("").slice(0, 2),
    type: leaveTypeLabels[leave.leave_type],
    dates: leave.start_date === leave.end_date ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`,
    days: leave.days,
    status: leave.status,
    tone: leave.status === "approved" ? "bg-[#d8efbd] text-[#3c6c32]" : leave.status === "rejected" ? "bg-[#f7d8d0] text-[#9b4e40]" : "bg-[#f1d3c9] text-[#8a4738]",
  }
}

function mapApiPeople(people: DayflowProfile[]) {
  return people.map((person, index) => ({
    id: person.id,
    name: person.full_name,
    role: person.job_position,
    department: person.department,
    initials: person.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2),
    status: index === 0 ? "present" as const : "away" as const,
    time: index === 0 ? "09:02 AM" : "Not checked in",
    tone: index % 2 === 0 ? "bg-[#d8efbd] text-[#3c6c32]" : "bg-[#dce4f7] text-[#4f6291]",
  }))
}

function leaveInputFromDraft(draft: LeaveDraft): DayflowLeaveInput {
  const leaveType = draft.type === "Sick leave" ? "sick" : draft.type === "Unpaid leave" ? "unpaid" : "paid"
  return { leave_type: leaveType, start_date: draft.startDate, end_date: draft.endDate, remarks: draft.remarks, attachment_name: draft.attachmentName, attachment_size: draft.attachmentSize }
}

function getApiError(error: unknown): string {
  return error instanceof DayflowApiError ? error.message : "Dayflow could not complete that action. Try again."
}

function Dashboard() {
  const [role, setRole] = useState<Role>("employee")
  const dayflow = useDayflow(role)
  const [view, setView] = useState<View>("Overview")
  const [checkedIn, setCheckedIn] = useState(false)
  const [leaves, setLeaves] = useState(initialLeaves)
  const [flowOpen, setFlowOpen] = useState(false)
  const [flowInput, setFlowInput] = useState("")
  const [flowMessages, setFlowMessages] = useState([
    { from: "flow", text: "Hi Ashwith. I’m Flow, your HR companion. What should we make easier today?" },
  ])
  const [draftLeave, setDraftLeave] = useState(false)

  useEffect(() => {
    const viewByHash: Record<string, View> = {
      overview: "Overview",
      attendance: "Attendance",
      "leave-time-off": "Leave & time off",
      people: "People",
      payroll: "Payroll",
    }
    const syncView = () => {
      const next = viewByHash[window.location.hash.replace("#", "")]
      if (next) setView(next)
    }
    syncView()
    window.addEventListener("hashchange", syncView)
    return () => window.removeEventListener("hashchange", syncView)
  }, [])

  const apiLeaves = useMemo(
    () => dayflow.leaves.data?.map(mapApiLeave) ?? null,
    [dayflow.leaves.data],
  )
  const sortedLeaves = useMemo(() => apiLeaves ?? leaves, [apiLeaves, leaves])
  const pendingCount = sortedLeaves.filter((leave) => leave.status === "pending").length
  const approvedCount = sortedLeaves.filter((leave) => leave.status === "approved").length
  const currentUser = role === "hr" ? "Ashwith Shetty" : "Arjun Singh"
  const todayAttendance = dayflow.attendance.data?.find(
    (item) => item.attendance_date === new Date().toISOString().slice(0, 10),
  )
  const effectiveCheckedIn = dayflowApiEnabled
    ? Boolean(todayAttendance?.check_in_at && !todayAttendance.check_out_at)
    : checkedIn

  useEffect(() => {
    if (dayflowApiEnabled && dayflow.me.data) setRole(dayflow.me.data.role === "hr" ? "hr" : "employee")
  }, [dayflow.me.data])

  const sendFlow = (prompt = flowInput) => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    setFlowMessages((items) => [...items, { from: "user", text: trimmed }])
    setFlowInput("")
    if (dayflowApiEnabled) {
      dayflow.flowMessage.mutate(trimmed, {
        onSuccess: (response) => {
          setFlowMessages((items) => [...items, { from: "flow", text: response.answer }])
          if (response.action?.action === "apply_leave") setDraftLeave(true)
        },
        onError: (error) => toast.error(getApiError(error)),
      })
      return
    }
    const lower = trimmed.toLowerCase()
    window.setTimeout(() => {
      if (lower.includes("leave") || lower.includes("off") || lower.includes("sick")) {
        setFlowMessages((items) => [...items, { from: "flow", text: "I can draft a 2-day Sick Leave request for Monday 25 Aug to Tuesday 26 Aug. I’ll keep it pending until HR reviews it." }])
        setDraftLeave(true)
      } else if (lower.includes("absent") || lower.includes("attendance")) {
        setFlowMessages((items) => [...items, { from: "flow", text: "Rahul Mehta has the highest absence signal this week with 2 missed days. Karan Shah has not checked in today. I can open the attendance view for you." }])
      } else if (lower.includes("pay") || lower.includes("salary") || lower.includes("payslip")) {
        setFlowMessages((items) => [...items, { from: "flow", text: "The latest payroll snapshot is ready. Net salary is ₹51,800 after PF and professional tax deductions. Open Payroll to generate the PDF." }])
      } else {
        setFlowMessages((items) => [...items, { from: "flow", text: "I found the workday signal. Try asking me about attendance, pending leaves, salary, or say ‘I need sick leave’." }])
      }
    }, 280)
  }

  const confirmLeave = () => {
    const input: DayflowLeaveInput = {
      leave_type: "sick",
      start_date: "2026-08-25",
      end_date: "2026-08-26",
      remarks: "Requested through Flow",
    }
    if (dayflowApiEnabled) {
      dayflow.createLeave.mutate(input, {
        onSuccess: () => {
          setDraftLeave(false)
          toast.success("Leave request sent to People Ops")
          setFlowMessages((items) => [...items, { from: "flow", text: "Done — your sick leave request is now Pending. I’ll keep it visible in your activity." }])
        },
        onError: (error) => toast.error(getApiError(error)),
      })
      return
    }
    const next: LeaveRequest = { id: `leave-${Date.now()}`, name: "Arjun Singh", initials: "AS", type: "Sick leave", dates: "Aug 25 – 26", days: 2, status: "pending", tone: "bg-[#d8efbd] text-[#3c6c32]" }
    setLeaves((items) => [next, ...items])
    setDraftLeave(false)
    toast.success("Leave request sent to People Ops")
    setFlowMessages((items) => [...items, { from: "flow", text: "Done — your sick leave request is now Pending. I’ll keep it visible in your activity." }])
  }

  const updateLeave = (id: string, status: LeaveStatus) => {
    if (status === "pending") return
    if (dayflowApiEnabled) {
      dayflow.reviewLeave.mutate({ requestId: id, status }, {
        onSuccess: () => toast.success(status === "approved" ? "Leave approved and employee notified" : "Leave request rejected"),
        onError: (error) => toast.error(getApiError(error)),
      })
      return
    }
    setLeaves((items) => items.map((leave) => (leave.id === id ? { ...leave, status } : leave)))
    toast.success(status === "approved" ? "Leave approved and employee notified" : "Leave request rejected")
  }

  const selectView = (next: View) => setView(next)

  const changeRole = (next: Role) => {
    setRole(next)
    setView("Overview")
    window.localStorage.setItem("dayflow-demo-role", next)
    window.dispatchEvent(new CustomEvent("dayflow-role-change"))
  }

  const toggleAttendance = () => {
    if (dayflowApiEnabled) {
      const mutation = effectiveCheckedIn ? dayflow.checkOut : dayflow.checkIn
      mutation.mutate(undefined, {
        onSuccess: () => toast.success(effectiveCheckedIn ? "Checked out. Have a good evening!" : "Checked in. Your workday is live."),
        onError: (error) => toast.error(getApiError(error)),
      })
      return
    }
    setCheckedIn((value) => !value)
    toast.success(effectiveCheckedIn ? "Checked out. Have a good evening!" : "Checked in at 09:18 AM")
  }

  const submitLeave = (draft: LeaveDraft) => {
    if (dayflowApiEnabled) {
      dayflow.createLeave.mutate(leaveInputFromDraft(draft), {
        onSuccess: () => toast.success("Leave request submitted for HR review"),
        onError: (error) => toast.error(getApiError(error)),
      })
      return
    }
    setLeaves((items) => [draft, ...items])
    toast.success("Leave request submitted for HR review")
  }

  return (
    <div className="space-y-7">
      {dayflowApiEnabled && dayflow.isLoading && <div className="rounded-xl border border-[#dfe5e0] bg-white px-4 py-3 text-xs font-semibold text-[#65737f]" role="status">Syncing the latest Dayflow workspace…</div>}
      {dayflowApiEnabled && dayflow.isError && <div className="rounded-xl border border-[#efc8bc] bg-[#fff4ef] px-4 py-3 text-xs font-semibold text-[#9b4e40]" role="alert">The Dayflow API is unavailable. Showing the last local fixture while you reconnect.</div>}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8792]"><span className="size-2 rounded-full bg-[#c7f36b]" /> People operations / {role === "hr" ? "HR command center" : "My workday"}</div>
          <h1 className="font-display text-[2.15rem] font-semibold tracking-[-0.055em] text-[#101d31] sm:text-[2.65rem]">Good morning, {currentUser.split(" ")[0]} <span className="text-[#a1adb7]">—</span> <span className="text-[#5f6b78]">let’s make today count.</span></h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#75818d]">A clear view of your people, their energy, and everything that needs your attention.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-[#dfe5e0] bg-white p-1 text-xs shadow-sm">
            <button className={cn("rounded-lg px-3 py-2 font-semibold transition", role === "employee" ? "bg-[#0e1c2f] text-white" : "text-[#78838d]")} onClick={() => changeRole("employee")} type="button">Employee view</button>
            <button className={cn("rounded-lg px-3 py-2 font-semibold transition", role === "hr" ? "bg-[#0e1c2f] text-white" : "text-[#78838d]")} onClick={() => changeRole("hr")} type="button">HR view</button>
          </div>
          <Button className="hidden rounded-xl bg-[#c7f36b] text-[#0e1c2f] shadow-sm hover:bg-[#b5e958] sm:flex" onClick={() => setFlowOpen(true)}><Sparkles className="mr-2 size-4" /> Ask Flow</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={role === "hr" ? "People present" : "Today’s status"} value={role === "hr" ? "84%" : effectiveCheckedIn ? "Checked in" : "Not checked in"} detail={role === "hr" ? "21 of 25 checked in" : effectiveCheckedIn ? "Since 09:18 AM · on track" : "Start your workday in one tap"} icon={<CalendarCheck className="size-5" />} tone="lime" action={role === "employee" ? { label: effectiveCheckedIn ? "Check out" : "Check in", onClick: toggleAttendance } : undefined} />
        <MetricCard label={role === "hr" ? "Pending approvals" : "Leave balance"} value={role === "hr" ? String(pendingCount).padStart(2, "0") : "14 days"} detail={role === "hr" ? "Need your attention today" : "4 days used this year"} icon={<Clock3 className="size-5" />} tone="peach" action={role === "employee" ? { label: "Request time off", onClick: () => setView("Leave & time off") } : { label: "Review now", onClick: () => setView("Leave & time off") }} />
        <MetricCard label="Attendance streak" value="23 days" detail="You’re in a good rhythm" icon={<Flame className="size-5" />} tone="blue" action={{ label: "Keep it going", onClick: () => toast("Small habits build great teams") }} />
        <MetricCard label={role === "hr" ? "Team pulse" : "Next payday"} value={role === "hr" ? "Positive" : "31 Aug"} detail={role === "hr" ? "+12% energy this week" : "8 days from now"} icon={<TrendingUp className="size-5" />} tone="lavender" action={role === "hr" ? { label: "View insights", onClick: () => setView("Attendance") } : { label: "View salary", onClick: () => setView("Payroll") }} />
      </div>

      {view === "Overview" && <Overview role={role} checkedIn={effectiveCheckedIn} leaves={sortedLeaves} approvedCount={approvedCount} setView={selectView} updateLeave={updateLeave} />}
      {view === "Attendance" && <AttendanceView role={role} checkedIn={effectiveCheckedIn} records={dayflow.attendance.data} />}
      {view === "Leave & time off" && <LeaveView role={role} leaves={sortedLeaves} updateLeave={updateLeave} onDraft={() => { setFlowOpen(true); setDraftLeave(true) }} onSubmitLeave={submitLeave} />}
      {view === "People" && <PeopleView role={role} serverPeople={dayflow.people.data} onCreatePerson={(input) => dayflow.createPerson.mutateAsync(input)} isCreating={dayflow.createPerson.isPending} />}
      {view === "Payroll" && <PayrollView role={role} />}
      {view === "Profile" && <ProfileView role={role} profile={dayflow.me.data} />}

      <div className="grid gap-4 xl:grid-cols-[1fr_365px]">
        <div className="rounded-2xl bg-[#0e1c2f] p-5 text-white shadow-[0_22px_50px_-30px_rgba(14,28,47,0.75)] sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c7f36b]"><Zap className="size-3.5 fill-current" /> Daily spark</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">Make the workday feel lighter.</h2></div><Button variant="outline" className="w-fit rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => setFlowOpen(true)}><Sparkles className="mr-2 size-4 text-[#c7f36b]" /> Talk to Flow</Button></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3"><SparkItem icon="01" text="Know what needs attention" /><SparkItem icon="02" text="Act without the busywork" /><SparkItem icon="03" text="Leave a clear trail" /></div>
        </div>
        <div className="rounded-2xl border border-[#dfe5e0] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">Need to know</div><div className="mt-1 font-display text-xl font-semibold">People activity</div></div><button className="text-[#8a959e]" type="button"><MoreHorizontal className="size-5" /></button></div><Separator className="my-4 bg-[#edf0ec]" /><ActivityLine color="bg-[#c7f36b]" title="Leave request from Meera" detail="Just now · waiting for HR" /><ActivityLine color="bg-[#efbb54]" title="Rahul arrived late" detail="Today at 09:42 AM" /><ActivityLine color="bg-[#abc2ec]" title="Payroll is ready" detail="August cycle · 25 people" /></div>
      </div>

      {flowOpen && <FlowPanel messages={flowMessages} input={flowInput} setInput={setFlowInput} onClose={() => setFlowOpen(false)} onSend={sendFlow} draftLeave={draftLeave} confirmLeave={confirmLeave} />}
    </div>
  )
}

function MetricCard({ label, value, detail, icon, tone, action }: { label: string; value: string; detail: string; icon: React.ReactNode; tone: "lime" | "peach" | "blue" | "lavender"; action?: { label: string; onClick: () => void } }) {
  const tones = { lime: "bg-[#eff8df] text-[#4f762e]", peach: "bg-[#fae9e2] text-[#9b4e40]", blue: "bg-[#e7eefb] text-[#4f6291]", lavender: "bg-[#edeafb] text-[#665c92]" }
  return <Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-[0_10px_30px_-24px_rgba(14,28,47,0.45)]"><CardContent className="p-5"><div className="flex items-start justify-between"><div className={cn("grid size-10 place-items-center rounded-xl", tones[tone])}>{icon}</div><button className="text-[#a6b0b7]" type="button"><MoreHorizontal className="size-5" /></button></div><div className="mt-5 text-xs font-semibold text-[#7b8792]">{label}</div><div className="mt-1 font-display text-[1.75rem] font-semibold tracking-[-0.04em] text-[#132038]">{value}</div><div className="mt-1 min-h-5 text-xs text-[#8b959e]">{detail}</div>{action && <button className="mt-4 flex items-center gap-1 text-xs font-bold text-[#3e6a31] transition hover:gap-2" onClick={action.onClick} type="button">{action.label}<ArrowUpRight className="size-3.5" /></button>}</CardContent></Card>
}

function Overview({ role, checkedIn, leaves, approvedCount, setView, updateLeave }: { role: Role; checkedIn: boolean; leaves: LeaveRequest[]; approvedCount: number; setView: (view: View) => void; updateLeave: (id: string, status: LeaveStatus) => void }) {
  return <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
    <Card className="overflow-hidden rounded-2xl border-[#dfe5e0] bg-white shadow-sm"><CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-2"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]"><span className="size-2 rounded-full bg-[#65c37a]" /> {role === "hr" ? "Company pulse" : "Your workday"}</div><CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">{role === "hr" ? "The team, right now" : checkedIn ? "You’re on the clock" : "Ready when you are"}</CardTitle></div><button className="flex items-center gap-1 text-xs font-bold text-[#65737f]" onClick={() => setView("Attendance")} type="button">Full view <ChevronRight className="size-4" /></button></CardHeader><CardContent className="p-6 pt-4"><div className="mb-4 flex items-center justify-between rounded-xl bg-[#f6f8f5] px-4 py-3"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-[#d9f2b2] text-[#3c6c32]"><Globe2 className="size-4" /></div><div><div className="text-sm font-semibold">Bengaluru office</div><div className="text-xs text-[#8a949d]">Last synced just now</div></div></div><Badge className="border-0 bg-[#e3f5d1] text-[10px] font-bold text-[#4d793b]">LIVE</Badge></div><div className="space-y-1">{(role === "hr" ? employees : employees.slice(0, 3)).map((employee) => <PulseRow key={employee.name} employee={employee} />)}</div><button className="mt-5 flex items-center gap-1 text-xs font-bold text-[#52606d]" onClick={() => setView("People")} type="button">View all people <ArrowUpRight className="size-3.5" /></button></CardContent></Card>
    <Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-sm"><CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-2"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">{role === "hr" ? "Approval queue" : "Your requests"}</div><CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">Time off</CardTitle></div><button className="grid size-9 place-items-center rounded-lg bg-[#f1f5eb] text-[#3e6a31]" onClick={() => setView("Leave & time off")} type="button"><Plus className="size-4" /></button></CardHeader><CardContent className="p-6 pt-4"><div className="mb-4 flex items-end justify-between"><div><div className="font-display text-4xl font-semibold tracking-[-0.06em]">{role === "hr" ? String(leaves.filter((leave) => leave.status === "pending").length).padStart(2, "0") : "14"}</div><div className="text-xs text-[#8a949d]">{role === "hr" ? "requests pending review" : "days remaining this year"}</div></div><div className="text-right text-xs font-semibold text-[#568044]">{approvedCount} approved<br /><span className="font-normal text-[#9ba4ab]">this month</span></div></div><div className="space-y-3">{leaves.slice(0, 3).map((leave) => <LeaveMini key={leave.id} leave={leave} role={role} updateLeave={updateLeave} />)}</div><button className="mt-5 flex items-center gap-1 text-xs font-bold text-[#52606d]" onClick={() => setView("Leave & time off")} type="button">Open leave workspace <ArrowUpRight className="size-3.5" /></button></CardContent></Card>
  </div>
}

function PulseRow({ employee }: { employee: typeof employees[number] }) { return <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-[#f7f9f6]"><div className={cn("grid size-9 place-items-center rounded-lg text-[11px] font-bold", employee.tone)}>{employee.initials}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{employee.name}</div><div className="text-xs text-[#8b959e]">{employee.role}</div></div><div className="flex items-center gap-2 text-right"><StatusDot status={employee.status} /><span className="hidden text-[11px] text-[#8b959e] sm:block">{employee.time}</span></div></div> }

function StatusDot({ status }: { status: string }) { const color = status === "present" ? "bg-[#67c479]" : status === "late" ? "bg-[#e9b848]" : status === "leave" ? "bg-[#7c9ce2]" : "bg-[#c7cbc7]"; return <span className={cn("size-2.5 rounded-full", color)} /> }
function LeaveMini({ leave, role, updateLeave }: { leave: LeaveRequest; role: Role; updateLeave: (id: string, status: LeaveStatus) => void }) { return <div className="flex items-center gap-3 rounded-xl border border-[#edf0ec] p-3"><div className={cn("grid size-9 place-items-center rounded-lg text-[11px] font-bold", leave.tone)}>{leave.initials}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{leave.name}</div><div className="text-xs text-[#8b959e]">{leave.type} · {leave.dates}</div></div><div className="flex items-center gap-1">{role === "hr" && leave.status === "pending" ? <><button className="grid size-7 place-items-center rounded-lg bg-[#e7f5db] text-[#4f843e]" onClick={() => updateLeave(leave.id, "approved")} type="button"><Check className="size-3.5" /></button><button className="grid size-7 place-items-center rounded-lg bg-[#fae9e2] text-[#a25242]" onClick={() => updateLeave(leave.id, "rejected")} type="button"><X className="size-3.5" /></button></> : <Badge className={cn("border-0 text-[10px] capitalize", leave.status === "approved" ? "bg-[#e8f5dc] text-[#4d793b]" : leave.status === "rejected" ? "bg-[#fae9e2] text-[#a25242]" : "bg-[#f9edcf] text-[#8f6b1d]")}>{leave.status}</Badge>}</div></div> }

function AttendanceView({ role, checkedIn, records }: { role: Role; checkedIn: boolean; records?: DayflowAttendance[] }) { return <Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-sm"><CardHeader className="flex flex-col justify-between gap-3 space-y-0 p-6 sm:flex-row sm:items-center"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">{role === "hr" ? "Team attendance" : "My attendance"}</div><CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">August 2026 rhythm</CardTitle></div><div className="flex items-center gap-2"><Badge className="border-0 bg-[#eff8df] text-[#4f762e]">{role === "hr" ? `${records?.length ?? 0} records` : checkedIn ? "Checked in" : "Not checked in"}</Badge><Button variant="outline" className="rounded-xl border-[#dfe5e0]">This month <ChevronRight className="ml-2 size-4" /></Button></div></CardHeader><CardContent className="p-6 pt-0"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl bg-[#f6f8f5] p-4"><div className="text-xs text-[#7b8792]">Attendance rate</div><div className="mt-1 font-display text-3xl font-semibold">94.2%</div><div className="mt-2 text-xs font-semibold text-[#4e7a3c]">+4.8% vs last month</div></div><div className="rounded-xl bg-[#f6f8f5] p-4"><div className="text-xs text-[#7b8792]">Avg. workday</div><div className="mt-1 font-display text-3xl font-semibold">8h 12m</div><div className="mt-2 text-xs text-[#8b959e]">Target: 8h 00m</div></div><div className="rounded-xl bg-[#f6f8f5] p-4"><div className="text-xs text-[#7b8792]">On leave today</div><div className="mt-1 font-display text-3xl font-semibold">03</div><div className="mt-2 text-xs text-[#8b959e]">Across 2 departments</div></div></div><div className="mt-8"><div className="mb-3 flex items-center justify-between"><div className="text-sm font-semibold">Daily presence signal</div><div className="flex items-center gap-3 text-[10px] text-[#84909a]"><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#c7f36b]" /> Present</span><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#efbb54]" /> Late</span></div></div><div className="flex h-48 items-end gap-1.5 rounded-2xl bg-[#f8faf7] p-4">{attendanceBars.map((bar, index) => <div className="group relative flex-1" key={`${bar}-${index}`}><div className={cn("w-full rounded-t-md transition hover:opacity-75", bar > 90 ? "bg-[#c7f36b]" : bar > 80 ? "bg-[#dbeab9]" : "bg-[#efbb54]")} style={{ height: `${bar}%` }} /><div className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-[#0e1c2f] px-1.5 py-1 text-[9px] text-white group-hover:block">{bar}%</div></div>)}</div><div className="mt-2 flex justify-between px-1 text-[10px] text-[#a0a9b0]"><span>Aug 01</span><span>Aug 08</span><span>Aug 15</span><span>Aug 22</span></div></div>{records && records.length > 0 && <div className="mt-6 overflow-x-auto rounded-2xl border border-[#edf0ec]"><table className="w-full text-left text-xs"><thead className="bg-[#fafbf9] text-[#7d8891]"><tr><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Check in</th><th className="px-4 py-3 font-semibold">Check out</th><th className="px-4 py-3 font-semibold">Work hours</th></tr></thead><tbody>{records.map((record) => <tr className="border-t border-[#edf0ec]" key={record.id}><td className="px-4 py-3">{record.attendance_date}</td><td className="px-4 py-3 capitalize">{record.status.replace("_", " ")}</td><td className="px-4 py-3">{record.check_in_at ? new Date(record.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td><td className="px-4 py-3">{record.check_out_at ? new Date(record.check_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td><td className="px-4 py-3">{Math.floor(record.worked_minutes / 60)}h {record.worked_minutes % 60}m</td></tr>)}</tbody></table></div>}</CardContent></Card> }

function LeaveView({ role, leaves, updateLeave, onDraft, onSubmitLeave }: { role: Role; leaves: LeaveRequest[]; updateLeave: (id: string, status: LeaveStatus) => void; onDraft: () => void; onSubmitLeave: (leave: LeaveDraft) => void }) { const columns: LeaveStatus[] = ["pending", "approved", "rejected"]; return <div className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">Time off workspace</div><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em]">Leave requests</h2></div>{role === "employee" && <Button className="rounded-xl bg-[#0e1c2f]" onClick={onDraft}><Sparkles className="mr-2 size-4 text-[#c7f36b]" /> Draft with Flow</Button>}</div>{role === "employee" && <LeaveRequestForm onSubmit={onSubmitLeave} />}<div className="grid gap-4 lg:grid-cols-3">{columns.map((status) => <div className="rounded-2xl bg-[#edf1ec] p-3" key={status}><div className="mb-3 flex items-center justify-between px-2 pt-1"><div className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c7881]">{status}</div><Badge className="border-0 bg-white text-[#7c8790]">{leaves.filter((leave) => leave.status === status).length}</Badge></div><div className="space-y-3">{leaves.filter((leave) => leave.status === status).map((leave) => <LeaveCard key={leave.id} leave={leave} role={role} updateLeave={updateLeave} />)}</div>{status === "pending" && leaves.filter((leave) => leave.status === status).length === 0 && <div className="rounded-xl border border-dashed border-[#cfd8cf] p-7 text-center text-xs text-[#8c9791]">No requests waiting</div>}</div>)}</div></div> }
function LeaveCard({ leave, role, updateLeave }: { leave: LeaveRequest; role: Role; updateLeave: (id: string, status: LeaveStatus) => void }) { return <div className="rounded-xl border border-[#e3e9e2] bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div className={cn("grid size-9 place-items-center rounded-lg text-[11px] font-bold", leave.tone)}>{leave.initials}</div><button className="text-[#b0b8bd]" type="button"><MoreHorizontal className="size-4" /></button></div><div className="mt-3 text-sm font-bold">{leave.name}</div><div className="mt-1 text-xs text-[#7f8b93]">{leave.type} · {leave.dates}</div><div className="mt-3 flex items-center justify-between text-[11px] text-[#919aa1]"><span>{leave.days} {leave.days === 1 ? "day" : "days"}</span>{leave.status === "pending" && role === "hr" ? <div className="flex gap-1"><button className="rounded-lg bg-[#dff3cc] px-2 py-1 font-bold text-[#4f7b3b]" onClick={() => updateLeave(leave.id, "approved")} type="button">Approve</button><button className="rounded-lg bg-[#fae8e0] px-2 py-1 font-bold text-[#9b4e40]" onClick={() => updateLeave(leave.id, "rejected")} type="button">Reject</button></div> : <span className="capitalize">{leave.status}</span>}</div></div> } 

function PeopleView({ role, serverPeople, onCreatePerson, isCreating }: { role: Role; serverPeople?: DayflowProfile[]; onCreatePerson: (input: DayflowEmployeeInput) => Promise<DayflowProvisionedEmployee>; isCreating: boolean }) { const [query, setQuery] = useState(""); const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null); const source = serverPeople ? mapApiPeople(serverPeople) : employees; const selectedProfile = serverPeople?.find((person) => person.id === selectedProfileId); const filtered = source.filter((employee) => `${employee.name} ${employee.department}`.toLowerCase().includes(query.toLowerCase())); if (filtered.length === 0) return <AsyncState state="empty" />; return <Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-sm"><CardHeader className="flex flex-col justify-between gap-4 space-y-0 p-6 sm:flex-row sm:items-center"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">Directory</div><CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">Your people</CardTitle></div><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#a2acb2]" /><Input className="w-full rounded-xl border-[#dfe5e0] pl-9 sm:w-64" onChange={(event) => setQuery(event.target.value)} placeholder="Search people" value={query} /></div></CardHeader><CardContent className="p-0">{role === "hr" && <div className="border-b border-[#edf0ec] p-6"><EmployeeProvisioningForm isSubmitting={isCreating} onSubmit={onCreatePerson} /></div>}<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-[#edf0ec] bg-[#fafbf9] text-xs text-[#7d8891]"><tr><th className="px-6 py-3 font-semibold">Person</th><th className="px-6 py-3 font-semibold">Department</th><th className="px-6 py-3 font-semibold">Today</th><th className="px-6 py-3 font-semibold">Workday</th><th className="px-6 py-3" /></tr></thead><tbody>{filtered.map((employee) => <tr className="cursor-pointer border-b border-[#f0f2ef] last:border-0 hover:bg-[#fafcf8]" key={employee.name} onClick={() => { if ("id" in employee && typeof employee.id === "string") setSelectedProfileId(employee.id) }} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" && "id" in employee && typeof employee.id === "string") setSelectedProfileId(employee.id) }}>
<td className="px-6 py-4"><div className="flex items-center gap-3"><div className={cn("grid size-9 place-items-center rounded-lg text-[11px] font-bold", employee.tone)}>{employee.initials}</div><div><div className="font-semibold">{employee.name}</div><div className="text-xs text-[#89949d]">{employee.role}</div></div></div></td><td className="px-6 py-4 text-[#6c7882]">{employee.department}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><StatusDot status={employee.status} /><span className="capitalize text-[#6c7882]">{employee.status}</span></div></td><td className="px-6 py-4 text-[#6c7882]">{employee.time}</td><td className="px-6 py-4 text-right"><button className="text-[#98a2aa]" type="button"><MoreHorizontal className="size-4" /></button></td></tr>)}</tbody></table></div>{selectedProfile && <div className="border-t border-[#edf0ec] p-6"><div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">Read-only employee profile</div><ProfileView role={role} profile={selectedProfile} /></div>}</CardContent></Card> }

function PayrollView({ role }: { role: Role }) { const [selected, setSelected] = useState("Arjun Singh"); const payrollQuery = useDayflow(role); const snapshot = payrollQuery.payroll.data?.find((item) => item.employee_name === selected); const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); const generate = async () => { try { const { jsPDF } = await import("jspdf"); const doc = new jsPDF(); doc.setFillColor(14, 28, 47); doc.rect(0, 0, 210, 42, "F"); doc.setTextColor(199, 243, 107); doc.setFontSize(23); doc.text("dayflow", 16, 22); doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.text("PAYSLIP · AUGUST 2026", 16, 32); doc.setTextColor(17, 28, 46); doc.setFontSize(18); doc.text(selected, 16, 65); doc.setFontSize(10); doc.text(`${selected} · ${snapshot?.employee_code ?? "EMP-042"}`, 16, 74); doc.setDrawColor(220, 226, 221); doc.line(16, 84, 194, 84); doc.setFontSize(11); doc.text("Basic salary", 16, 101); doc.text(money(snapshot?.basic_salary ?? 45000), 150, 101); doc.text("HRA allowance", 16, 116); doc.text(money(snapshot?.hra_allowance ?? 10000), 150, 116); doc.text("Deductions", 16, 131); doc.text(`-${money(snapshot?.deductions ?? 3200)}`, 150, 131); doc.setDrawColor(14, 28, 47); doc.line(16, 142, 194, 142); doc.setFontSize(14); doc.text("NET SALARY", 16, 158); doc.text(money(snapshot?.net_salary ?? 51800), 148, 158); doc.setFontSize(9); doc.setTextColor(110, 122, 134); doc.text("Generated by Dayflow · Every workday, perfectly aligned.", 16, 185); doc.save(`dayflow-payslip-${selected.toLowerCase().replace(/\s+/g, "-")}.pdf`); toast.success("Payslip PDF downloaded") } catch { toast("Payslip preview ready — use your browser’s Print → Save as PDF") } }; return <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"><Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-sm"><CardHeader className="p-6"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">Payroll center</div><CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">Salary snapshots</CardTitle></CardHeader><CardContent className="space-y-2 p-6 pt-0">{employees.map((employee) => <button className={cn("flex w-full items-center gap-3 rounded-xl p-3 text-left transition", selected === employee.name ? "bg-[#eff8df]" : "hover:bg-[#f6f8f5]")} key={employee.name} onClick={() => setSelected(employee.name)} type="button"><div className={cn("grid size-9 place-items-center rounded-lg text-[11px] font-bold", employee.tone)}>{employee.initials}</div><div className="flex-1"><div className="text-sm font-semibold">{employee.name}</div><div className="text-xs text-[#89949d]">{employee.role}</div></div><ChevronRight className="size-4 text-[#a0a9b0]" /></button>)}</CardContent></Card><Card className="overflow-hidden rounded-2xl border-[#dfe5e0] bg-white shadow-sm"><CardHeader className="flex flex-row items-start justify-between space-y-0 bg-[#0e1c2f] p-6 text-white"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c7f36b]">August 2026 · {role === "hr" ? "Admin preview" : "Read only"}</div><CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">{selected}</CardTitle><div className="mt-1 text-xs text-white/50">{snapshot?.employee_code ?? "EMP-042"} · Server snapshot</div></div><Button className="rounded-xl bg-[#c7f36b] text-[#0e1c2f] hover:bg-[#b5e958]" onClick={generate}><Download className="mr-2 size-4" /> Generate PDF</Button></CardHeader><CardContent className="p-6"><div className="grid gap-3 sm:grid-cols-2"><SalaryLine label="Basic salary" value={money(snapshot?.basic_salary ?? 45000)} /><SalaryLine label="HRA allowance" value={money(snapshot?.hra_allowance ?? 10000)} /><SalaryLine label="Standard allowance" value={money(snapshot?.standard_allowance ?? 4167)} /><SalaryLine label="Performance bonus" value={money(snapshot?.performance_bonus ?? 3750)} /><SalaryLine label="Leave travel allowance" value={money(snapshot?.leave_travel_allowance ?? 0)} /><SalaryLine label="Fixed allowance" value={money(snapshot?.fixed_allowance ?? 0)} /><SalaryLine label="Provident Fund" value={`−${money(snapshot?.pf_contribution ?? snapshot?.deductions ?? 3200)}`} muted /><SalaryLine label="Professional tax" value={`−${money(snapshot?.professional_tax ?? 200)}`} muted /></div><Separator className="my-6 bg-[#edf0ec]" /><div className="flex items-end justify-between"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">Net salary</div><div className="mt-1 font-display text-4xl font-semibold tracking-[-0.06em]">{money(snapshot?.net_salary ?? 51800)}</div><div className="mt-2 text-xs text-[#8a949d]">Payable days: {snapshot?.payable_days ?? 22} / {snapshot?.attendance_days ?? 22}</div></div><div className="rounded-xl bg-[#eff8df] p-3 text-right"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#63834c]">Payroll health</div><div className="mt-1 flex items-center gap-1 text-sm font-bold text-[#4f762e]"><CheckCircle2 className="size-4" /> Accurate</div></div></div></CardContent></Card></div> }
function SalaryLine({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) { return <div className="flex items-center justify-between rounded-xl bg-[#f8faf7] px-4 py-3"><span className="text-sm text-[#6f7b84]">{label}</span><span className={cn("text-sm font-bold", muted ? "text-[#9a6d63]" : "text-[#1c2c42]" )}>{value}</span></div> }
function ProfileView({ role, profile }: { role: Role; profile?: DayflowProfile }) { return <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]"><Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-sm"><CardContent className="p-6"><div className="grid size-20 place-items-center rounded-2xl bg-[#f1c7b1] font-display text-2xl font-semibold text-[#763a2e]">AS</div><h2 className="mt-5 font-display text-2xl font-semibold">{profile?.full_name ?? "Arjun Singh"}</h2><p className="mt-1 text-sm text-[#7c8790]">{profile?.job_position ?? "Software Engineer"} · {profile?.department ?? "Engineering"}</p><div className="mt-6 flex items-center gap-2 rounded-xl bg-[#eff8df] p-3 text-xs font-semibold text-[#4e793b]"><Flame className="size-4" /> 23-day attendance streak</div><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-[#8a949d]">Employee ID</span><span className="font-semibold">{profile?.employee_code ?? "EMP-042"}</span></div><div className="flex justify-between"><span className="text-[#8a949d]">Joined</span><span className="font-semibold">{profile?.joining_year ? `Joined ${profile.joining_year}` : "14 Feb 2023"}</span></div><div className="flex justify-between"><span className="text-[#8a949d]">Location</span><span className="font-semibold">{profile?.location ?? "Bengaluru"}</span></div></div></CardContent></Card><Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-sm"><CardHeader className="p-6"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">Profile details</div><CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">A little more about {profile?.full_name ?? "Arjun"}</CardTitle></CardHeader><CardContent className="grid gap-4 p-6 pt-0 sm:grid-cols-2"><ProfileField label="Work email" value={profile?.email ?? "arjun@dayflow.demo"} /><ProfileField label="Phone" value={profile?.phone || "+91 98765 43210"} /><ProfileField label="Manager" value={profile?.manager || "Ashwith Shetty"} /><ProfileField label="Department" value={profile?.department ?? "Engineering"} /><ProfileField label="About" value="Building tools that make work feel more human." /><ProfileField label="Salary info" value={role === "hr" ? "Visible to HR only" : "Private · open Payroll"} /></CardContent></Card></div> }
function ProfileField({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#f8faf7] p-4"><div className="text-xs text-[#89949d]">{label}</div><div className="mt-1 text-sm font-semibold text-[#233149]">{value}</div></div> }
function SparkItem({ icon, text }: { icon: string; text: string }) { return <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-xs font-bold text-[#c7f36b]">{icon}</div><div className="text-xs text-white/65">{text}</div></div> }
function ActivityLine({ color, title, detail }: { color: string; title: string; detail: string }) { return <div className="flex gap-3 py-2"><span className={cn("mt-1.5 size-2 shrink-0 rounded-full", color)} /><div><div className="text-sm font-semibold">{title}</div><div className="mt-0.5 text-xs text-[#8a949d]">{detail}</div></div></div> }

function FlowPanel({ messages, input, setInput, onClose, onSend, draftLeave, confirmLeave }: { messages: { from: string; text: string }[]; input: string; setInput: (value: string) => void; onClose: () => void; onSend: (prompt?: string) => void; draftLeave: boolean; confirmLeave: () => void }) { return <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[430px] overflow-hidden rounded-2xl border border-[#22324a] bg-[#0e1c2f] text-white shadow-[0_30px_80px_-25px_rgba(14,28,47,0.8)] sm:inset-auto sm:bottom-6 sm:right-6"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#c7f36b] text-[#0e1c2f]"><Sparkles className="size-4" /></div><div><div className="text-sm font-bold">Flow <span className="ml-1 text-[#c7f36b]">✦</span></div><div className="text-[10px] text-white/45">Your AI HR companion</div></div></div><button className="text-white/40 transition hover:text-white" onClick={onClose} type="button"><X className="size-5" /></button></div><div className="max-h-[360px] space-y-4 overflow-y-auto px-5 py-5">{messages.map((message, index) => <div className={cn("flex gap-2", message.from === "user" && "justify-end")} key={`${message.text}-${index}`}>{message.from === "flow" && <div className="mt-1 grid size-6 shrink-0 place-items-center rounded-md bg-white/10"><Bot className="size-3.5 text-[#c7f36b]" /></div>}<div className={cn("max-w-[86%] rounded-2xl px-3.5 py-3 text-xs leading-5", message.from === "user" ? "rounded-br-sm bg-[#c7f36b] text-[#0e1c2f]" : "rounded-bl-sm bg-white/8 text-white/72")}>{message.text}</div></div>)}{draftLeave && <div className="rounded-xl border border-[#c7f36b]/30 bg-[#c7f36b]/10 p-4"><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#c7f36b]">Action preview</div><div className="text-sm font-semibold">Sick leave · 25–26 Aug</div><div className="mt-1 text-xs text-white/55">2 days · “I’m sick” · Pending HR approval</div><div className="mt-3 flex gap-2"><Button className="h-8 rounded-lg bg-[#c7f36b] text-xs font-bold text-[#0e1c2f] hover:bg-[#b5e958]" onClick={confirmLeave}>Confirm request</Button><Button variant="outline" className="h-8 rounded-lg border-white/15 bg-transparent text-xs text-white hover:bg-white/10 hover:text-white" onClick={() => {}}>Edit</Button></div></div>}</div><div className="border-t border-white/10 p-4"><div className="mb-3 flex gap-2 overflow-x-auto pb-1"><button className="whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/55 hover:border-[#c7f36b]/50 hover:text-[#c7f36b]" onClick={() => onSend("Who has been absent most this week?")} type="button">Attendance insight</button><button className="whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/55 hover:border-[#c7f36b]/50 hover:text-[#c7f36b]" onClick={() => onSend("I need sick leave")} type="button">Draft sick leave</button></div><div className="flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2"><Paperclip className="size-4 text-white/35" /><input className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/30" onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onSend() }} placeholder="Ask about your workday..." value={input} /><button className="grid size-7 place-items-center rounded-lg bg-[#c7f36b] text-[#0e1c2f]" onClick={() => onSend()} type="button"><Send className="size-3.5" /></button></div></div></div> }
