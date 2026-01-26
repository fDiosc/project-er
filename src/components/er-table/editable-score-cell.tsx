'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface EditableScoreCellProps {
  value: number | undefined
  erId: string
  scoreType: string
  onScoreUpdate?: (newTotal: number) => void
}

async function updateScore(erId: string, scoreType: string, value: number) {
  const response = await fetch(`/api/ers/${erId}/scores`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [scoreType]: value }),
  })
  if (!response.ok) throw new Error('Failed to update score')
  return response.json()
}

export function EditableScoreCell({ 
  value, 
  erId, 
  scoreType, 
  onScoreUpdate 
}: EditableScoreCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value ?? 0))
  const queryClient = useQueryClient()

  const updateScoreMutation = useMutation({
    mutationFn: ({ erId, scoreType, value }: { 
      erId: string
      scoreType: string
      value: number 
    }) => updateScore(erId, scoreType, value),
    onSuccess: (data) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['ers'] })
      queryClient.invalidateQueries({ queryKey: ['er', erId] })
      
      // Update the total in the parent if callback provided
      if (onScoreUpdate && data.scores?.total !== undefined) {
        onScoreUpdate(data.scores.total)
      }
      
      toast.success('Score updated successfully')
      setIsEditing(false)
    },
    onError: () => {
      toast.error('Failed to update score')
      setEditValue(String(value ?? 0)) // Revert
      setIsEditing(false)
    }
  })

  useEffect(() => {
    setEditValue(String(value ?? 0))
  }, [value])

  const handleSave = () => {
    const numValue = parseInt(editValue)
    
    if (isNaN(numValue) || numValue < 0 || numValue > 5) {
      toast.error('Score must be between 0 and 5')
      setEditValue(String(value ?? 0))
      setIsEditing(false)
      return
    }

    if (numValue !== value) {
      updateScoreMutation.mutate({ 
        erId, 
        scoreType, 
        value: numValue 
      })
    } else {
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(String(value ?? 0))
      setIsEditing(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    setIsEditing(true)
  }

  if (isEditing) {
    return (
      <Input
        type="number"
        min="0"
        max="5"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-16 h-8 text-center"
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <div 
      className="text-center cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-w-8"
      onClick={handleClick}
      title="Click to edit"
    >
      {updateScoreMutation.isPending ? (
        <div className="animate-pulse text-muted-foreground">•••</div>
      ) : (
        value !== undefined ? value : '-'
      )}
    </div>
  )
}