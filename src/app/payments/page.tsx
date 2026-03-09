'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase, Payment, Client } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Edit2, CreditCard } from 'lucide-react'

const METHODS = ['Cash', 'Bank Transfer', 'Mobile Money'] as const
const STATUSES = ['Deposit', 'Partial', 'Full'] as const

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [form, setForm] = useState({
    client_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0],
    method: 'Cash' as typeof METHODS[number], status: 'Deposit' as typeof STATUSES[number], notes: ''
  })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    const [pRes, cRes] = await Promise.all([
      supabase.from('payments').select('*, clients(name, property)').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
    ])
    setPayments((pRes.data || []) as Payment[])
    setClients(cRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = payments.filter(p =>
    (p.clients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.clients?.property || '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditingPayment(null)
    setForm({ client_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], method: 'Cash', status: 'Deposit', notes: '' })
    setShowModal(true)
  }

  const openEdit = (p: Payment) => {
    setEditingPayment(p)
    setForm({ client_id: p.client_id, amount: String(p.amount), payment_date: p.payment_date.split('T')[0], method: p.method, status: p.status, notes: p.notes })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, amount: parseFloat(form.amount) }
    if (editingPayment) {
      await supabase.from('payments').update(payload).eq('id', editingPayment.id)
    } else {
      await supabase.from('payments').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchData()
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900">Payments</h1>
            <p className="text-slate-500 text-sm mt-1">Track all client payments</p>
          </div>
          <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Record Payment</button>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by client or property..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 max-w-sm" />
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard size={20} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">No payments found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Client', 'Amount', 'Date', 'Method', 'Status', 'Notes', ''].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 text-sm">{p.clients?.name || '—'}</div>
                      <div className="text-xs text-slate-400">{p.clients?.property || ''}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 text-sm">{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(p.payment_date)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{p.method}</td>
                    <td className="px-6 py-4">
                      <span className={`badge-${p.status.toLowerCase()}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 max-w-[200px] truncate">{p.notes || '—'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-display font-bold text-lg text-slate-900">{editingPayment ? 'Edit Payment' : 'Record Payment'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Client *</label>
                <select className="input-field" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (USD) *</label>
                  <input type="number" step="0.01" min="0" className="input-field" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Payment Date *</label>
                  <input type="date" className="input-field" value={form.payment_date} onChange={e => setForm({...form, payment_date: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Method</label>
                  <select className="input-field" value={form.method} onChange={e => setForm({...form, method: e.target.value as typeof METHODS[number]})}>
                    {METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value as typeof STATUSES[number]})}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea rows={2} className="input-field resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Saving...' : editingPayment ? 'Save Changes' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
