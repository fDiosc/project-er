'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { get, post } from '@/lib/api'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const formSchema = z.object({
    subdomain: z.string().min(1, 'Subdomain is required'),
    email: z.string().email('Invalid email address'),
    apiToken: z.string().optional(),
    viewId: z.string().min(1, 'View ID is required'),
})

export function ZendeskConfigForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasToken, setHasToken] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subdomain: '',
            email: '',
            viewId: '',
            apiToken: '',
        },
    })

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await get('/api/settings/zendesk')
                if (config) {
                    form.reset({
                        subdomain: config.subdomain || '',
                        email: config.email || '',
                        viewId: config.viewId || '',
                        apiToken: '', // Never fill token back
                    })
                    setHasToken(config.hasToken)
                }
            } catch (err) {
                console.error('Failed to load settings', err)
            }
        }
        fetchConfig()
    }, [form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            if (!values.apiToken && !hasToken) {
                setError('API Token is required for initial setup')
                return
            }

            await post('/api/settings/zendesk', values)
            setSuccess(true)
            setHasToken(true)
            form.setValue('apiToken', '') // Clear token field
        } catch (err) {
            setError('Failed to save configuration')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Zendesk Integration</CardTitle>
                <CardDescription>
                    Configure your Zendesk connection to sync tickets.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {success && (
                    <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>Configuration saved successfully.</AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="subdomain"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subdomain</FormLabel>
                                        <FormControl>
                                            <Input placeholder="your-company" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The part before .zendesk.com
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="viewId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>View ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="12345678" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            ID of the View/Filter to sync tickets from
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agent Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="agent@company.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="apiToken"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>API Token {hasToken && '(Configured)'}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder={hasToken ? "Leave empty to keep existing token" : "Enter API Token"}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Generate this in Zendesk Admin Center &gt; Apps and integrations &gt; APIs
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
