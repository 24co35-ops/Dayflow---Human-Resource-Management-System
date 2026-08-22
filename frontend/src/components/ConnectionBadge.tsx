import { Wifi, WifiOff } from "lucide-react"

export function ConnectionBadge({ connected }: { connected: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${connected ? "bg-[#e8f5dc] text-[#4d793b]" : "bg-[#f9edcf] text-[#8f6b1d]"}`}>{connected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}{connected ? "Synced" : "Offline demo"}</span>
}
