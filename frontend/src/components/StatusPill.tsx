import { cn } from "@/lib/utils"

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "success" | "attention" | "danger" | "neutral" }) {
  const tones = { success: "bg-[#e8f5dc] text-[#4d793b]", attention: "bg-[#f9edcf] text-[#8f6b1d]", danger: "bg-[#fae9e2] text-[#a25242]", neutral: "bg-[#edf0ec] text-[#68747d]" }
  return <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold capitalize", tones[tone])}>{label}</span>
}
