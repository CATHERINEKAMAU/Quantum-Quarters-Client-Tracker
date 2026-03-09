'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase } from '@/lib/supabase'
import { FileSpreadsheet, CheckCircle, X, Download } from 'lucide-react'

type ParsedRow = {
  name: string
  parcel: string
  sales: number
  amountPaid: number
  balance: number
  dueDate: string
  valid: boolean
  error?: string
}

export default function ImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const [summary, setSummary] = useState({ clients: 0, payments: 0 })
  const [fileName, setFileName] = useState('')

  const parseNumber = (val: string): number => {
    if (!val) return 0
    const cleaned = String(val).replace(/[^0-9.]/g, '')
    return parseFloat(cleaned) || 0
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setImported(false)
    setRows([])

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const delimiter = lines[0].includes('\t') ? '\t' : ','
    const parsed: ParsedRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''))
      const name = cols[0]?.trim()
      const parcel = cols[1]?.trim()
      const sales = parseNumber(cols[2])
      const amountPaid = parseNumber(cols[3])
      const balance = parseNumber(cols[4])
      const dueDate = cols[5]?.trim() || ''

      if (!name || !parcel || parcel.includes('PARCELS')) continue
      if (name.toLowerCase().includes('total')) continue

      parsed.push({
        name, parcel, sales, amountPaid, balance, dueDate,
        valid: !!name && !!parcel,
        error: !name ? 'Missing name' : !parcel ? 'Missing parcel' : undefined
      })
    }
    setRows(parsed)
  }

  const handleImport = async () => {
    setImporting(true)
    let clientCount = 0
    let paymentCount = 0

    for (const row of rows) {
      if (!row.valid) continue

      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .insert({
          name: row.name,
          phone: '',
          email: '',
          property: row.parcel,
          notes: row.dueDate ? `Due date: ${row.dueDate}` : '',
        })
        .select()
        .single()

      if (clientErr || !client) continue
      clientCount++

      if (row.amountPaid > 0) {
        const { error: payErr } = await supabase.from('payments').insert({
          client_id: client.id,
          amount: row.amountPaid,
          payment_date: new Date().toISOString().split('T')[0],
          method: 'Bank Transfer',
          status: row.balance === 0 ? 'Full' : 'Partial',
          notes: `Sales price: KSh ${row.sales.toLocaleString()}. Balance: KSh ${row.balance.toLocaleString()}${row.dueDate ? `. Due: ${row.dueDate}` : ''}`,
        })
        if (!payErr) paymentCount++
      }
    }

    setSummary({ clients: clientCount, payments: paymentCount })
    setImporting(false)
    setImported(true)
  }

  const validRows = rows.filter(r => r.valid)
  const invalidRows = rows.filter(r => !r.valid)

  const downloadTemplate = () => {
    const csv = `CLIENT NAME\tPARCEL NUMBER\tSALES\tAMOUNT PAID\tOUTSTANDING BALANCE\tDUE DATES\nJohn Doe\t12345\t500000\t250000\t250000\t1ST JAN 2025`
    const blob = new Blob([csv], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import_template.tsv'
    a.click()
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-slate-900">Import from Excel</h1>
          <p className="text-slate-500 text-sm mt-1">Upload your Excel file to bulk import clients and payments</p>
        </div>

        {/* Instructions */}
        <div className="card p-5 mb-6" style={{background:'#eff6ff', borderColor:'#bfdbfe'}}>
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <FileSpreadsheet size={16} /> How to prepare your file
          </h3>
          <p className="text-sm text-blue-800 mb-3">Your file must have these columns in this exact order:</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-1 text-xs mb-3">
            {['CLIENT NAME', 'PARCEL NUMBER', 'SALES', 'AMOUNT PAID', 'OUTSTANDING BALANCE', 'DUE DATES'].map((col, i) => (
              <div key={col} className="bg-blue-100 text-blue-800 rounded px-2 py-1.5 text-center font-medium">
                <div className="text-blue-400 mb-0.5 text-xs">Col {String.fromCharCode(65+i)}</div>
                {col}
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 font-medium mb-2">⚠️ For .xls/.xlsx files: open in Excel → File → Save As → CSV (Comma delimited)</p>
          <button onClick={downloadTemplate} className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 font-medium">
            <Download size={13} /> Download blank template
          </button>
        </div>

        {/* Upload */}
        <div className="card p-6 mb-6">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-brand-300 transition-colors">
            <input type="file" id="import-file" className="hidden" accept=".csv,.tsv,.txt" onChange={handleFile} />
            <label htmlFor="import-file" className="cursor-pointer">
              <FileSpreadsheet size={32} className="mx-auto text-slate-300 mb-3" />
              {fileName ? (
                <div>
                  <p className="font-medium text-slate-700">{fileName}</p>
                  <p className="text-sm text-slate-400 mt-1">{rows.length} rows detected — click to change file</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-600">Click to upload your CSV file</p>
                  <p className="text-sm text-slate-400 mt-1">Save your Excel as CSV first, then upload here</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Preview */}
        {rows.length > 0 && !imported && (
          <div className="card mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-display font-semibold text-slate-900">Preview</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="text-emerald-600 font-medium">{validRows.length} valid rows</span>
                  {invalidRows.length > 0 && <span className="text-red-500 font-medium ml-2">{invalidRows.length} will be skipped</span>}
                </p>
              </div>
              <button onClick={handleImport} disabled={importing || validRows.length === 0} className="btn-primary">
                {importing && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {importing ? 'Importing...' : `Import ${validRows.length} Records`}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['', 'Client Name', 'Parcel No.', 'Sales Price', 'Amount Paid', 'Balance', 'Due Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((row, i) => (
                    <tr key={i} className={`${!row.valid ? 'bg-red-50' : 'hover:bg-slate-50'} transition-colors`}>
                      <td className="px-4 py-3">
                        {row.valid ? <CheckCircle size={15} className="text-emerald-500" /> : <X size={15} className="text-red-400" />}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.parcel}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">KSh {row.sales.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 font-medium">KSh {row.amountPaid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-amber-600 font-medium">KSh {row.balance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{row.dueDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Success */}
        {imported && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-2">Import Successful!</h2>
            <p className="text-slate-500 mb-6">Your data has been imported into the system</p>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="font-display font-bold text-3xl text-brand-600">{summary.clients}</p>
                <p className="text-sm text-slate-500">Clients Added</p>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-3xl text-emerald-600">{summary.payments}</p>
                <p className="text-sm text-slate-500">Payments Recorded</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <a href="/clients" className="btn-primary">View Clients</a>
              <button onClick={() => { setRows([]); setImported(false); setFileName('') }} className="btn-secondary">Import Another File</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
