'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Check, ChevronsUpDown, Hash, Tag, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { createERSchema } from '@/lib/validations'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { get, post } from '@/lib/api'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from '@/components/ui/form'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

interface CreateERDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type CreateERFormValues = z.infer<typeof createERSchema>

interface Company {
    id: string
    name: string
}

interface Release {
    id: string
    name: string
}

interface DevelopmentStatus {
    id: string
    name: string
}

export function CreateERDialog({ open, onOpenChange }: CreateERDialogProps) {
    const queryClient = useQueryClient()
    const [openCompany, setOpenCompany] = useState(false)
    const [openRelease, setOpenRelease] = useState(false)
    const [openDevStatus, setOpenDevStatus] = useState(false)

    const [searchCompany, setSearchCompany] = useState("")
    const [searchRelease, setSearchRelease] = useState("")
    const [searchDevStatus, setSearchDevStatus] = useState("")

    const form = useForm<CreateERFormValues>({
        resolver: zodResolver(createERSchema),
        defaultValues: {
            subject: '',
            overview: '',
            description: '',
            externalId: '',
            companyId: '',
            status: 'OPEN',
            committedVersion: '',
            releaseId: '',
            devStatusId: '',
            submittedPriority: '',
            priorityLabel: '',
            sentiment: '',
            requestedAt: undefined,
            strategic: 0,
            impact: 0,
            technical: 0,
            resource: 0,
            market: 0,
        }
    })

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            form.reset({
                subject: '',
                overview: '',
                description: '',
                externalId: `MAN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                companyId: '',
                status: 'OPEN',
                committedVersion: '',
                releaseId: '',
                devStatusId: '',
                submittedPriority: '',
                priorityLabel: '',
                sentiment: '',
                requestedAt: undefined,
                strategic: 0,
                impact: 0,
                technical: 0,
                resource: 0,
                market: 0,
            })
        }
    }, [open, form])

    // Fetch companies for the dropdown
    const { data: companies, isLoading: isLoadingCompanies } = useQuery<Company[]>({
        queryKey: ['companies'],
        queryFn: () => get('/api/companies')
    })

    // Fetch releases
    const { data: releases, isLoading: isLoadingReleases } = useQuery<Release[]>({
        queryKey: ['releases'],
        queryFn: () => get('/api/releases')
    })

    // Fetch dev statuses
    const { data: devStatuses, isLoading: isLoadingDevStatuses } = useQuery<DevelopmentStatus[]>({
        queryKey: ['dev-statuses'],
        queryFn: () => get('/api/dev-statuses')
    })

    const filteredCompanies = useMemo(() => {
        const list = companies || []
        if (!searchCompany) return list
        const lowerSearch = searchCompany.toLowerCase()
        return list.filter((company: Company) =>
            company.name.toLowerCase().includes(lowerSearch)
        )
    }, [companies, searchCompany])

    const filteredReleases = useMemo(() => {
        const list = releases || []
        if (!searchRelease) return list
        const lowerSearch = searchRelease.toLowerCase()
        return list.filter((release: Release) =>
            release.name.toLowerCase().includes(lowerSearch)
        )
    }, [releases, searchRelease])

    const filteredDevStatuses = useMemo(() => {
        const list = devStatuses || []
        if (!searchDevStatus) return list
        const lowerSearch = searchDevStatus.toLowerCase()
        return list.filter((status: DevelopmentStatus) =>
            status.name.toLowerCase().includes(lowerSearch)
        )
    }, [devStatuses, searchDevStatus])

    const { mutate: createCompany, isPending: isCreatingCompany } = useMutation({
        mutationFn: (name: string) => post('/api/companies', { name }),
        onSuccess: (newCompany: Company) => {
            toast.success(`Company "${newCompany.name}" created`)
            queryClient.setQueryData(['companies'], (old: Company[] | undefined) => {
                const updated = old ? [...old, newCompany] : [newCompany]
                return updated.sort((a, b) => a.name.localeCompare(b.name))
            })
            form.setValue('companyId', newCompany.id)
            setOpenCompany(false)
            setSearchCompany("")
        }
    })

    const { mutate: createReleaseMutation, isPending: isCreatingRelease } = useMutation({
        mutationFn: (name: string) => post('/api/releases', { name }),
        onSuccess: (newRelease: Release) => {
            toast.success(`Release "${newRelease.name}" created`)
            queryClient.setQueryData(['releases'], (old: Release[] | undefined) => {
                const updated = old ? [...old, newRelease] : [newRelease]
                return updated.sort((a, b) => a.name.localeCompare(b.name))
            })
            form.setValue('releaseId', newRelease.id)
            setOpenRelease(false)
            setSearchRelease("")
        }
    })

    const { mutate: createDevStatusMutation, isPending: isCreatingDevStatus } = useMutation({
        mutationFn: (name: string) => post('/api/dev-statuses', { name }),
        onSuccess: (newStatus: DevelopmentStatus) => {
            toast.success(`Status "${newStatus.name}" created`)
            queryClient.setQueryData(['dev-statuses'], (old: DevelopmentStatus[] | undefined) => {
                const updated = old ? [...old, newStatus] : [newStatus]
                return updated.sort((a, b) => a.name.localeCompare(b.name))
            })
            form.setValue('devStatusId', newStatus.id)
            setOpenDevStatus(false)
            setSearchDevStatus("")
        }
    })

    const { mutate: createER, isPending } = useMutation({
        mutationFn: async (data: CreateERFormValues) => {
            const er = await post('/api/ers', data)
            // Automatically trigger AI analysis after creation
            try {
                await post(`/api/ers/${er.id}/ai-analyze`, {})
            } catch (e) {
                console.warn('Initial AI analysis failed, user can retry manually', e)
            }
            return er
        },
        onSuccess: () => {
            toast.success('ER created successfully')
            queryClient.invalidateQueries({ queryKey: ['ers'] })
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(`Error: ${error.message}`)
        }
    })

    const onSubmit = (data: CreateERFormValues) => {
        createER(data)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Enhancement Request</DialogTitle>
                    <DialogDescription>
                        Manually add a new request to the backlog with full metadata.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter ER subject..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="companyId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Company</FormLabel>
                                            <Popover open={openCompany} onOpenChange={setOpenCompany}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={openCompany}
                                                            className={cn(
                                                                "w-full justify-between font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? companies?.find(
                                                                    (company) => company.id === field.value
                                                                )?.name
                                                                : "Select company..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <Command shouldFilter={false}>
                                                        <CommandInput
                                                            placeholder="Search company..."
                                                            value={searchCompany}
                                                            onValueChange={setSearchCompany}
                                                        />
                                                        <CommandList>
                                                            {isLoadingCompanies ? (
                                                                <CommandEmpty>Loading companies...</CommandEmpty>
                                                            ) : (
                                                                <>
                                                                    {filteredCompanies.length === 0 && searchCompany && (
                                                                        <CommandEmpty>
                                                                            <div className="flex flex-col items-center justify-center p-2">
                                                                                <p className="text-sm text-muted-foreground mb-2">
                                                                                    No company found.
                                                                                </p>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    className="w-full"
                                                                                    onClick={() => createCompany(searchCompany)}
                                                                                    disabled={isCreatingCompany}
                                                                                >
                                                                                    {isCreatingCompany && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                                                    Create "{searchCompany}"
                                                                                </Button>
                                                                            </div>
                                                                        </CommandEmpty>
                                                                    )}
                                                                    <CommandGroup>
                                                                        {filteredCompanies.map((company: Company) => (
                                                                            <CommandItem
                                                                                value={company.name}
                                                                                key={company.id}
                                                                                onSelect={() => {
                                                                                    form.setValue("companyId", company.id)
                                                                                    setOpenCompany(false)
                                                                                    setSearchCompany("")
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        company.id === field.value
                                                                                            ? "opacity-100"
                                                                                            : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {company.name}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description (Initial Request)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Detailed description of the request..."
                                                    className="min-h-[150px]"
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Right Column: Metadata */}
                            <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                                <div className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                                    <Hash className="h-4 w-4" /> Metadata & References
                                </div>

                                <FormField
                                    control={form.control}
                                    name="externalId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>External Reference ID (UID)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. TICKET-123" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormDescription className="text-[10px]">
                                                Used for tracking and AI context linking.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Committed Release selector */}
                                    <FormField
                                        control={form.control}
                                        name="releaseId"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="flex items-center gap-1.5">
                                                    <Tag className="h-3 w-3" /> Committed Release
                                                </FormLabel>
                                                <Popover open={openRelease} onOpenChange={setOpenRelease}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={openRelease}
                                                                className={cn(
                                                                    "w-full justify-between font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? releases?.find(
                                                                        (r) => r.id === field.value
                                                                    )?.name
                                                                    : "Select release..."}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[200px] p-0" align="start">
                                                        <Command shouldFilter={false}>
                                                            <CommandInput
                                                                placeholder="Search/Create release..."
                                                                value={searchRelease}
                                                                onValueChange={setSearchRelease}
                                                            />
                                                            <CommandList>
                                                                {isLoadingReleases ? (
                                                                    <CommandEmpty>Loading releases...</CommandEmpty>
                                                                ) : (
                                                                    <>
                                                                        {filteredReleases.length === 0 && searchRelease && (
                                                                            <CommandEmpty>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="w-full text-xs"
                                                                                    onClick={() => createReleaseMutation(searchRelease)}
                                                                                    disabled={isCreatingRelease}
                                                                                >
                                                                                    {isCreatingRelease && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                                                    Create "{searchRelease}"
                                                                                </Button>
                                                                            </CommandEmpty>
                                                                        )}
                                                                        <CommandGroup>
                                                                            {filteredReleases.map((release: Release) => (
                                                                                <CommandItem
                                                                                    value={release.name}
                                                                                    key={release.id}
                                                                                    onSelect={() => {
                                                                                        form.setValue("releaseId", release.id)
                                                                                        setOpenRelease(false)
                                                                                        setSearchRelease("")
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            release.id === field.value
                                                                                                ? "opacity-100"
                                                                                                : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    {release.name}
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </>
                                                                )}
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Development Status selector */}
                                    <FormField
                                        control={form.control}
                                        name="devStatusId"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="flex items-center gap-1.5">
                                                    <Activity className="h-3 w-3" /> Dev Status
                                                </FormLabel>
                                                <Popover open={openDevStatus} onOpenChange={setOpenDevStatus}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={openDevStatus}
                                                                className={cn(
                                                                    "w-full justify-between font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? devStatuses?.find(
                                                                        (s) => s.id === field.value
                                                                    )?.name
                                                                    : "Select status..."}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[200px] p-0" align="start">
                                                        <Command shouldFilter={false}>
                                                            <CommandInput
                                                                placeholder="Search/Create status..."
                                                                value={searchDevStatus}
                                                                onValueChange={setSearchDevStatus}
                                                            />
                                                            <CommandList>
                                                                {isLoadingDevStatuses ? (
                                                                    <CommandEmpty>Loading statuses...</CommandEmpty>
                                                                ) : (
                                                                    <>
                                                                        {filteredDevStatuses.length === 0 && searchDevStatus && (
                                                                            <CommandEmpty>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="w-full text-xs"
                                                                                    onClick={() => createDevStatusMutation(searchDevStatus)}
                                                                                    disabled={isCreatingDevStatus}
                                                                                >
                                                                                    {isCreatingDevStatus && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                                                    Create "{searchDevStatus}"
                                                                                </Button>
                                                                            </CommandEmpty>
                                                                        )}
                                                                        <CommandGroup>
                                                                            {filteredDevStatuses.map((status: DevelopmentStatus) => (
                                                                                <CommandItem
                                                                                    value={status.name}
                                                                                    key={status.id}
                                                                                    onSelect={() => {
                                                                                        form.setValue("devStatusId", status.id)
                                                                                        setOpenDevStatus(false)
                                                                                        setSearchDevStatus("")
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            status.id === field.value
                                                                                                ? "opacity-100"
                                                                                                : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    {status.name}
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </>
                                                                )}
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="committedVersion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Committed Version</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. v2.4" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="submittedPriority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Initial Priority</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. P1, P2" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="requestedAt"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Original Request Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="priorityLabel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ER Priority Label</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. High, Medium..." {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Initial Scoring (0-5)
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                <FormField
                                    control={form.control}
                                    name="strategic"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase text-center block">Strat</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" max="5" className="text-center" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="impact"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase text-center block">Impact</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" max="5" className="text-center" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="market"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase text-center block">Market</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" max="5" className="text-center" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="technical"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase text-center block">Tech</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" max="5" className="text-center" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="resource"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase text-center block">Res</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" max="5" className="text-center" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending} className="bg-primary shadow-lg">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Plus className="mr-2 h-4 w-4" />
                                Create Enhanced ER
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
