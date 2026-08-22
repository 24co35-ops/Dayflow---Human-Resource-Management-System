export function shortDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}
