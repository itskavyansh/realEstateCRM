import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI, usersAPI } from '@/api/axios';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, getStatusColor, getInitials } from '@/lib/utils';
import { Plus, Search, Filter, Upload, Download, ChevronLeft, ChevronRight, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CLOSED', 'LOST'];
const SOURCES = ['WEBSITE', 'AD', 'REFERRAL', 'CALL', 'WALKIN'];

export default function LeadsPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', source: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', budgetMin: 0, budgetMax: 0, source: 'WEBSITE', status: 'NEW', notes: '', assignedAgent: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, filters],
    queryFn: () => leadsAPI.getAll({ page, limit: 15, ...filters }).then(r => r.data.data),
  });

  const agents = useQuery({
    queryKey: ['agents-list'],
    queryFn: () => usersAPI.getAll({ role: 'AGENT', limit: 100 }).then(r => r.data.data.users),
    enabled: hasRole('ADMIN', 'MANAGER'),
  });

  const createMutation = useMutation({
    mutationFn: (d) => leadsAPI.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setShowCreate(false); setForm({ name: '', phone: '', email: '', budgetMin: 0, budgetMax: 0, source: 'WEBSITE', status: 'NEW', notes: '', assignedAgent: '' }); toast.success('Lead created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: (d) => leadsAPI.bulkStatus(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setSelected([]); toast.success('Status updated'); },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (d) => leadsAPI.bulkAssign(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setSelected([]); setShowBulkAssign(false); toast.success('Leads assigned'); },
  });

  const handleCSVImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('csv', file);
    leadsAPI.importCSV(formData)
      .then(() => { queryClient.invalidateQueries({ queryKey: ['leads'] }); toast.success('Leads imported'); })
      .catch(() => toast.error('Import failed'));
    e.target.value = '';
  };

  const handleExportCSV = () => {
    if (!data?.leads) return;
    const csv = Papa.unparse(data.leads.map(l => ({
      Name: l.name, Phone: l.phone, Email: l.email, Status: l.status, Source: l.source,
      'Budget Min': l.budgetMin, 'Budget Max': l.budgetMax, Agent: l.assignedAgent?.name || '', Notes: l.notes, Created: l.createdAt,
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads_export.csv'; a.click();
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelected(prev => prev.length === (data?.leads?.length || 0) ? [] : data?.leads?.map(l => l._id) || []);

  const leads = data?.leads || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">{data?.total || 0} total leads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="cursor-pointer bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>
          <button onClick={handleExportCSV} className="bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowCreate(true)} className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5" id="create-lead-btn">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
              className="input-base pl-9"
            />
          </div>
          <select value={filters.status} onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }} className="input-base w-auto">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.source} onChange={(e) => { setFilters(f => ({ ...f, source: e.target.value })); setPage(1); }} className="input-base w-auto">
            <option value="">All Sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && hasRole('ADMIN', 'MANAGER') && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 flex-wrap animate-fade-in">
            <span className="text-sm text-gray-500">{selected.length} selected</span>
            <button onClick={() => setShowBulkAssign(true)} className="text-sm text-accent hover:underline">Assign Agent</button>
            {STATUSES.map(s => (
              <button key={s} onClick={() => bulkStatusMutation.mutate({ leadIds: selected, status: s })} className={`status-badge ${getStatusColor(s)} cursor-pointer hover:opacity-80`}>{s}</button>
            ))}
            <button onClick={() => setSelected([])} className="text-sm text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {hasRole('ADMIN', 'MANAGER') && (
                  <th className="table-header px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.length === leads.length && leads.length > 0} onChange={toggleAll} className="rounded border-gray-300" />
                  </th>
                )}
                <th className="table-header px-4 py-3">Name</th>
                <th className="table-header px-4 py-3 hidden md:table-cell">Contact</th>
                <th className="table-header px-4 py-3">Status</th>
                <th className="table-header px-4 py-3 hidden lg:table-cell">Source</th>
                <th className="table-header px-4 py-3 hidden lg:table-cell">Budget</th>
                <th className="table-header px-4 py-3 hidden xl:table-cell">Agent</th>
                <th className="table-header px-4 py-3 hidden xl:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : leads.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No leads found</p>
                </td></tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/leads/${lead._id}`)}>
                    {hasRole('ADMIN', 'MANAGER') && (
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.includes(lead._id)} onChange={() => toggleSelect(lead._id)} className="rounded border-gray-300" />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">{getInitials(lead.name)}</div>
                        <div className="min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-600 truncate">{lead.email || lead.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3"><span className={`status-badge ${getStatusColor(lead.status)}`}>{lead.status}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="text-sm text-gray-600">{lead.source}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="text-sm text-gray-600">{formatCurrency(lead.budgetMin)} - {formatCurrency(lead.budgetMax)}</span></td>
                    <td className="px-4 py-3 hidden xl:table-cell"><span className="text-sm text-gray-600">{lead.assignedAgent?.name || '—'}</span></td>
                    <td className="px-4 py-3 hidden xl:table-cell"><span className="text-sm text-gray-400">{formatDate(lead.createdAt)}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add New Lead</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" required />
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Budget Min</label><input type="number" value={form.budgetMin} onChange={e => setForm(f => ({ ...f, budgetMin: Number(e.target.value) }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Budget Max</label><input type="number" value={form.budgetMax} onChange={e => setForm(f => ({ ...f, budgetMax: Number(e.target.value) }))} className="input-base" /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input-base">{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-base">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                {hasRole('ADMIN', 'MANAGER') && agents.data && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Agent</label>
                    <select value={form.assignedAgent} onChange={e => setForm(f => ({ ...f, assignedAgent: e.target.value }))} className="input-base">
                      <option value="">Unassigned</option>
                      {agents.data.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-base" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50">
                  {createMutation.isPending ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssign && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkAssign(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Assign {selected.length} leads to agent</h3>
            <select id="bulk-assign-select" className="input-base mb-4" onChange={e => { if (e.target.value) bulkAssignMutation.mutate({ leadIds: selected, agentId: e.target.value }); }}>
              <option value="">Select Agent</option>
              {agents.data?.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
            <button onClick={() => setShowBulkAssign(false)} className="w-full py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
