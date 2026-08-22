export const DEMO_EMPLOYEE = "Arjun Singh"
export const DEMO_HR = "Ashwith Shetty"

export function isDemoMode(url: string | undefined, key: string | undefined) {
  return !(url && key)
}
