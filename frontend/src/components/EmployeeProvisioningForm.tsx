import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { DayflowEmployeeInput, DayflowProvisionedEmployee } from "@/lib/dayflow-api"

const initialForm: DayflowEmployeeInput = {
  full_name: "",
  email: "",
  department: "Engineering",
  job_position: "",
  joining_year: new Date().getFullYear(),
  phone: "",
  location: "Bengaluru",
}

export function EmployeeProvisioningForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (input: DayflowEmployeeInput) => Promise<DayflowProvisionedEmployee>
  isSubmitting: boolean
}) {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState<DayflowProvisionedEmployee | null>(null)
  const [error, setError] = useState("")
  const update = (key: keyof DayflowEmployeeInput, value: string) =>
    setForm((current) => ({
      ...current,
      [key]: key === "joining_year" ? Number(value) : value,
    }))
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    try {
      setResult(await onSubmit(form))
      setForm(initialForm)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not create employee")
    }
  }

  return (
    <Card className="rounded-2xl border-[#dfe5e0] bg-white shadow-sm">
      <CardHeader className="p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8792]">HR workspace</div>
        <CardTitle className="mt-2 font-display text-2xl tracking-[-0.04em]">Add an employee</CardTitle>
        <p className="mt-1 text-xs text-[#8b959e]">Dayflow generates the login ID and first-time password after creation.</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
          <Input aria-label="Full name" minLength={2} onChange={(event) => update("full_name", event.target.value)} placeholder="Full name" required value={form.full_name} />
          <Input aria-label="Work email" onChange={(event) => update("email", event.target.value)} placeholder="Work email" required type="email" value={form.email} />
          <Input aria-label="Department" onChange={(event) => update("department", event.target.value)} placeholder="Department" required value={form.department} />
          <Input aria-label="Job position" onChange={(event) => update("job_position", event.target.value)} placeholder="Job position" required value={form.job_position} />
          <Input aria-label="Joining year" max={2100} min={2000} onChange={(event) => update("joining_year", event.target.value)} required type="number" value={form.joining_year} />
          <Input aria-label="Phone" onChange={(event) => update("phone", event.target.value)} placeholder="Phone (optional)" value={form.phone} />
          <Input aria-label="Location" onChange={(event) => update("location", event.target.value)} placeholder="Location" value={form.location} />
          <Button className="rounded-xl bg-[#0e1c2f]" disabled={isSubmitting} type="submit">{isSubmitting ? "Creating…" : "Create employee"}</Button>
        </form>
        {error && <p className="mt-3 text-xs font-semibold text-[#b55b4a]" role="alert">{error}</p>}
        {result && <div className="mt-4 rounded-xl border border-[#c7f36b] bg-[#eff8df] p-4 text-sm text-[#35552d]" role="status"><div className="font-bold">Employee created: {result.full_name}</div><div className="mt-1">Login ID: <strong>{result.employee_code}</strong></div><div>First-time password: <strong>{result.temporary_password}</strong></div><p className="mt-2 text-xs">Show these credentials once and ask the employee to change the password after first login.</p></div>}
      </CardContent>
    </Card>
  )
}
