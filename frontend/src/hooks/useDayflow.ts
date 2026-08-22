import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import {
  createDayflowClient,
  type DayflowActor,
  type DayflowLeaveInput,
  type DayflowRole,
} from "@/lib/dayflow-api"

export const dayflowApiEnabled =
  import.meta.env.VITE_DAYFLOW_API_ENABLED === "true"

export function useDayflow(role: DayflowRole, enabled = dayflowApiEnabled) {
  const queryClient = useQueryClient()
  const actor = useMemo<DayflowActor>(
    () => ({
      role,
      profileId: role === "hr" || role === "admin" ? "hr-001" : "emp-001",
    }),
    [role],
  )
  const service = useMemo(() => createDayflowClient(actor), [actor])
  const queryOptions = { enabled, retry: 1 }

  const invalidateWorkspace = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dayflow", "me", actor] }),
      queryClient.invalidateQueries({ queryKey: ["dayflow", "dashboard", actor] }),
      queryClient.invalidateQueries({ queryKey: ["dayflow", "attendance", actor] }),
      queryClient.invalidateQueries({ queryKey: ["dayflow", "people", actor] }),
      queryClient.invalidateQueries({ queryKey: ["dayflow", "leaves", actor] }),
      queryClient.invalidateQueries({ queryKey: ["dayflow", "activity", actor] }),
      queryClient.invalidateQueries({ queryKey: ["dayflow", "payroll", actor] }),
    ])
  }

  const me = useQuery({
    queryKey: ["dayflow", "me", actor],
    queryFn: service.getMe,
    ...queryOptions,
  })
  const dashboard = useQuery({
    queryKey: ["dayflow", "dashboard", actor],
    queryFn: service.getDashboard,
    ...queryOptions,
  })
  const attendance = useQuery({
    queryKey: ["dayflow", "attendance", actor],
    queryFn: service.getAttendance,
    ...queryOptions,
  })
  const people = useQuery({
    queryKey: ["dayflow", "people", actor],
    queryFn: service.getPeople,
    enabled: enabled && (role === "hr" || role === "admin"),
    retry: 1,
  })
  const leaves = useQuery({
    queryKey: ["dayflow", "leaves", actor],
    queryFn: service.getLeaves,
    ...queryOptions,
  })
  const payroll = useQuery({
    queryKey: ["dayflow", "payroll", actor],
    queryFn: service.getPayroll,
    ...queryOptions,
  })
  const activity = useQuery({
    queryKey: ["dayflow", "activity", actor],
    queryFn: service.getActivity,
    ...queryOptions,
  })

  const checkIn = useMutation({
    mutationFn: service.checkIn,
    onSuccess: invalidateWorkspace,
  })
  const checkOut = useMutation({
    mutationFn: service.checkOut,
    onSuccess: invalidateWorkspace,
  })
  const createLeave = useMutation({
    mutationFn: (input: DayflowLeaveInput) => service.createLeave(input),
    onSuccess: invalidateWorkspace,
  })
  const reviewLeave = useMutation({
    mutationFn: ({
      requestId,
      status,
      reviewComment,
    }: {
      requestId: string
      status: "approved" | "rejected"
      reviewComment?: string
    }) => service.reviewLeave(requestId, status, reviewComment),
    onSuccess: invalidateWorkspace,
  })
  const flowMessage = useMutation({
    mutationFn: service.flowMessage,
  })

  return {
    actor,
    me,
    dashboard,
    attendance,
    people,
    leaves,
    payroll,
    activity,
    checkIn,
    checkOut,
    createLeave,
    reviewLeave,
    flowMessage,
    isLoading: me.isLoading || dashboard.isLoading || leaves.isLoading,
    isError: me.isError || dashboard.isError || leaves.isError,
    invalidateWorkspace,
  }
}
