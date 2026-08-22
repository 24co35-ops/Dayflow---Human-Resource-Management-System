export type FlowAction = "apply_leave" | "check_in" | "check_out" | "payroll_summary"

export function isKnownFlowAction(action: string): action is FlowAction {
  return ["apply_leave", "check_in", "check_out", "payroll_summary"].includes(action)
}

export function flowPromptChip(label: string) {
  return label.trim().replace(/\s+/g, " ")
}
