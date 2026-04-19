import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsAPI } from '@/api/axios';
import { useNavigate } from 'react-router-dom';
import { formatDate, getStatusColor, getInitials } from '@/lib/utils';
import { Plus, Search, X, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', search: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', type: 'BUYER', budget: 0, preferredLocations: '', notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, filters],
    queryFn: () => clientsAPI.getAll({ page, limit: 15, ...filters }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => clientsAPI.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setShowCreate(false); toast.success('Client created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const clients = data?.clients || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900">Clients</h1><p className="text-sm text-gray-500">{data?.total || 0} clients</p></div>
        <button onClick={() => setShowCreate(true)} className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5" id="create-client-btn"><Plus className="w-4 h-4" /> Add Client</button>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search clients..." value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} className="input-base pl-9" />
        </div>
        <select value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }} className="input-base w-auto">
          <option value="">All Types</option>
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
          <option value="BOTH">Both</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="table-header px-4 py-3">Client</th>
              <th className="table-header px-4 py-3 hidden md:table-cell">Contact</th>
              <th className="table-header px-4 py-3">Type</th>
              <th className="table-header px-4 py-3 hidden lg:table-cell">Budget</th>
              <th className="table-header px-4 py-3 hidden xl:table-cell">Locations</th>
              <th className="table-header px-4 py-3 hidden xl:table-cell">Created</th>
            </tr></thead>
            <tbody>
              {isLoading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
              )) : clients.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-400"><UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No clients found</p></td></tr>
              ) : clients.map(c => (
                <tr key={c._id} onClick={() => navigate(`/clients/${c._id}`)} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-semibold">{getInitials(c.name)}</div><span className="text-sm font-medium">{c.name}</span></div></td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{c.email || c.phone || '—'}</td>
                  <td className="px-4 py-3"><span className={`status-badge ${getStatusColor(c.type)}`}>{c.type}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">${c.budget?.toLocaleString() || '—'}</td>
                  <td className="px-4 py-3 hidden xl:table-cell text-sm text-gray-500">{c.preferredLocations?.join(', ') || '—'}</td>
                  <td className="px-4 py-3 hidden xl:table-cell text-sm text-gray-400">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Add Client</h3><button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, budget: Number(form.budget) }); }} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-base" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-base"><option value="BUYER">Buyer</option><option value="SELLER">Seller</option><option value="BOTH">Both</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Budget</label><input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className="input-base" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Preferred Locations (comma-separated)</label><input value={form.preferredLocations} onChange={e => setForm(f => ({ ...f, preferredLocations: e.target.value }))} className="input-base" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-base" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50">{createMutation.isPending ? 'Creating...' : 'Add Client'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
