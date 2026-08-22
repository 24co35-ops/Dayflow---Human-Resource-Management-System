import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, Send } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const leaveSchema = z.object({
  type: z.enum(["Paid time off", "Sick leave", "Unpaid leave"]),
  startDate: z.string().min(1, "Choose a start date"),
  endDate: z.string().min(1, "Choose an end date"),
  remarks: z.string().max(240, "Keep remarks under 240 characters").optional(),
}).superRefine((value, context) => {
  if (value.endDate < value.startDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the start date" })
  }
})

type FormValues = z.infer<typeof leaveSchema>
export type LeaveDraft = { id: string; name: string; initials: string; type: string; dates: string; days: number; status: "pending"; tone: string; startDate: string; endDate: string; remarks: string }

export function LeaveRequestForm({ onSubmit }: { onSubmit: (leave: LeaveDraft) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { type: "Paid time off", remarks: "" },
  })

  const submit = (values: FormValues) => {
    const start = new Date(`${values.startDate}T00:00:00`)
    const end = new Date(`${values.endDate}T00:00:00`)
    const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
    onSubmit({ id: `leave-${Date.now()}`, name: "Arjun Singh", initials: "AS", type: values.type, dates: `${start.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`, days, status: "pending", tone: "bg-[#d8efbd] text-[#3c6c32]", startDate: values.startDate, endDate: values.endDate, remarks: values.remarks ?? "" })
    reset()
  }

  return <form className="rounded-2xl border border-[#dfe5e0] bg-white p-5 shadow-sm sm:p-6" onSubmit={handleSubmit(submit)}>
    <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]"><CalendarDays className="size-4 text-[#6f9a4a]" /> New request</div><h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.04em]">Take time to reset</h3><p className="mt-1 text-xs text-[#8b959e]">Your request stays pending until HR reviews it.</p></div><Button className="rounded-xl bg-[#0e1c2f]" disabled={isSubmitting} type="submit"><Send className="mr-2 size-3.5" /> Send request</Button></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3"><label className="space-y-1.5 text-xs font-semibold text-[#5c6872]">Type<select className="h-10 w-full rounded-xl border border-[#dfe5e0] bg-white px-3 text-sm font-normal text-[#1e2c40] outline-none focus:ring-2 focus:ring-[#c7f36b]" {...register("type")}><option>Paid time off</option><option>Sick leave</option><option>Unpaid leave</option></select></label><label className="space-y-1.5 text-xs font-semibold text-[#5c6872]">From<Input type="date" {...register("startDate")} />{errors.startDate && <span className="font-normal text-[#b55b4a]">{errors.startDate.message}</span>}</label><label className="space-y-1.5 text-xs font-semibold text-[#5c6872]">To<Input type="date" {...register("endDate")} />{errors.endDate && <span className="font-normal text-[#b55b4a]">{errors.endDate.message}</span>}</label></div><label className="mt-3 block space-y-1.5 text-xs font-semibold text-[#5c6872]">Remarks <textarea className="min-h-20 w-full rounded-xl border border-[#dfe5e0] bg-white px-3 py-2 text-sm font-normal text-[#1e2c40] outline-none placeholder:text-[#a1aab0] focus:ring-2 focus:ring-[#c7f36b]" placeholder="Add a note for your manager (optional)" {...register("remarks")} /></label>
  </form>
}
