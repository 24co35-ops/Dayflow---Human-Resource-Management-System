export type SalaryBreakdown = { wage: number; deductions: number }

export function netSalary({ wage, deductions }: SalaryBreakdown) {
  return Math.max(0, wage - deductions)
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}
