import { AlertCircle, Inbox, LoaderCircle } from "lucide-react"

const copy = {
  loading: { title: "Loading workspace", description: "Syncing the latest people data.", icon: LoaderCircle },
  error: { title: "Something needs attention", description: "We could not refresh this workspace. Try again or continue in offline demo mode.", icon: AlertCircle },
  empty: { title: "No people found", description: "Try a different name or department search.", icon: Inbox },
} as const

export function AsyncState({ state }: { state: keyof typeof copy }) {
  const item = copy[state]
  const Icon = item.icon
  return <div role={state === "error" ? "alert" : "status"} className="grid place-items-center rounded-2xl border border-dashed border-[#dfe5e0] bg-[#fafbf9] p-10 text-center"><div className="grid size-10 place-items-center rounded-xl bg-[#eff8df] text-[#63834c]"><Icon className={`size-5 ${state === "loading" ? "animate-spin" : ""}`} /></div><div className="mt-3 text-sm font-bold text-[#26354a]">{item.title}</div><div className="mt-1 max-w-xs text-xs leading-5 text-[#8a949d]">{item.description}</div></div>
}
