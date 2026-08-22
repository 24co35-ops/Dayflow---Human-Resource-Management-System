import { Inbox } from "lucide-react"

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="grid place-items-center rounded-2xl border border-dashed border-[#dfe5e0] bg-[#fafbf9] p-10 text-center"><div className="grid size-10 place-items-center rounded-xl bg-[#eff8df] text-[#63834c]"><Inbox className="size-5" /></div><div className="mt-3 text-sm font-bold text-[#26354a]">{title}</div><div className="mt-1 max-w-xs text-xs leading-5 text-[#8a949d]">{description}</div></div>
}
