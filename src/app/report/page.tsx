'use client'

import { useState, useRef } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase, Client, Payment, Document } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Printer, Building2, Phone, Mail, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function ReportPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Client[]>([])
  const [selected, setSelected] = useState<Client | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,property.ilike.%${query}%`)
      .limit(10)
    setResults(data || [])
    setSearching(false)
  }

  const loadClient = async (client: Client) => {
    setSelected(client)
    setResults([])
    setQuery(client.name)
    setLoading(true)
    const [pRes, dRes] = await Promise.all([
      supabase.from('payments').select('*').eq('client_id', client.id).order('payment_date', { ascending: true }),
      supabase.from('documents').select('*').eq('client_id', client.id),
    ])
    setPayments(pRes.data || [])
    setDocuments(dRes.data || [])
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const salesPrice = payments.length > 0
    ? payments.reduce((max, p) => {
        const notes = p.notes || ''
        const match = notes.match(/Sales price: KSh ([\d,]+)/)
        if (match) return Math.max(max, parseInt(match[1].replace(/,/g, '')))
        return max
      }, 0)
    : 0
  const balance = salesPrice > 0 ? salesPrice - totalPaid : 0
  const paymentStatus = balance <= 0 ? 'Cleared' : totalPaid === 0 ? 'Unpaid' : 'Partial'

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl print:hidden-controls">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900">Client Report</h1>
            <p className="text-slate-500 text-sm mt-1">Search for a client and print their transaction report</p>
          </div>
          {selected && (
            <button onClick={handlePrint} className="btn-primary">
              <Printer size={16} /> Print Report
            </button>
          )}
        </div>

        {/* Search */}
        <div className="card p-5 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by client name, phone, or property..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
                className="input-field pl-9"
              />
            </div>
            <button type="submit" disabled={searching} className="btn-primary">
              {searching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={16} />}
              Search
            </button>
          </form>

          {/* Search Results Dropdown */}
          {results.length > 0 && (
            <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden shadow-lg">
              {results.map(client => (
                <button
                  key={client.id}
                  onClick={() => loadClient(client)}
                  className="w-full text-left px-4 py-3 hover:bg-brand-50 border-b border-slate-100 last:border-0 transition-colors"
                >
                  <div className="font-medium text-slate-900 text-sm">{client.name}</div>
                  <div className="text-xs text-slate-400">{client.property} {client.phone && `· ${client.phone}`}</div>
                </button>
              ))}
            </div>
          )}

          {results.length === 0 && query && !searching && !selected && (
            <p className="text-sm text-slate-400 mt-2 px-1">No clients found. Try a different name.</p>
          )}
        </div>

        {/* Report Preview */}
        {loading && (
          <div className="card p-8 text-center text-slate-400 text-sm">Loading client data...</div>
        )}

        {selected && !loading && (
          <div ref={printRef} id="print-area">
            {/* Print Styles */}
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #print-area, #print-area * { visibility: visible; }
                #print-area { position: fixed; left: 0; top: 0; width: 100%; }
                .no-print { display: none !important; }
              }
            `}</style>

            {/* Report Card */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              
              {/* Report Header */}
              <div className="bg-brand-700 px-8 py-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Building2 size={20} className="text-white" />
                      </div>
                      <div>
                        <h1 className="font-display font-bold text-xl">Quantum Quarters</h1>
                        <p className="text-brand-200 text-xs">Real Estate Company</p>
                      </div>
                    </div>
                    <h2 className="font-display font-bold text-2xl mt-2">Client Transaction Report</h2>
                    <p className="text-brand-200 text-sm mt-1">Generated on {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                      paymentStatus === 'Cleared' ? 'bg-emerald-500 text-white' :
                      paymentStatus === 'Partial' ? 'bg-amber-400 text-amber-900' :
                      'bg-red-400 text-white'
                    }`}>
                      {paymentStatus === 'Cleared' ? <CheckCircle size={14} /> : 
                       paymentStatus === 'Partial' ? <Clock size={14} /> : 
                       <AlertCircle size={14} />}
                      {paymentStatus}
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Details */}
              <div className="px-8 py-6 border-b border-slate-100">
                <h3 className="font-display font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider text-slate-400">Client Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Full Name</p>
                    <p className="font-semibold text-slate-900">{selected.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Property / Parcel</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />{selected.property || '—'}
                    </p>
                  </div>
                  {selected.phone && (
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Phone</p>
                      <p className="text-slate-700 flex items-center gap-1.5"><Phone size={13} className="text-slate-400" />{selected.phone}</p>
                    </div>
                  )}
                  {selected.email && (
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Email</p>
                      <p className="text-slate-700 flex items-center gap-1.5"><Mail size={13} className="text-slate-400" />{selected.email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Date Added</p>
                    <p className="text-slate-700">{formatDate(selected.created_at)}</p>
                  </div>
                  {selected.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 mb-0.5">Notes</p>
                      <p className="text-slate-700">{selected.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 mb-4">Financial Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  {salesPrice > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <p className="text-xs text-slate-400 mb-1">Total Sales Price</p>
                      <p className="font-display font-bold text-xl text-slate-900">{formatCurrency(salesPrice)}</p>
                    </div>
                  )}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1">Total Amount Paid</p>
                    <p className="font-display font-bold text-xl text-emerald-600">{formatCurrency(totalPaid)}</p>
                  </div>
                  {salesPrice > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <p className="text-xs text-slate-400 mb-1">Outstanding Balance</p>
                      <p className={`font-display font-bold text-xl ${balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {balance > 0 ? formatCurrency(balance) : 'Cleared'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="px-8 py-6 border-b border-slate-100">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 mb-4">Payment History</h3>
                {payments.length === 0 ? (
                  <p className="text-slate-400 text-sm">No payments recorded</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">#</th>
                        <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Date</th>
                        <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                        <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Method</th>
                        <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, i) => (
                        <tr key={p.id} className="border-b border-slate-100">
                          <td className="py-3 text-sm text-slate-400">{i + 1}</td>
                          <td className="py-3 text-sm text-slate-700">{formatDate(p.payment_date)}</td>
                          <td className="py-3 text-sm font-semibold text-slate-900">{formatCurrency(p.amount)}</td>
                          <td className="py-3 text-sm text-slate-600">{p.method}</td>
                          <td className="py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              p.status === 'Full' ? 'bg-emerald-100 text-emerald-700' :
                              p.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>{p.status}</span>
                          </td>
                          <td className="py-3 text-xs text-slate-400 max-w-[200px] truncate">{p.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300">
                        <td colSpan={2} className="py-3 text-sm font-bold text-slate-900">TOTAL</td>
                        <td className="py-3 text-sm font-bold text-emerald-600">{formatCurrency(totalPaid)}</td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* Documents */}
              {documents.length > 0 && (
                <div className="px-8 py-6 border-b border-slate-100">
                  <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 mb-4">Documents on File</h3>
                  <div className="flex flex-wrap gap-2">
                    {documents.map(doc => (
                      <span key={doc.id} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
                        {doc.type}: {doc.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-8 py-5 bg-slate-50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">This report was generated by Quantum Quarters Client Payment Tracker</p>
                  <p className="text-xs text-slate-400">Confidential — Internal Use Only</p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-slate-400 mb-8">Authorized Signature</p>
                    <div className="border-t border-slate-300 pt-1">
                      <p className="text-xs text-slate-400">Quantum Quarters Representative</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-8">Client Acknowledgement</p>
                    <div className="border-t border-slate-300 pt-1">
                      <p className="text-xs text-slate-400">{selected.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
