'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ERStatus } from '@/types'

interface EditableStatusCellProps {
  value: ERStatus
  erId: string
}

const statusColors: Record<ERStatus, string> = {
  [ERStatus.OPEN]: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  [ERStatus.IN_REVIEW]: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  [ERStatus.ACCEPTED]: 'bg-green-100 text-green-800 hover:bg-green-200',
  [ERStatus.DELIVERED]: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  [ERStatus.MANUAL_REVIEW]: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  [ERStatus.REJECTED]: 'bg-red-100 text-red-800 hover:bg-red-200',
  [ERStatus.ACCEPT]: 'bg-green-100 text-green-800 hover:bg-green-200',
  [ERStatus.REJECT]: 'bg-red-100 text-red-800 hover:bg-red-200',
}

async function updateStatus(erId: string, status: ERStatus) {
  const response = await fetch(`/api/ers/${erId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error('Failed to update status')
  return response.json()
}

export function EditableStatusCell({ value, erId }: EditableStatusCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const updateStatusMutation = useMutation({
    mutationFn: ({ erId, status }: { erId: string; status: ERStatus }) =>
      updateStatus(erId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ers'] })
      queryClient.invalidateQueries({ queryKey: ['er', erId] })
      toast.success('Status updated successfully')
      setIsEditing(false)
    },
    onError: () => {
      toast.error('Failed to update status')
      setIsEditing(false)
    }
  })

  const handleStatusChange = (newStatus: ERStatus) => {
    if (newStatus !== value) {
      updateStatusMutation.mutate({ erId, status: newStatus })
    } else {
      setIsEditing(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  if (isEditing) {
    return (
      <Select
        value={value}
        onValueChange={handleStatusChange}
        onOpenChange={(open) => !open && setIsEditing(false)}
        open={true}
      >
        <SelectTrigger
          className="w-28 h-6 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ERStatus.OPEN}>Open</SelectItem>
          <SelectItem value={ERStatus.IN_REVIEW}>In Review</SelectItem>
          <SelectItem value={ERStatus.ACCEPTED}>Accepted</SelectItem>
          <SelectItem value={ERStatus.ACCEPT}>Accept</SelectItem>
          <SelectItem value={ERStatus.REJECT}>Reject</SelectItem>
          <SelectItem value={ERStatus.DELIVERED}>Delivered</SelectItem>
          <SelectItem value={ERStatus.MANUAL_REVIEW}>Manual Review</SelectItem>
          <SelectItem value={ERStatus.REJECTED}>Rejected</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  return (
    <Badge
      variant="secondary"
      className={`${statusColors[value]} cursor-pointer hover:scale-105 transition-transform`}
      onClick={handleClick}
      title="Click to change status"
    >
      {updateStatusMutation.isPending ? (
        <div className="animate-pulse">•••</div>
      ) : (
        value.replace('_', ' ')
      )}
    </Badge>
  )
}