import { Activity, CalendarDays, LayoutDashboard, Users, WalletCards } from "lucide-react"
import { useEffect, useState } from "react"

const items = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Attendance", icon: Activity },
  { label: "Leave & time off", icon: CalendarDays },
  { label: "People", icon: Users },
  { label: "Payroll", icon: WalletCards },
]

function slug(label: string) {
  return label.toLowerCase().replace(/ & /g, "-").replace(/\s+/g, "-")
}

export function MobileWorkspaceNav() {
  const [active, setActive] = useState("Overview")
  useEffect(() => {
    const sync = () => setActive(items.find((item) => slug(item.label) === window.location.hash.slice(1))?.label ?? "Overview")
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])

  return <nav aria-label="Mobile workspace" className="-mx-5 flex gap-1 overflow-x-auto border-b border-[#dfe5e0] bg-white px-5 py-2 lg:hidden">
    {items.map(({ label, icon: Icon }) => {
      const selected = active === label
      return <button aria-current={selected ? "page" : undefined} aria-label={`Open ${label}`} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${selected ? "bg-[#0e1c2f] text-white" : "text-[#77838c] hover:bg-[#f1f5ef] hover:text-[#203049]"}`} key={label} onClick={() => { window.location.hash = slug(label); window.dispatchEvent(new HashChangeEvent("hashchange")) }} type="button"><Icon className={`size-3.5 ${selected ? "text-[#c7f36b]" : "text-[#89969e]"}`} />{label}</button>
    })}
  </nav>
}
