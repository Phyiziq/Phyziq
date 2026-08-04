'use client'

import { useState } from 'react'
import {
  Dumbbell,
  Utensils,
  Heart,
  Star,
  ShoppingCart,
  CheckCircle,
  WifiOff,
  RotateCcw,
  ChevronRight,
  Menu,
  X,
  Zap,
  TrendingUp,
  Users,
  Package,
  MessageSquare,
  Smartphone,
} from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

type DayStatus = 'completed' | 'rebuilt' | 'scheduled' | 'rest'
type MarketplaceTab = 'coaches' | 'products'
type MPesaState = 'waiting' | 'success' | 'failed'
type ProductCategory = 'supplement' | 'apparel' | 'equipment'

interface Coach {
  id: number
  name: string
  specialisation: string
  rating: number
  reviews: number
  priceKes: number
  verified: boolean
  initials: string
  color: string
}

interface Product {
  id: number
  name: string
  category: ProductCategory
  priceKes: number
  bgColor: string
  icon: React.ReactNode
}

// ─── Static / Mock Data ───────────────────────────────────────────────────────

const days: { label: string; status: DayStatus }[] = [
  { label: 'Mon', status: 'completed' },
  { label: 'Tue', status: 'rebuilt' },
  { label: 'Wed', status: 'scheduled' },
  { label: 'Thu', status: 'scheduled' },
  { label: 'Fri', status: 'scheduled' },
  { label: 'Sat', status: 'rest' },
  { label: 'Sun', status: 'scheduled' },
]

const coaches: Coach[] = [
  {
    id: 1,
    name: 'Amina Wanjiru',
    specialisation: 'Personal Training',
    rating: 4.9,
    reviews: 124,
    priceKes: 1500,
    verified: true,
    initials: 'AW',
    color: 'bg-violet-500',
  },
  {
    id: 2,
    name: 'Brian Ochieng',
    specialisation: 'Dietetics',
    rating: 4.7,
    reviews: 87,
    priceKes: 1200,
    verified: true,
    initials: 'BO',
    color: 'bg-sky-500',
  },
  {
    id: 3,
    name: 'Cynthia Kamau',
    specialisation: 'Physiotherapy',
    rating: 4.8,
    reviews: 56,
    priceKes: 2000,
    verified: false,
    initials: 'CK',
    color: 'bg-rose-500',
  },
]

const products: Product[] = [
  {
    id: 1,
    name: 'Whey Protein 1kg',
    category: 'supplement',
    priceKes: 4500,
    bgColor: 'bg-amber-100',
    icon: <Zap className="w-8 h-8 text-amber-600" />,
  },
  {
    id: 2,
    name: 'PHYZIQ Training Tee',
    category: 'apparel',
    priceKes: 1800,
    bgColor: 'bg-brand-100',
    icon: <Package className="w-8 h-8 text-brand-600" />,
  },
  {
    id: 3,
    name: 'Adjustable Dumbbells 20kg',
    category: 'equipment',
    priceKes: 12500,
    bgColor: 'bg-slate-100',
    icon: <Dumbbell className="w-8 h-8 text-slate-600" />,
  },
  {
    id: 4,
    name: 'Creatine Monohydrate',
    category: 'supplement',
    priceKes: 2200,
    bgColor: 'bg-blue-100',
    icon: <Zap className="w-8 h-8 text-blue-600" />,
  },
  {
    id: 5,
    name: 'Resistance Band Set',
    category: 'equipment',
    priceKes: 1400,
    bgColor: 'bg-orange-100',
    icon: <Dumbbell className="w-8 h-8 text-orange-600" />,
  },
  {
    id: 6,
    name: 'Compression Shorts',
    category: 'apparel',
    priceKes: 2400,
    bgColor: 'bg-indigo-100',
    icon: <Package className="w-8 h-8 text-indigo-600" />,
  },
]

const categoryColors: Record<ProductCategory, string> = {
  supplement: 'bg-amber-100 text-amber-700',
  apparel: 'bg-brand-100 text-brand-700',
  equipment: 'bg-slate-100 text-slate-700',
}

const dayStatusStyles: Record<DayStatus, string> = {
  completed: 'bg-brand-500 text-white border-brand-500',
  rebuilt: 'bg-amber-500 text-white border-amber-500',
  scheduled: 'bg-white text-slate-600 border-slate-300',
  rest: 'bg-slate-100 text-slate-400 border-slate-200',
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceChip({ label, color }: { label: string; color: 'green' | 'blue' | 'amber' }) {
  const colors = {
    green: 'bg-brand-100 text-brand-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', colors[color])}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', {
        'bg-brand-500': color === 'green',
        'bg-blue-500': color === 'blue',
        'bg-amber-500': color === 'amber',
      })} />
      {label}
    </span>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={clsx('w-3.5 h-3.5', i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')}
        />
      ))}
    </div>
  )
}

// ─── Section: Navbar ──────────────────────────────────────────────────────────

function Navbar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  const links = ['Today', 'Plans', 'Coach', 'Marketplace', 'Progress', 'Account']
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <span className="text-xl font-bold text-brand-600 tracking-tight">PHYZIQ</span>
          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <a key={l} href="#" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Log in</button>
            <button className="text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors">
              Get Started
            </button>
          </div>
          <button className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 px-4 py-3 flex flex-col gap-3 bg-white">
          {links.map((l) => (
            <a key={l} href="#" className="text-sm font-medium text-slate-700 py-1">
              {l}
            </a>
          ))}
          <button className="mt-2 w-full bg-brand-500 text-white text-sm font-semibold py-2 rounded-lg">
            Get Started
          </button>
        </div>
      )}
    </nav>
  )
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-3 py-1 mb-6">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs font-medium text-brand-300">AI-Powered Adaptive Coaching</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Your plan.{' '}
              <span className="text-brand-400">Built for how you</span>{' '}
              actually live.
            </h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              PHYZIQ adapts your workout and nutrition plan in real time — around missed sessions,
              travel, recovery, and life. Powered by AI, grounded in Kenyan context.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
                Start Free Preview <ChevronRight className="w-4 h-4" />
              </button>
              <button className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors">
                See how it works
              </button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-brand-400" /> M-Pesa native</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-brand-400" /> Offline-first</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-brand-400" /> Kenya DPA compliant</span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-brand-500/20 p-1.5 rounded-lg"><Dumbbell className="w-4 h-4 text-brand-400" /></div>
                  <span className="text-sm font-semibold">Today&apos;s Workout</span>
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">↻ Rebuilt</span>
              </div>
              <p className="text-slate-300 text-sm mb-1">Chest + Triceps — 4 exercises</p>
              <p className="text-xs text-slate-500 mb-3">Adapted after Monday&apos;s missed session</p>
              <div className="flex gap-2">
                <ConfidenceChip label="High confidence" color="green" />
                <ConfidenceChip label="Estimated" color="blue" />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500/20 p-1.5 rounded-lg"><Utensils className="w-4 h-4 text-blue-400" /></div>
                  <span className="text-sm font-semibold">Today&apos;s Nutrition</span>
                </div>
                <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">NCD-aware</span>
              </div>
              <p className="text-slate-300 text-sm mb-1">1,840 kcal · 3 meals planned</p>
              <p className="text-xs text-slate-500 mb-3">Low-GI options prioritised</p>
              <div className="flex gap-2">
                <ConfidenceChip label="Confirmed" color="green" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Today Dashboard ─────────────────────────────────────────────────

function TodayDashboard() {
  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Today&apos;s Dashboard</p>
          <h2 className="text-2xl font-bold text-slate-900">Good morning, Alex</h2>
          <p className="text-sm text-slate-500 mt-0.5">Tuesday — Plan adapted after Monday&apos;s missed session</p>
        </div>

        {/* Offline banner */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-6">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Offline</span>
          <span className="text-amber-700">— logged data will sync when connected</span>
        </div>

        {/* 3 summary cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-brand-50 p-2 rounded-xl"><Dumbbell className="w-4 h-4 text-brand-600" /></div>
                <span className="text-sm font-semibold text-slate-800">Workout</span>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Rebuilt
              </span>
            </div>
            <p className="font-semibold text-slate-900 mb-0.5">Chest + Triceps</p>
            <p className="text-sm text-slate-500">4 exercises · 45 min</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 p-2 rounded-xl"><Utensils className="w-4 h-4 text-blue-600" /></div>
                <span className="text-sm font-semibold text-slate-800">Meals</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">NCD-aware</span>
            </div>
            <p className="font-semibold text-slate-900 mb-0.5">1,840 kcal</p>
            <p className="text-sm text-slate-500">3 meals planned</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-rose-50 p-2 rounded-xl"><Heart className="w-4 h-4 text-rose-500" /></div>
                <span className="text-sm font-semibold text-slate-800">Recovery</span>
              </div>
            </div>
            <p className="font-semibold text-brand-600 text-xl mb-0.5">7.5 <span className="text-sm text-slate-400 font-normal">/ 10</span></p>
            <p className="text-sm text-slate-500">Good to train today</p>
          </div>
        </div>

        {/* Confidence chips row */}
        <div className="flex flex-wrap gap-2">
          <ConfidenceChip label="High confidence" color="green" />
          <ConfidenceChip label="Estimated" color="blue" />
          <ConfidenceChip label="Confirmed" color="green" />
        </div>
      </div>
    </section>
  )
}

// ─── Section: Weekly Plan Navigator ──────────────────────────────────────────

function WeeklyPlan() {
  const [selected, setSelected] = useState(1) // Tue

  return (
    <section className="py-10 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Weekly Plan</p>
        <div className="flex flex-wrap gap-2">
          {days.map((day, i) => (
            <button
              key={day.label}
              onClick={() => setSelected(i)}
              className={clsx(
                'flex flex-col items-center px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                selected === i
                  ? dayStatusStyles[day.status]
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300',
                selected !== i && day.status === 'rest' && 'opacity-60',
              )}
            >
              <span>{day.label}</span>
              {day.status === 'completed' && <CheckCircle className="w-3 h-3 mt-0.5 opacity-80" />}
              {day.status === 'rebuilt' && <RotateCcw className="w-3 h-3 mt-0.5 opacity-80" />}
              {day.status === 'rest' && <span className="text-xs mt-0.5">Rest</span>}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" /> Completed</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Rebuilt</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white border border-slate-300 inline-block" /> Scheduled</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200 inline-block" /> Rest</span>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Marketplace ─────────────────────────────────────────────────────

function Marketplace() {
  const [tab, setTab] = useState<MarketplaceTab>('coaches')
  const [cartAdded, setCartAdded] = useState<Set<number>>(new Set())

  function handleAddToCart(id: number) {
    setCartAdded((prev) => new Set(prev).add(id))
  }

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Marketplace</p>
            <h2 className="text-2xl font-bold text-slate-900">Coaches &amp; Products</h2>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setTab('coaches')}
              className={clsx('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'coaches' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50')}
            >
              <Users className="w-4 h-4" /> Coaches
            </button>
            <button
              onClick={() => setTab('products')}
              className={clsx('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'products' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50')}
            >
              <Package className="w-4 h-4" /> Products
            </button>
          </div>
        </div>

        {tab === 'coaches' && (
          <div className="grid sm:grid-cols-3 gap-4">
            {coaches.map((coach) => (
              <div key={coach.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0', coach.color)}>
                    {coach.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{coach.name}</p>
                    <span className="inline-block text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md mt-0.5">{coach.specialisation}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={coach.rating} />
                  <span className="text-xs text-slate-500">{coach.rating} ({coach.reviews})</span>
                  {coach.verified && (
                    <span className="ml-auto text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">KES {coach.priceKes.toLocaleString()}<span className="text-xs text-slate-400 font-normal"> / session</span></span>
                  <button className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    Book <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'products' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={clsx('flex items-center justify-center h-36', product.bgColor)}>
                  {product.icon}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-slate-900 text-sm leading-snug">{product.name}</p>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0', categoryColors[product.category])}>
                      {product.category}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 mb-3">KES {product.priceKes.toLocaleString()}</p>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className={clsx(
                      'w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors',
                      cartAdded.has(product.id)
                        ? 'bg-brand-50 text-brand-700 border border-brand-200'
                        : 'bg-brand-500 hover:bg-brand-600 text-white',
                    )}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {cartAdded.has(product.id) ? 'Added to cart' : 'Add to cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Section: AI Chat Preview ─────────────────────────────────────────────────

function AIChatPreview() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-brand-500" />
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">AI Coach</p>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Ask your coach anything</h2>
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 bg-white border-b border-slate-100 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">PHYZIQ AI</p>
                <p className="text-xs text-brand-500">Online</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-brand-500 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs">
                  I&apos;m travelling next week with no gym access. Can you adjust my plan?
                </div>
              </div>
              {/* AI response */}
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-800 text-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm shadow-sm">
                  <p className="mb-2">Of course! I&apos;ll rebuild next week as a hotel room / bodyweight block. Here&apos;s what I&apos;m planning:</p>
                  <ul className="text-xs text-slate-600 space-y-1 mb-3 list-disc list-inside">
                    <li>Mon–Wed: bodyweight HIIT (no equipment)</li>
                    <li>Thu: active recovery — stretch &amp; mobility</li>
                    <li>Fri: hotel pool swim or walk (30 min)</li>
                  </ul>
                  <ConfidenceChip label="Estimated — adapt as you go" color="blue" />
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 px-4 py-3 bg-white flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask your AI coach…"
                className="flex-1 text-sm text-slate-600 bg-transparent outline-none placeholder:text-slate-400"
                readOnly
              />
              <button className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-xl transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: M-Pesa Payment Flow ────────────────────────────────────────────

function MPesaPreview() {
  const [mpesaState, setMpesaState] = useState<MPesaState>('waiting')

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-brand-500" />
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">M-Pesa Payment</p>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Pay with M-Pesa</h2>

          {/* State tabs */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-4">
            {(['waiting', 'success', 'failed'] as MPesaState[]).map((s) => (
              <button
                key={s}
                onClick={() => setMpesaState(s)}
                className={clsx(
                  'flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors',
                  mpesaState === s ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-50',
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
            {mpesaState === 'waiting' && (
              <>
                <div className="w-16 h-16 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mx-auto mb-4" />
                <p className="font-semibold text-slate-900 mb-1">Waiting for M-Pesa confirmation</p>
                <p className="text-sm text-slate-500">Check your phone (+254 7XX XXX XXX) and enter your PIN to complete payment.</p>
                <p className="text-xs text-slate-400 mt-3">KES 1,500 · PHYZIQ Monthly Plan</p>
              </>
            )}
            {mpesaState === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-9 h-9 text-brand-500" />
                </div>
                <p className="font-semibold text-slate-900 mb-1">Payment confirmed!</p>
                <p className="text-sm text-slate-500">KES 1,500 received. Your plan is now active.</p>
                <p className="text-xs text-slate-400 mt-3">M-Pesa ref: QJD8XK201B</p>
              </>
            )}
            {mpesaState === 'failed' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <X className="w-9 h-9 text-red-500" />
                </div>
                <p className="font-semibold text-slate-900 mb-1">Payment failed</p>
                <p className="text-sm text-slate-500">The M-Pesa request timed out or was declined. Please try again.</p>
                <button className="mt-4 w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  Retry Payment
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Stats Bar ───────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: '4/5', label: 'Sessions', icon: <Dumbbell className="w-5 h-5 text-brand-500" /> },
    { value: '2', label: 'Adjusted', icon: <RotateCcw className="w-5 h-5 text-brand-500" /> },
    { value: '92%', label: 'Plan Completion', icon: <TrendingUp className="w-5 h-5 text-brand-500" /> },
    { value: '3.2kg', label: 'Lost', icon: <Heart className="w-5 h-5 text-brand-500" /> },
  ]

  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <p className="text-3xl font-bold text-brand-600 mb-0.5">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: Footer ──────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xl font-bold text-white mb-1">PHYZIQ</p>
            <p className="text-sm">Built for how you actually live.</p>
            <p className="text-sm mt-1">🇰🇪 Nairobi, Kenya</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">ODPC Compliance</a>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-800 text-xs text-slate-600">
          © {new Date().getFullYear()} PHYZIQ. All rights reserved. Regulated under Kenya Data Protection Act 2019.
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <Navbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main>
        <Hero />
        <StatsBar />
        <TodayDashboard />
        <WeeklyPlan />
        <Marketplace />
        <AIChatPreview />
        <MPesaPreview />
      </main>
      <Footer />
    </>
  )
}
