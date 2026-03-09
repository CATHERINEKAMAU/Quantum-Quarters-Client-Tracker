'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, CreditCard, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Stats = {
  totalClients: number
  totalPayments: number
  totalAmount: number
  recentPayments: Array<{
    id: string
    amount: number
    payment_date: string
    status: string
    method: string
    clients: { name: string; property: string } | null
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalPayments: 0,
    totalAmount: 0,
    recentPayments: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const [clientsRes, paymentsRes, recentRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('amount'),
        supabase.from('payments')
          .select('id, amount, payment_date, status, method, clients(name, property)')
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      const totalAmount = (paymentsRes.data || []).reduce((sum, p) => sum + (p.amount || 0), 0)

      setStats({
        totalClients: clientsRes.count || 0,
        totalPayments: (paymentsRes.data || []).length,
        totalAmount,
        recentPayments: (recentRes.data || []) as unknown as Stats['recentPayments'],
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  const statCards = [
    { label: 'Total Clients', value: stats.totalClients, icon: Users, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
    { label: 'Total Payments', value: stats.totalPayments, icon: CreditCard, color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
    { label: 'Total Collected', value: formatCurrency(stats.totalAmount), icon: TrendingUp, color: 'bg-violet-50 text-violet-600', iconBg: 'bg-violet-100' },
  ]

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of your client payments and activity</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{card.label}</p>
                    <p className="font-display font-bold text-2xl text-slate-900">
                      {loading ? '—' : card.value}
                    </p>
                  </div>
                  <div className={`${card.iconBg} p-2.5 rounded-lg`}>
                    <Icon size={20} className={card.color.split(' ')[1]} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <h2 className="font-display font-semibold text-slate-900">Recent Payments</h2>
            </div>
            <Link href="/payments" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : stats.recentPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No payments recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Property</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Method</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-medium text-slate-900">{payment.clients?.name || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{payment.clients?.property || '—'}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-900">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{formatDate(payment.payment_date)}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{payment.method}</td>
                      <td className="px-6 py-3.5">
                        <span className={`badge-${payment.status.toLowerCase()}`}>{payment.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
