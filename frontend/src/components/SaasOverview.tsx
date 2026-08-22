import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CircleAlert,
  ListTodo,
  UsersRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DayflowActivity, DayflowDashboard } from "@/lib/dayflow-api"
import { cn } from "@/lib/utils"

type SaaSRole = "employee" | "hr"
type SaaSView = "Overview" | "Attendance" | "Leave & time off" | "People" | "Payroll" | "Profile"
type SaaSLeave = {
  id: string
  name: string
  type: string
  dates: string
  days: number
  status: "pending" | "approved" | "rejected"
}

type SaaSOverviewProps = {
  role: SaaSRole
  checkedIn: boolean
  apiEnabled: boolean
  leaves: SaaSLeave[]
  approvedCount: number
  activity?: DayflowActivity[]
  dashboard?: DayflowDashboard
  setView: (view: SaaSView) => void
  updateLeave: (id: string, status: "approved" | "rejected") => void
}

const fallbackActivity = [
  { message: "Payroll snapshot is ready for review", created_at: "Today · 10:15 AM" },
  { message: "Attendance sync completed successfully", created_at: "Today · 09:45 AM" },
  { message: "A new employee profile was added", created_at: "Yesterday · 04:20 PM" },
]

export function SaasOverview({ role, checkedIn, apiEnabled, leaves, approvedCount, activity, dashboard, setView, updateLeave }: SaaSOverviewProps) {
  const pendingLeaves = leaves.filter((leave) => leave.status === "pending")
  const recentActivity = activity?.length ? activity.slice(0, 3) : fallbackActivity
  const employeeCount = dashboard?.employee_count ?? 25
  const presentToday = dashboard?.present_today ?? (checkedIn ? 21 : 20)
  const attendanceRate = employeeCount ? Math.round((presentToday / employeeCount) * 100) : 0

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden rounded-2xl border-[#dfe5e0] bg-[#0e1c2f] text-white shadow-[0_22px_50px_-30px_rgba(14,28,47,0.8)]">
          <CardContent className="relative p-6 sm:p-8">
            <div className="absolute -right-12 -top-16 size-48 rounded-full bg-[#c7f36b]/10 blur-2xl" />
            <div className="relative max-w-2xl">
              <Badge className="border-0 bg-[#c7f36b]/15 text-[10px] font-bold uppercase tracking-[0.16em] text-[#c7f36b]">
                <Building2 className="mr-1.5 size-3" /> Dayflow workspace
              </Badge>
              <h2 className="mt-5 max-w-xl font-display text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                {role === "hr" ? "A calm command center for your people." : "Everything you need for a better workday."}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
                {role === "hr" ? "Keep attendance, approvals, profiles, and payroll signals in one clear operating rhythm." : "See your day, take action quickly, and keep your requests visible from start to finish."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button className="rounded-xl bg-[#c7f36b] text-[#0e1c2f] hover:bg-[#b5e958]" onClick={() => setView(role === "hr" ? "People" : "Attendance")}>
                  {role === "hr" ? <UsersRound className="mr-2 size-4" /> : <CalendarCheck className="mr-2 size-4" />}
                  {role === "hr" ? "Open people workspace" : checkedIn ? "Review my attendance" : "Start my workday"}
                </Button>
                <Button variant="outline" className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => setView(role === "hr" ? "Leave & time off" : "Profile")}>
                  {role === "hr" ? <ListTodo className="mr-2 size-4" /> : <ArrowUpRight className="mr-2 size-4" />}
                  {role === "hr" ? "Review queue" : "Open my profile"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">Workspace health</div>
              <CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">{role === "hr" ? "Today at a glance" : "Your day at a glance"}</CardTitle>
            </div>
            <div className="grid size-10 place-items-center rounded-xl bg-[#eff8df] text-[#4f762e]"><BarChart3 className="size-5" /></div>
          </CardHeader>
          <CardContent className="space-y-5 p-6 pt-4">
            <HealthLine label="People present" value={`${presentToday}/${employeeCount}`} progress={attendanceRate} tone="bg-[#c7f36b]" />
            <HealthLine label={role === "hr" ? "Requests resolved" : "Leave used"} value={role === "hr" ? `${approvedCount} this month` : "4 of 14 days"} progress={role === "hr" ? Math.min(100, approvedCount * 12) : 29} tone="bg-[#efbb54]" />
            <HealthLine label="Workspace sync" value={apiEnabled ? "Live" : "Demo"} progress={apiEnabled ? 100 : 62} tone="bg-[#9bb7ef]" />
            <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold", apiEnabled ? "bg-[#f6f8f5] text-[#4f762e]" : "bg-[#fff8e8] text-[#967323]")}><span className={cn("size-2 rounded-full", apiEnabled ? "bg-[#67c479]" : "bg-[#efbb54]")} /> {apiEnabled ? "API sync is active" : "Local demo mode · no data is persisted"}</div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <QuickAction icon={<CalendarCheck className="size-4" />} title={role === "hr" ? "Attendance pulse" : "Check in or out"} detail={role === "hr" ? `${attendanceRate}% present today` : checkedIn ? "You are currently on the clock" : "Start tracking your workday"} onClick={() => setView("Attendance")} tone="lime" />
        <QuickAction icon={<ListTodo className="size-4" />} title={role === "hr" ? "Approval queue" : "Request time off"} detail={role === "hr" ? `${pendingLeaves.length} request${pendingLeaves.length === 1 ? "" : "s"} waiting` : "Paid, sick, or unpaid leave"} onClick={() => setView("Leave & time off")} tone="peach" />
        <QuickAction icon={<UsersRound className="size-4" />} title={role === "hr" ? "People directory" : "My profile"} detail={role === "hr" ? `${employeeCount} active profiles` : "Keep your work details current"} onClick={() => setView(role === "hr" ? "People" : "Profile")} tone="blue" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-3">
            <div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">{role === "hr" ? "Needs attention" : "My requests"}</div><CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">{role === "hr" ? "Approval queue" : "Recent time off"}</CardTitle></div>
            <button className="text-xs font-bold text-[#64727d]" onClick={() => setView("Leave & time off")} type="button">View all <ArrowUpRight className="ml-1 inline size-3.5" /></button>
          </CardHeader>
          <CardContent className="space-y-3 p-6 pt-2">
            {role === "hr" && pendingLeaves.length > 0 ? pendingLeaves.slice(0, 3).map((leave) => <div className="flex items-center gap-3 rounded-xl border border-[#edf0ec] p-3" key={leave.id}><div className="grid size-9 place-items-center rounded-lg bg-[#fae9e2] text-xs font-bold text-[#9b4e40]">{leave.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{leave.name}</div><div className="text-xs text-[#8b959e]">{leave.type} · {leave.dates}</div></div><div className="flex gap-1"><button aria-label={`Approve ${leave.name}`} className="rounded-lg bg-[#e7f5db] px-2 py-1 text-xs font-bold text-[#4f843e]" onClick={() => updateLeave(leave.id, "approved")} type="button">Approve</button><button aria-label={`Reject ${leave.name}`} className="rounded-lg bg-[#fae9e2] px-2 py-1 text-xs font-bold text-[#a25242]" onClick={() => updateLeave(leave.id, "rejected")} type="button">Reject</button></div></div>) : leaves.slice(0, 3).map((leave) => <div className="flex items-center gap-3 rounded-xl border border-[#edf0ec] p-3" key={leave.id}><div className="grid size-9 place-items-center rounded-lg bg-[#eff8df] text-xs font-bold text-[#4f762e]">{leave.days}d</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{leave.type}</div><div className="text-xs text-[#8b959e]">{leave.dates} · {leave.name}</div></div><Badge className={cn("border-0 text-[10px] capitalize", leave.status === "approved" ? "bg-[#e8f5dc] text-[#4d793b]" : leave.status === "rejected" ? "bg-[#fae9e2] text-[#a25242]" : "bg-[#f9edcf] text-[#8f6b1d]")}>{leave.status}</Badge></div>)}
            {role === "hr" && pendingLeaves.length === 0 && <div className="rounded-xl border border-dashed border-[#cfd8cf] p-7 text-center text-sm text-[#82908b]">No approvals waiting. Your queue is clear.</div>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-3"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">Activity stream</div><CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">What changed</CardTitle></div><div className="grid size-9 place-items-center rounded-lg bg-[#e7eefb] text-[#4f6291]"><Bell className="size-4" /></div></CardHeader>
          <CardContent className="space-y-1 p-6 pt-2">{recentActivity.map((item, index) => <div className="flex gap-3 border-b border-[#f0f2ef] py-3 last:border-0" key={`${item.message}-${index}`}><span className={cn("mt-1.5 size-2 shrink-0 rounded-full", index === 0 ? "bg-[#c7f36b]" : index === 1 ? "bg-[#efbb54]" : "bg-[#9bb7ef]")} /><div className="min-w-0"><div className="text-sm font-semibold text-[#233149]">{item.message}</div><div className="mt-1 text-xs text-[#8b959e]">{formatActivityDate(item.created_at)}</div></div></div>)}</CardContent>
        </Card>
      </section>

      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#dfe5e0] bg-[#f6f8f5] px-5 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-white text-[#4f762e] shadow-sm"><CircleAlert className="size-4" /></div><div><div className="text-sm font-semibold text-[#233149]">Need a hand?</div><div className="text-xs text-[#81908a]">Ask Flow about leave, attendance, or your payroll snapshot.</div></div></div><Button variant="outline" className="w-fit rounded-xl border-[#d3ddd0] bg-white" onClick={() => setView("Overview")}>Open workspace guide <ArrowUpRight className="ml-2 size-3.5" /></Button></div>
    </div>
  )
}

function HealthLine({ label, value, progress, tone }: { label: string; value: string; progress: number; tone: string }) {
  return <div><div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-[#67747f]">{label}</span><span className="font-bold text-[#24354b]">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf1ec]"><div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${Math.max(4, Math.min(100, progress))}%` }} /></div></div>
}

function QuickAction({ icon, title, detail, onClick, tone }: { icon: React.ReactNode; title: string; detail: string; onClick: () => void; tone: "lime" | "peach" | "blue" }) {
  const tones = { lime: "bg-[#eff8df] text-[#4f762e]", peach: "bg-[#fae9e2] text-[#9b4e40]", blue: "bg-[#e7eefb] text-[#4f6291]" }
  return <button className="group flex items-center gap-3 rounded-2xl border border-[#dfe5e0] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" onClick={onClick} type="button"><div className={cn("grid size-9 place-items-center rounded-xl", tones[tone])}>{icon}</div><div className="min-w-0 flex-1"><div className="text-sm font-bold text-[#233149]">{title}</div><div className="mt-0.5 truncate text-xs text-[#89949d]">{detail}</div></div><ArrowUpRight className="size-4 text-[#a1adb5] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></button>
}

function formatActivityDate(value: string) {
  if (!value) return "Recently"
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    return "Recently"
  }
  return value
}
