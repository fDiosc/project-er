"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Database, Layers, ShieldCheck, Zap } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50">
            {/* Navigation */}
            <header className="px-6 h-16 flex items-center border-b border-slate-800 backdrop-blur-md bg-slate-950/50 fixed w-full z-50">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
                            <span className="text-white">ER</span>
                        </div>
                        <span>Review</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                        <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                            <Link href="/">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-16">
                {/* Hero Section */}
                <section className="py-24 md:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="max-w-3xl mx-auto text-center space-y-8">
                            <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
                                <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                                v1.0 Now Available
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200 pb-2">
                                Transform Enhancement Requests into User Value
                            </h1>
                            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                                Centralize, score, and prioritize product feedback with AI-driven insights.
                                Stop guessing what to build next and start delivering what matters.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Button size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 rounded-full w-full sm:w-auto">
                                    Start Prioritizing
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button size="lg" variant="outline" className="h-12 px-8 text-base border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full w-full sm:w-auto">
                                    View Demo
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dashboard Preview */}
                <section className="pb-24 px-6 relative z-10 -mt-12">
                    <div className="container mx-auto">
                        <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 shadow-2xl overflow-hidden backdrop-blur-sm group hover:border-blue-500/30 transition-colors duration-500">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <Image
                                src="/images/dashboard-mockup.png"
                                alt="ER Review Dashboard Interface"
                                width={1200}
                                height={800}
                                className="w-full h-auto rounded-lg shadow-2xl opacity-90 hover:opacity-100 transition-opacity duration-700 block"
                                priority
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none"></div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 bg-slate-900/30 border-y border-slate-800/50">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold mb-4">Built for Product Teams</h2>
                            <p className="text-slate-400">Everything you need to make data-backed product decisions without the spreadsheet chaos.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: BarChart3,
                                    title: "Smart Scoring",
                                    desc: "Multidimensional scoring algorithms (Strategic, Impact, Market) automatically rank requests by business value."
                                },
                                {
                                    icon: Database,
                                    title: "Centralized Data",
                                    desc: "Ingest requests from CSV, Zendesk, or API. Unify all your feedback streams into one searchable source of truth."
                                },
                                {
                                    icon: Layers,
                                    title: "Flexible Workflow",
                                    desc: "Customizable status pipelines. Move requests from Open to In Review to Accepted with full audit trails."
                                },
                                {
                                    icon: Zap,
                                    title: "Real-time Analytics",
                                    desc: "Instant dashboards showing acceptance rates, score distributions, and customer request trends."
                                },
                                {
                                    icon: ShieldCheck,
                                    title: "Enterprise Ready",
                                    desc: "Role-based access control, secure JWT authentication, and comprehensive audit logging for compliance."
                                },
                                {
                                    icon: ArrowRight,
                                    title: "Seamless Export",
                                    desc: "Export your prioritized roadmap to CSV for executive reporting or Jira integration."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors group">
                                    <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <feature.icon className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-slate-100">{feature.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 relative overflow-hidden">
                    <div className="container mx-auto px-6 relative z-10 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Ready to streamline your roadmap?</h2>
                        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                            Join forward-thinking product teams who prioritize with data, not gut feelings.
                        </p>
                        <Button size="lg" className="h-14 px-10 text-lg bg-white text-slate-950 hover:bg-slate-200 rounded-full font-semibold">
                            <Link href="/">Launch ER Review</Link>
                        </Button>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full -z-10" />
                </section>
            </main>

            <footer className="py-12 border-t border-slate-800 bg-slate-950 text-slate-400 text-sm">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 font-semibold text-slate-200">
                        <div className="bg-slate-800 w-6 h-6 rounded flex items-center justify-center text-xs">ER</div>
                        Review
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white">Privacy</a>
                        <a href="#" className="hover:text-white">Terms</a>
                        <a href="#" className="hover:text-white">Contact</a>
                    </div>
                    <div className="text-slate-500">
                        © 2025 ER Review Inc.
                    </div>
                </div>
            </footer>
        </div>
    )
}
