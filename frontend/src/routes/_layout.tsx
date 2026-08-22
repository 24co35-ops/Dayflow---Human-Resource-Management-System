import { createFileRoute, Outlet } from "@tanstack/react-router"
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  X,
  Users,
  WalletCards,
} from "lucide-react"

import { useEffect, useState } from "react"

import { MobileWorkspaceNav } from "@/components/MobileWorkspaceNav"
import { Logo } from "@/components/Common/Logo"
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [notificationsOpen, setNotificationsOpen] = useState(false)

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

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === "Escape") {
        setSearchOpen(false)
        setProfileMenuOpen(false)
        setNotificationsOpen(false)
      }
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])

  const shellUser = demoRole === "hr"
    ? { name: "Ashwith Shetty", role: "People Ops", initials: "AS" }
    : { name: "Arjun Singh", role: "Engineering", initials: "AS" }

  const navigateTo = (slug: string) => {
    setSearchOpen(false)
    setSearchQuery("")
    window.location.hash = slug
    window.dispatchEvent(new HashChangeEvent("hashchange"))
  }

  const openProfile = () => {
    setProfileMenuOpen(false)
    navigateTo("profile")
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
        <div className="flex h-20 items-center px-7 text-white"><Logo asLink={false} /></div>
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
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/55 transition hover:bg-white/7 hover:text-white" onClick={() => { window.location.href = "/settings" }} type="button"><Settings className="size-[18px]" /> Settings</button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/55 transition hover:bg-white/7 hover:text-white" onClick={() => { void logout() }} type="button"><LogOut className="size-[18px]" /> Log out</button>
        </div>
      </aside>
      <div className="lg:pl-[244px]">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#dfe5e0]/80 bg-[#f6f7f4]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3 lg:hidden"><Logo asLink={false} className="text-[#111c2e]" /></div>
          <div className="hidden items-center gap-3 sm:flex"><div className="text-sm text-[#5d6876]">Saturday, <span className="font-semibold text-[#111c2e]">22 August 2026</span></div><button aria-label="Search workspace" className="hidden items-center gap-2 rounded-xl border border-[#dfe5e0] bg-white px-3 py-2 text-xs font-semibold text-[#7b8792] shadow-sm transition hover:border-[#b8c5bd] md:flex" onClick={() => setSearchOpen(true)} type="button"><Search className="size-3.5" /> Search workspace <kbd className="rounded bg-[#f1f4ef] px-1.5 py-0.5 text-[10px] text-[#9aa4ab]">⌘ K</kbd></button></div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#31704f] shadow-sm sm:flex"><span className={dayflowApiEnabled || supabaseMode === "connected" ? "size-2 rounded-full bg-[#66c17a]" : "size-2 rounded-full bg-[#efbb54]"} /> {dayflowApiEnabled ? "API-backed demo" : supabaseMode === "connected" ? "Supabase configured" : "Offline demo mode"}</div>
            <div className="relative"><button aria-expanded={notificationsOpen} aria-label="Open notifications" className="relative grid size-10 place-items-center rounded-xl border border-[#dfe5e0] bg-white text-[#5d6876] transition hover:border-[#b8c5bd]" onClick={() => setNotificationsOpen((open) => !open)} type="button"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#eb6e5c]" /></button>{notificationsOpen && <div className="absolute right-0 top-12 z-30 w-80 rounded-2xl border border-[#dfe5e0] bg-white p-4 shadow-xl" role="dialog" aria-label="Notifications"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">Inbox</div><div className="mt-1 font-display text-xl font-semibold text-[#1e2c40]">Workspace updates</div></div><span className="rounded-full bg-[#fae9e2] px-2 py-1 text-[10px] font-bold text-[#9b4e40]">3 new</span></div><div className="mt-4 space-y-3"><div className="flex gap-3 rounded-xl bg-[#f6f8f5] p-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-[#efbb54]" /><div><div className="text-xs font-bold text-[#26364d]">Leave request needs review</div><div className="mt-1 text-[11px] text-[#89949d]">Meera Joshi · just now</div></div></div><div className="flex gap-3 rounded-xl bg-[#f6f8f5] p-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-[#c7f36b]" /><div><div className="text-xs font-bold text-[#26364d]">Payroll snapshot is ready</div><div className="mt-1 text-[11px] text-[#89949d]">August cycle · 25 people</div></div></div><div className="flex gap-3 rounded-xl bg-[#f6f8f5] p-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-[#9bb7ef]" /><div><div className="text-xs font-bold text-[#26364d]">Attendance sync completed</div><div className="mt-1 text-[11px] text-[#89949d]">All workspaces · 9:45 AM</div></div></div></div><button className="mt-4 w-full rounded-xl border border-[#dfe5e0] px-3 py-2 text-xs font-bold text-[#52606d] hover:bg-[#f4f7f2]" onClick={() => { setNotificationsOpen(false); navigateTo("leave-time-off") }} type="button">Open action center <ArrowRight className="ml-1 inline size-3.5" /></button></div>}</div>
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
        {searchOpen && <div className="fixed inset-0 z-50 bg-[#0e1c2f]/30 p-4 backdrop-blur-sm" onClick={() => setSearchOpen(false)}><div className="mx-auto mt-[12vh] max-w-xl overflow-hidden rounded-2xl border border-[#dfe5e0] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Search Dayflow workspace"><div className="flex items-center gap-3 border-b border-[#edf0ec] px-4 py-4"><Search className="size-5 text-[#94a0a8]" /><input autoFocus className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#1e2c40] outline-none placeholder:text-[#a1abb1]" onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false) }} placeholder="Search people, attendance, leave, payroll..." value={searchQuery} /><button aria-label="Close search" className="grid size-8 place-items-center rounded-lg text-[#8d989f] hover:bg-[#f4f7f2]" onClick={() => setSearchOpen(false)} type="button"><X className="size-4" /></button></div><div className="p-2">{navigation.filter(({ label }) => label.toLowerCase().includes(searchQuery.toLowerCase())).map(({ label, icon: Icon }) => <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#26364d] hover:bg-[#eff8df]" key={label} onClick={() => navigateTo(navigationSlug(label))} type="button"><Icon className="size-4 text-[#6e8e57]" />{label}<ArrowRight className="ml-auto size-4 text-[#a8b1b7]" /></button>)}{("profile".includes(searchQuery.toLowerCase()) || !searchQuery) && <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#26364d] hover:bg-[#eff8df]" onClick={() => navigateTo("profile")} type="button"><Users className="size-4 text-[#6e8e57]" />My Profile<ArrowRight className="ml-auto size-4 text-[#a8b1b7]" /></button>}{navigation.every(({ label }) => !label.toLowerCase().includes(searchQuery.toLowerCase())) && !"profile".includes(searchQuery.toLowerCase()) && searchQuery && <div className="px-3 py-8 text-center text-sm text-[#8d989f]">No workspace matches for “{searchQuery}”.</div>}</div><div className="border-t border-[#edf0ec] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9aa4ab]">Navigate faster · Press Esc to close</div></div></div>}
      </div>
    </div>
  )
}
