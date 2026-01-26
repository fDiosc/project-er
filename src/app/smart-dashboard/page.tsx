'use client'

import { useState } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { ChatPanel } from '@/components/intelligent-dashboard/chat-panel'
import { ArtifactRenderer } from '@/components/intelligent-dashboard/artifact-renderer'
import { Message, Artifact } from '@/types/intelligent-dashboard'
import { apiRequest } from '@/lib/api'
import { BarChart3, LayoutDashboard, Database } from 'lucide-react'

export default function SmartDashboardPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null)

    const handleSendMessage = async (content: string) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date()
        }

        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setIsLoading(true)

        try {
            const response = await apiRequest('/api/intelligent-dashboard/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: content,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            })

            if (!response.ok) throw new Error('Failed to fetch AI response')
            const data = await response.json()

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.text,
                timestamp: new Date(),
                artifact: data.artifact,
                attempts: data.debug?.attempts
            }

            setMessages(prev => [...prev, botMsg])
            if (data.artifact) {
                setCurrentArtifact(data.artifact)
            }
        } catch (error) {
            console.error(error)
            const errorMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: 'system',
                content: 'Sorry, I encountered an error processing your request.',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthGuard>
            <div className="h-screen flex flex-col bg-background">
                <Navigation />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                            <BarChart3 size={40} className="text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="font-black text-xl text-foreground">Smart Dashboard Disabled</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            This feature is currently disabled. Please contact the administrator for more information.
                        </p>
                    </div>
                </main>
            </div>
        </AuthGuard>
    )
}

/*
// Original content commented out for safety
export default function SmartDashboardPage() {
    ...
}
*/
