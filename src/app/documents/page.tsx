'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase, Document, Client } from '@/lib/supabase'
import { formatDate, formatFileSize } from '@/lib/utils'
import { Upload, Download, Eye, FileText, Search, File, Trash2 } from 'lucide-react'

const DOC_TYPES = ['Receipt', 'Agreement', 'Identification', 'Property', 'Other'] as const

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ client_id: '', type: 'Receipt' as typeof DOC_TYPES[number], name: '' })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const fetchData = async () => {
    const [dRes, cRes] = await Promise.all([
      supabase.from('documents').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
    ])
    setDocuments((dRes.data || []) as Document[])
    setClients(cRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.clients?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${form.client_id}/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage.from('documents').upload(path, file)
    if (uploadErr) { alert('Upload failed: ' + uploadErr.message); setUploading(false); return }

    await supabase.from('documents').insert({
      client_id: form.client_id,
      type: form.type,
      name: form.name || file.name,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    })
    setUploading(false)
    setShowModal(false)
    setFile(null)
    setForm({ client_id: '', type: 'Receipt', name: '' })
    fetchData()
  }

  const handleDownload = async (doc: Document) => {
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 60)
    if (data) window.open(data.signedUrl, '_blank')
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm('Delete this document?')) return
    await supabase.storage.from('documents').remove([doc.file_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    fetchData()
  }

  const typeColors: Record<string, string> = {
    Receipt: 'bg-emerald-50 text-emerald-700',
    Agreement: 'bg-blue-50 text-blue-700',
    Identification: 'bg-purple-50 text-purple-700',
    Property: 'bg-amber-50 text-amber-700',
    Other: 'bg-slate-100 text-slate-600',
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900">Documents</h1>
            <p className="text-slate-500 text-sm mt-1">Upload and manage client documents</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Upload size={16} /> Upload Document</button>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 max-w-sm" />
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText size={20} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">No documents uploaded yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Document', 'Client', 'Type', 'Size', 'Uploaded', ''].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <File size={15} className="text-slate-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{doc.clients?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${typeColors[doc.type] || typeColors.Other}`}>{doc.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatFileSize(doc.file_size)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(doc.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleDownload(doc)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-600 transition-colors" title="Download">
                          <Download size={15} />
                        </button>
                        <button onClick={() => handleDelete(doc)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Delete">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-display font-bold text-lg text-slate-900">Upload Document</h2>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="label">Client *</label>
                <select className="input-field" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Document Type</label>
                <select className="input-field" value={form.type} onChange={e => setForm({...form, type: e.target.value as typeof DOC_TYPES[number]})}>
                  {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Document Name (optional)</label>
                <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Leave blank to use file name" />
              </div>
              <div>
                <label className="label">File *</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-brand-300 transition-colors">
                  <input type="file" id="file-input" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} required />
                  <label htmlFor="file-input" className="cursor-pointer">
                    {file ? (
                      <div className="text-sm text-slate-700 font-medium">{file.name}<br /><span className="text-xs text-slate-400">{formatFileSize(file.size)}</span></div>
                    ) : (
                      <div>
                        <Upload size={20} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500">Click to choose file</p>
                        <p className="text-xs text-slate-400">PDF, JPG, PNG, DOCX...</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setFile(null) }} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary flex-1 justify-center">
                  {uploading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
