import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, usersAPI } from '@/api/axios';
import { Save, Upload, Building2, Mail, Percent, Bell, Plus, X, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('company');

  // Settings
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsAPI.get().then(r => r.data.data) });

  const [form, setForm] = useState({});
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (d) => settingsAPI.update(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings saved'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const logoMutation = useMutation({
    mutationFn: (f) => { const fd = new FormData(); fd.append('logo', f); return settingsAPI.uploadLogo(fd); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); toast.success('Logo uploaded'); },
  });

  // Users
  const { data: usersData } = useQuery({ queryKey: ['all-users'], queryFn: () => usersAPI.getAll({ limit: 100 }).then(r => r.data.data.users) });
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'AGENT', phone: '' });

  const createUserMutation = useMutation({
    mutationFn: (d) => usersAPI.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-users'] }); setShowCreateUser(false); setUserForm({ name: '', email: '', password: '', role: 'AGENT', phone: '' }); toast.success('User created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => usersAPI.deactivate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-users'] }); toast.success('User status updated'); },
  });

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'smtp', label: 'Email (SMTP)', icon: Mail },
    { id: 'commission', label: 'Commission', icon: Percent },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'users', label: 'User Management', icon: UserCog },
  ];

  if (isLoading) return <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-sm text-gray-500">Manage your CRM configuration</p></div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Nav */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-card p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t.id ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white rounded-xl shadow-card p-6 animate-fade-in">
          {activeTab === 'company' && (
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ companyName: form.companyName, address: form.address, contactEmail: form.contactEmail, contactPhone: form.contactPhone }); }} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Profile</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {form.logo ? <img src={form.logo} alt="Logo" className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-gray-400" />}
                </div>
                <label className="cursor-pointer px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                  <Upload className="w-4 h-4" /> Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && logoMutation.mutate(e.target.files[0])} />
                </label>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input value={form.companyName || ''} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="input-base" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-base" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input value={form.contactEmail || ''} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.contactPhone || ''} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="input-base" /></div>
              </div>
              <button type="submit" disabled={updateMutation.isPending} className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"><Save className="w-4 h-4" /> Save Changes</button>
            </form>
          )}

          {activeTab === 'smtp' && (
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ smtpHost: form.smtpHost, smtpPort: Number(form.smtpPort), smtpUser: form.smtpUser, smtpPass: form.smtpPass }); }} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>
              <p className="text-sm text-gray-500 mb-4">Configure SMTP settings for sending emails. These override .env defaults.</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label><input value={form.smtpHost || ''} onChange={e => setForm(f => ({ ...f, smtpHost: e.target.value }))} className="input-base" placeholder="smtp.gmail.com" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Port</label><input type="number" value={form.smtpPort || 587} onChange={e => setForm(f => ({ ...f, smtpPort: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input value={form.smtpUser || ''} onChange={e => setForm(f => ({ ...f, smtpUser: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" value={form.smtpPass || ''} onChange={e => setForm(f => ({ ...f, smtpPass: e.target.value }))} className="input-base" /></div>
              </div>
              <button type="submit" disabled={updateMutation.isPending} className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"><Save className="w-4 h-4" /> Save SMTP Settings</button>
            </form>
          )}

          {activeTab === 'commission' && (
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ defaultCommissionResidential: Number(form.defaultCommissionResidential), defaultCommissionCommercial: Number(form.defaultCommissionCommercial), defaultCommissionPlot: Number(form.defaultCommissionPlot) }); }} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Defaults</h3>
              <p className="text-sm text-gray-500 mb-4">Set default commission percentages by property type.</p>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Residential (%)</label><input type="number" step="0.1" value={form.defaultCommissionResidential || 2.5} onChange={e => setForm(f => ({ ...f, defaultCommissionResidential: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Commercial (%)</label><input type="number" step="0.1" value={form.defaultCommissionCommercial || 2} onChange={e => setForm(f => ({ ...f, defaultCommissionCommercial: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Plot (%)</label><input type="number" step="0.1" value={form.defaultCommissionPlot || 1.5} onChange={e => setForm(f => ({ ...f, defaultCommissionPlot: e.target.value }))} className="input-base" /></div>
              </div>
              <button type="submit" disabled={updateMutation.isPending} className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"><Save className="w-4 h-4" /> Save Commission Rates</button>
            </form>
          )}

          {activeTab === 'notifications' && (
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ notifyOnNewLead: form.notifyOnNewLead, notifyOnDealClosed: form.notifyOnDealClosed, notifyOnFollowUpDue: form.notifyOnFollowUpDue }); }} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: 'notifyOnNewLead', label: 'New Lead Created', desc: 'Send email when a new lead is added to the system' },
                  { key: 'notifyOnDealClosed', label: 'Deal Closed', desc: 'Send email when a deal is marked as closed' },
                  { key: 'notifyOnFollowUpDue', label: 'Follow-up Due', desc: 'Send reminder when a follow-up is due' },
                ].map(pref => (
                  <div key={pref.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                    <div><p className="text-sm font-medium text-gray-900">{pref.label}</p><p className="text-xs text-gray-500 mt-0.5">{pref.desc}</p></div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, [pref.key]: !f[pref.key] }))} className={`relative w-11 h-6 rounded-full transition-colors ${form[pref.key] ? 'bg-accent' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[pref.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="submit" disabled={updateMutation.isPending} className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"><Save className="w-4 h-4" /> Save Preferences</button>
            </form>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <button onClick={() => setShowCreateUser(true)} className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add User</button>
              </div>
              <div className="divide-y divide-gray-100">
                {(usersData || []).map(u => (
                  <div key={u._id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white ${u.role === 'ADMIN' ? 'bg-red-500' : u.role === 'MANAGER' ? 'bg-purple-500' : 'bg-accent'}`}>{u.name?.[0]}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.name} <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                      <button onClick={() => deactivateMutation.mutate(u._id)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateUser(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Create User</h3><button onClick={() => setShowCreateUser(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
            <form onSubmit={e => { e.preventDefault(); createUserMutation.mutate(userForm); }} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} className="input-base" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} className="input-base" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label><input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} className="input-base" required minLength={6} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} className="input-base"><option value="AGENT">Agent</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={userForm.phone} onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))} className="input-base" /></div>
              </div>
              <div className="flex gap-3"><button type="button" onClick={() => setShowCreateUser(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button><button type="submit" disabled={createUserMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50">{createUserMutation.isPending ? 'Creating...' : 'Create User'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
