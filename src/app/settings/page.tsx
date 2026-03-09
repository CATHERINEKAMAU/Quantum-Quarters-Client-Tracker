'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase } from '@/lib/supabase'
import { User, Mail, Shield, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState<{ email: string | undefined; id: string | undefined } | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser({ email: data.user?.email, id: data.user?.id })
    })
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setMessage('Passwords do not match'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) setMessage('Error: ' + error.message)
    else { setMessage('Password updated successfully!'); setPassword(''); setConfirmPassword('') }
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account settings</p>
        </div>

        {/* Account Info */}
        <div className="card p-6 mb-6">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User size={16} className="text-slate-400" /> Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Mail size={16} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Email address</p>
                <p className="text-sm font-medium text-slate-900">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Shield size={16} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">User ID</p>
                <p className="text-sm font-mono text-slate-600">{user?.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield size={16} className="text-slate-400" /> Change Password
          </h2>
          {message && (
            <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <CheckCircle size={15} /> {message}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
