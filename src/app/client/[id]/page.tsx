'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { supabase, Client, Payment, Document } from '@/lib/supabase'
import { formatCurrency, formatDate, formatFileSize } from '@/lib/utils'
import { ArrowLeft, Phone, Mail, Building, FileText, CreditCard, Download, Trash2, File, Plus } from 'lucide-react'
import Link from 'next/link'

export default function ClientProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [cRes, pRes, dRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).single(),
        supabase.from('payments').select('*').eq('client_id', id).order('payment_date', { ascending: false }),
        supabase.from('documents').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      ])
      setClient(cRes.data)
      setPayments(pRes.data || [])
      setDocuments(dRes.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  const handleDownload = async (doc: Document) => {
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 60)
    if (data) window.open(data.signedUrl, '_blank')
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Delete this payment?')) return
    await supabase.from('payments').delete().eq('id', paymentId)
    setPayments(payments.filter(p => p.id !== paymentId))
  }

  if (loading) return (
    <AppLayout>
      <div className="p-8 text-center text-slate-400">Loading client profile...</div>
    </AppLayout>
  )

  if (!client) return (
    <AppLayout>
      <div className="p-8 text-center text-slate-400">Client not found</div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        {/* Back */}
        <Link href="/clients" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Clients
        </Link>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-2xl text-brand-700">{client.name.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl text-slate-900 mb-1">{client.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                {client.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{client.phone}</span>}
                {client.email && <span className="flex items-center gap-1.5"><Mail size={14} />{client.email}</span>}
                {client.property && <span className="flex items-center gap-1.5"><Building size={14} />{client.property}</span>}
              </div>
              {client.notes && <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{client.notes}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Total Paid</p>
              <p className="font-display font-bold text-2xl text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payments */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-slate-400" />
                <h2 className="font-display font-semibold text-slate-900">Payment History</h2>
                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{payments.length}</span>
              </div>
              <Link href="/payments" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
                <Plus size={13} /> Add
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {payments.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400 text-center">No payments recorded</p>
              ) : payments.map(p => (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-900 text-sm">{formatCurrency(p.amount)}</span>
                      <span className={`badge-${p.status.toLowerCase()}`}>{p.status}</span>
                    </div>
                    <div className="text-xs text-slate-400">{formatDate(p.payment_date)} · {p.method}</div>
                    {p.notes && <div className="text-xs text-slate-400 mt-0.5">{p.notes}</div>}
                  </div>
                  <button onClick={() => handleDeletePayment(p.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                <h2 className="font-display font-semibold text-slate-900">Documents</h2>
                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{documents.length}</span>
              </div>
              <Link href="/documents" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
                <Plus size={13} /> Upload
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {documents.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400 text-center">No documents uploaded</p>
              ) : documents.map(doc => (
                <div key={doc.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <File size={13} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{doc.name}</div>
                      <div className="text-xs text-slate-400">{doc.type} · {formatFileSize(doc.file_size)}</div>
                    </div>
                  </div>
                  <button onClick={() => handleDownload(doc)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-600 transition-colors flex-shrink-0">
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
