import { ArrowDownRight, ArrowUpRight } from "lucide-react"

export function StatTrend({ value, positive = true }: { value: string; positive?: boolean }) {
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${positive ? "text-[#4e7a3c]" : "text-[#a25242]"}`}><Icon className="size-3.5" />{value}</span>
}
