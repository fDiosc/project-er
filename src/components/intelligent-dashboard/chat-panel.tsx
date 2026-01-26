'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Message, Artifact } from '@/types/intelligent-dashboard'
import { Send, User, Bot, Loader2, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
    messages: Message[]
    onSendMessage: (content: string) => void
    onArtifactSelect: (artifact: Artifact) => void
    isLoading: boolean
}

export const ChatPanel: React.FC<Props> = ({ messages, onSendMessage, onArtifactSelect, isLoading }) => {
    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = () => {
        if (!inputValue.trim() || isLoading) return
        onSendMessage(inputValue)
        setInputValue('')
    }

    const MarkdownContent = ({ content, isUser }: { content: string; isUser: boolean }) => {
        if (isUser) {
            return <div className="whitespace-pre-wrap">{content}</div>
        }

        return (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-muted-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                >
                    {content}
                </ReactMarkdown>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background border-r">
            <div className="h-16 border-b flex items-center px-6 bg-card shrink-0">
                <Sparkles className="text-primary mr-2 h-5 w-5" />
                <span className="font-bold text-lg">Smart Analyst</span>
                <span className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                    Expert
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/10">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-primary opacity-50" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Intelligent Dashboard</h3>
                            <p className="text-sm text-muted-foreground max-w-[250px]">
                                Ask about status distributions, score trends, or company metrics.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 w-full mt-4">
                            {['Show ER status distribution', 'Top companies by accepted ERs', 'What are the scoring trends?'].map(q => (
                                <Button
                                    key={q}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs justify-start font-medium"
                                    onClick={() => onSendMessage(q)}
                                >
                                    {q}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn("flex max-w-[90%]", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn(
                                "shrink-0 w-8 h-8 rounded-full flex items-center justify-center mx-2 border",
                                msg.role === 'user' ? "bg-muted shadow-sm" : "bg-primary text-primary-foreground shadow-md"
                            )}>
                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div className="space-y-2">
                                <div className={cn(
                                    "p-4 rounded-2xl text-sm leading-relaxed shadow-sm border",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-none border-primary/20"
                                        : "bg-card text-card-foreground rounded-tl-none border-border"
                                )}>
                                    <MarkdownContent content={msg.content} isUser={msg.role === 'user'} />
                                </div>
                                {msg.role === 'assistant' && msg.attempts && msg.attempts > 1 && (
                                    <div className="flex items-center text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                                        <Sparkles size={10} className="mr-1" />
                                        Self-Corrected ({msg.attempts} attempts)
                                    </div>
                                )}
                                {msg.role === 'assistant' && msg.artifact && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onArtifactSelect(msg.artifact!)}
                                        className="text-[10px] h-7 font-black uppercase tracking-tighter shadow-sm border-primary/20 hover:bg-primary/5 group"
                                    >
                                        <TrendingUp size={12} className="mr-1 group-hover:scale-110 transition-transform" />
                                        Open Visualization
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-center ml-12 bg-card px-4 py-3 rounded-2xl rounded-tl-none border shadow-sm">
                            <div className="flex space-x-1.5 items-center">
                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                <Loader2 className="h-3 w-3 animate-spin ml-2 text-primary opacity-20" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-card">
                <div className="flex space-x-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask the analyst..."
                        className="flex-1 text-sm shadow-inner bg-muted/20"
                        disabled={isLoading}
                    />
                    <Button onClick={handleSend} disabled={isLoading || !inputValue.trim()} size="icon" className="shadow-md">
                        <Send size={18} />
                    </Button>
                </div>
            </div>
        </div>
    )
}
