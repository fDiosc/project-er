'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface ImportSummary {
  totalRows: number
  processed: number
  created: number
  updated: number
  errors: number
  errorDetails?: string[]
}

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

async function importCSV(file: File, upsertMode: string): Promise<ImportSummary> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upsertMode', upsertMode)

  const response = await fetch('/api/import/csv', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Import failed')
  }

  const result = await response.json()
  return result.summary
}

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [upsertMode, setUpsertMode] = useState<string>('externalId')
  const [isDragging, setIsDragging] = useState(false)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: ({ file, mode }: { file: File; mode: string }) => 
      importCSV(file, mode),
    onSuccess: (summary) => {
      setImportSummary(summary)
      queryClient.invalidateQueries({ queryKey: ['ers'] })
      
      if (summary.errors === 0) {
        toast.success(`Successfully imported ${summary.created} new ERs and updated ${summary.updated} existing ones`)
      } else {
        toast.warning(`Import completed with ${summary.errors} errors. ${summary.created} created, ${summary.updated} updated.`)
      }
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`)
    }
  })

  const handleFileSelect = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please select a valid CSV file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size too large. Please select a file smaller than 10MB')
      return
    }

    setSelectedFile(file)
    setImportSummary(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleImport = () => {
    if (!selectedFile) return
    
    importMutation.mutate({ file: selectedFile, mode: upsertMode })
  }

  const handleClose = () => {
    setSelectedFile(null)
    setImportSummary(null)
    setUpsertMode('externalId')
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import ERs from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import Enhancement Requests. The system will automatically map columns and import all data including scores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4">
                <p className="text-sm font-medium">
                  {isDragging ? 'Drop your CSV file here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV files up to 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • CSV File
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedFile && !importSummary && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="upsert-mode">Import Mode</Label>
                <Select value={upsertMode} onValueChange={setUpsertMode}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="externalId">
                      Update by External ID (Recommended)
                    </SelectItem>
                    <SelectItem value="subject+company">
                      Update by Subject + Company
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {upsertMode === 'externalId' 
                    ? 'ERs with matching External IDs will be updated, new ones will be created.'
                    : 'ERs with matching Subject and Company will be updated, new ones will be created.'
                  }
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">CSV Import Details:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <strong>Status Mapping:</strong> Uses second &quot;Status&quot; column (Accepted/Rejected)</li>
                  <li>• <strong>All Scores:</strong> Strategic, Impact, Technical, Resource, Market (0-5)</li>
                  <li>• <strong>Complete Data:</strong> All fields, descriptions, dates, external IDs</li>
                  <li>• <strong>Auto-calculation:</strong> Total scores computed with current weights</li>
                  <li>• <strong>Companies:</strong> Auto-created from Organization field</li>
                </ul>
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <strong>Status Priority:</strong> Accepted/Rejected → In Review → Open
                </div>
              </div>
            </div>
          )}

          {importMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing...</span>
                <span>Please wait</span>
              </div>
              <Progress className="w-full h-2" />
            </div>
          )}

          {importSummary && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {importSummary.errors === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    <h4 className="font-medium">
                      Import {importSummary.errors === 0 ? 'Completed' : 'Completed with Warnings'}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Rows:</span>
                      <span className="ml-2 font-medium">{importSummary.totalRows}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Processed:</span>
                      <span className="ml-2 font-medium">{importSummary.processed}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2 font-medium text-green-600">{importSummary.created}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="ml-2 font-medium text-blue-600">{importSummary.updated}</span>
                    </div>
                    {importSummary.errors > 0 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Errors:</span>
                        <span className="ml-2 font-medium text-red-600">{importSummary.errors}</span>
                      </div>
                    )}
                  </div>

                  {importSummary.errorDetails && importSummary.errorDetails.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">Error Details:</h5>
                      <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-1">
                        {importSummary.errorDetails.map((error, i) => (
                          <div key={i}>• {error}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importSummary ? 'Close' : 'Cancel'}
          </Button>
          {selectedFile && !importSummary && (
            <Button 
              onClick={handleImport}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? 'Importing...' : 'Import CSV'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}