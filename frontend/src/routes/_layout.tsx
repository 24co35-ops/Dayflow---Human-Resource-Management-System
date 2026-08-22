import { createFileRoute, Outlet } from "@tanstack/react-router"
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react"

import { useEffect, useState } from "react"

import { MobileWorkspaceNav } from "@/components/MobileWorkspaceNav"
import { dayflowApiEnabled } from "@/hooks/useDayflow"
import { supabase, supabaseMode } from "@/lib/supabase"

export const Route = createFileRoute("/_layout")({
  component: Layout,
})

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Attendance", icon: Activity },
  { label: "Leave & time off", icon: CalendarDays },
  { label: "People", icon: Users },
  { label: "Payroll", icon: WalletCards },
]

type DemoRole = "employee" | "hr"

const navigationSlug = (label: string) =>
  label.toLowerCase().replace(/ & /g, "-").replace(/\s+/g, "-")

function Layout() {
  const [activeSlug, setActiveSlug] = useState("overview")
  const [demoRole, setDemoRole] = useState<DemoRole>("employee")
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  useEffect(() => {
    const syncShell = () => {
      setActiveSlug(window.location.hash.replace("#", "") || "overview")
      const savedRole = window.localStorage.getItem("dayflow-demo-role")
      if (savedRole === "employee" || savedRole === "hr") setDemoRole(savedRole)
    }
    syncShell()
    window.addEventListener("hashchange", syncShell)
    window.addEventListener("dayflow-role-change", syncShell)
    return () => {
      window.removeEventListener("hashchange", syncShell)
      window.removeEventListener("dayflow-role-change", syncShell)
    }
  }, [])

  const shellUser = demoRole === "hr"
    ? { name: "Ashwith Shetty", role: "People Ops", initials: "AS" }
    : { name: "Arjun Singh", role: "Engineering", initials: "AS" }

  const openProfile = () => {
    setProfileMenuOpen(false)
    window.location.hash = "profile"
    window.dispatchEvent(new HashChangeEvent("hashchange"))
  }

  const logout = async () => {
    try {
      if (supabase) await supabase.auth.signOut()
    } finally {
      localStorage.removeItem("access_token")
      localStorage.removeItem("dayflow-demo-role")
      window.location.href = "/login"
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#111c2e]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[244px] flex-col border-r border-[#dfe5e0] bg-[#0e1c2f] text-white lg:flex">
        <div className="flex h-20 items-center gap-3 px-7">
          <div className="grid size-9 place-items-center rounded-xl bg-[#c7f36b] text-[#0e1c2f] shadow-[0_0_0_5px_rgba(199,243,107,0.12)]">
            <Sparkles className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-xl font-semibold tracking-[-0.03em]">dayflow</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">people operating system</div>
          </div>
        </div>
        <div className="px-4 pt-7 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Workspace</div>
        <nav className="mt-3 space-y-1 px-3">
          {navigation.map(({ label, icon: Icon }) => {
            const isActive = activeSlug === navigationSlug(label)
            return (
            <button
              key={label}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${isActive ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/7 hover:text-white"}`}
              onClick={() => {
                window.location.hash = navigationSlug(label)
                window.dispatchEvent(new HashChangeEvent("hashchange"))
              }}
              type="button"
            >
              <Icon className={`size-[18px] ${isActive ? "text-[#c7f36b]" : "text-white/45 group-hover:text-[#c7f36b]"}`} />
              <span>{label}</span>
              {label === "Leave & time off" && <span className="ml-auto rounded-full bg-[#efbb54] px-2 py-0.5 text-[10px] font-bold text-[#0e1c2f]">3</span>}
            </button>
          )
          })}
        </nav>
        <div className="mt-auto px-4 pb-6">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white/70"><CircleHelp className="size-4 text-[#c7f36b]" /> Need a hand?</div>
            <p className="text-xs leading-5 text-white/40">Ask Flow anything about your workday.</p>
          </div>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/55 transition hover:bg-white/7 hover:text-white" type="button"><Settings className="size-[18px]" /> Settings</button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/55 transition hover:bg-white/7 hover:text-white" type="button"><LogOut className="size-[18px]" /> Log out</button>
        </div>
      </aside>
      <div className="lg:pl-[244px]">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#dfe5e0]/80 bg-[#f6f7f4]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3 lg:hidden"><div className="grid size-9 place-items-center rounded-xl bg-[#c7f36b] text-[#0e1c2f]"><Sparkles className="size-5" /></div><span className="font-display text-xl font-semibold">dayflow</span></div>
          <div className="hidden text-sm text-[#5d6876] sm:block">Saturday, <span className="font-semibold text-[#111c2e]">22 August 2026</span></div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#31704f] shadow-sm sm:flex"><span className={dayflowApiEnabled || supabaseMode === "connected" ? "size-2 rounded-full bg-[#66c17a]" : "size-2 rounded-full bg-[#efbb54]"} /> {dayflowApiEnabled ? "API-backed demo" : supabaseMode === "connected" ? "Supabase configured" : "Offline demo mode"}</div>
            <button className="relative grid size-10 place-items-center rounded-xl border border-[#dfe5e0] bg-white text-[#5d6876] transition hover:border-[#b8c5bd]" type="button"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#eb6e5c]" /></button>
            <div className="relative">
              <button aria-expanded={profileMenuOpen} aria-haspopup="menu" className="flex items-center gap-2 rounded-xl border border-[#dfe5e0] bg-white py-1.5 pl-1.5 pr-2 text-left transition hover:border-[#b8c5bd]" onClick={() => setProfileMenuOpen((open) => !open)} type="button">
                <div className="grid size-8 place-items-center rounded-lg bg-[#f2c4ae] text-xs font-bold text-[#6e3222]">{shellUser.initials}</div>
                <div className="hidden sm:block"><div className="text-xs font-semibold">{shellUser.name}</div><div className="text-[10px] text-[#7b8792]">{shellUser.role}</div></div>
                <ChevronDown className="size-3.5 text-[#7b8792]" />
              </button>
              {profileMenuOpen && <div className="absolute right-0 top-12 z-30 w-52 rounded-xl border border-[#dfe5e0] bg-white p-1.5 shadow-xl" role="menu">
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#1e2c40] hover:bg-[#f4f7f2]" onClick={openProfile} role="menuitem" type="button">My Profile</button>
                <div className="my-1 border-t border-[#edf0ec]" />
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#9b4e40] hover:bg-[#fff4ef]" onClick={() => { void logout() }} role="menuitem" type="button"><LogOut className="size-4" /> Log out</button>
              </div>}
            </div>
          </div>
        </header>
        <MobileWorkspaceNav />
        <main className="mx-auto max-w-[1500px] p-5 sm:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
