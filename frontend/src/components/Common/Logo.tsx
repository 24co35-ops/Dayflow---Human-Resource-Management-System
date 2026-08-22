import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

function DayflowMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={cn("size-9 shrink-0", className)} fill="none" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="dayflow-mark" x1="4" x2="35" y1="4" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E9FFB0" />
          <stop offset="1" stopColor="#9EDB50" />
        </linearGradient>
      </defs>
      <rect fill="#13253B" height="38" rx="12" width="38" x="1" y="1" />
      <path d="M12 26.5c0-5.6 3.8-10.2 9.1-11.5 3.1-.8 5.5-3 6.5-6.1" stroke="url(#dayflow-mark)" strokeLinecap="round" strokeWidth="3.2" />
      <path d="M11.5 17.5h7.8M11.5 23h5" stroke="#F7FFD7" strokeLinecap="round" strokeWidth="2.4" />
      <circle cx="28.5" cy="9" fill="#F7FFD7" r="2.2" />
    </svg>
  )
}

function FullLogo({ className }: { className?: string }) {
  return <span className={cn("flex items-center gap-3", className)}><DayflowMark /><span className="min-w-0"><span className="block font-display text-xl font-semibold tracking-[-0.04em]">dayflow</span><span className="block text-[9px] uppercase tracking-[0.22em] text-current opacity-45">people operating system</span></span></span>
}

export function Logo({ variant = "full", className, asLink = true }: LogoProps) {
  const content = variant === "icon" ? <DayflowMark className={className} /> : variant === "responsive" ? <><span className="group-data-[collapsible=icon]:hidden"><FullLogo /></span><span className="hidden group-data-[collapsible=icon]:block"><DayflowMark className={className} /></span></> : <FullLogo className={className} />
  if (!asLink) return content
  return <Link aria-label="Dayflow home" to="/">{content}</Link>
}
