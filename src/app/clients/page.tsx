'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase, Client } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { Plus, Search, Edit2, Trash2, Eye, Phone, Mail, Building } from 'lucide-react'
import Link from 'next/link'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', property: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchClients = async () => {
    const q = supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (search) q.ilike('name', `%${search}%`)
    const { data } = await q
    setClients(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [search])

  const openAdd = () => {
    setEditingClient(null)
    setForm({ name: '', phone: '', email: '', property: '', notes: '' })
    setShowModal(true)
  }

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setForm({ name: client.name, phone: client.phone, email: client.email, property: client.property, notes: client.notes })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (editingClient) {
      await supabase.from('clients').update(form).eq('id', editingClient.id)
    } else {
      await supabase.from('clients').insert(form)
    }
    setSaving(false)
    setShowModal(false)
    fetchClients()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client? This will also delete their payments and documents.')) return
    await supabase.from('clients').delete().eq('id', id)
    fetchClients()
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900">Clients</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your client records</p>
          </div>
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> Add Client
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 max-w-sm"
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building size={20} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">No clients found</p>
              <button onClick={openAdd} className="btn-primary mt-4 mx-auto">
                <Plus size={16} /> Add your first client
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Property</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date Added</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-700 font-semibold text-sm">{client.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-slate-900 text-sm">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-slate-600 flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" /> {client.phone}
                        </span>
                        <span className="text-sm text-slate-500 flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" /> {client.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{client.property || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(client.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/client/${client.id}`} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors">
                          <Eye size={15} />
                        </Link>
                        <button onClick={() => openEdit(client)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(client.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-display font-bold text-lg text-slate-900">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full Name *</label>
                  <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="John Doe" />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 234 567 8900" />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@example.com" />
                </div>
                <div className="col-span-2">
                  <label className="label">Property Purchased / Interested In</label>
                  <input className="input-field" value={form.property} onChange={e => setForm({...form, property: e.target.value})} placeholder="e.g. Quantum Heights Unit 4B" />
                </div>
                <div className="col-span-2">
                  <label className="label">Notes</label>
                  <textarea rows={3} className="input-field resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any additional notes..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Saving...' : editingClient ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
