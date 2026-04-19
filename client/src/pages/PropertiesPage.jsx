import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesAPI } from '@/api/axios';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, Grid3X3, List, MapPin, BedDouble, Bath, Maximize2, X, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'PLOT'];
const STATUSES = ['AVAILABLE', 'UNDER_NEGOTIATION', 'SOLD'];

export default function PropertiesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState('grid');
  const [filters, setFilters] = useState({ type: '', status: '', search: '', minPrice: '', maxPrice: '' });
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'RESIDENTIAL', price: '', address: '', areaSqFt: '', bedrooms: '', bathrooms: '', amenities: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['properties', page, filters],
    queryFn: () => propertiesAPI.getAll({ page, limit: 12, ...filters }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => propertiesAPI.create({ ...d, price: Number(d.price), areaSqFt: Number(d.areaSqFt || 0), bedrooms: Number(d.bedrooms || 0), bathrooms: Number(d.bathrooms || 0) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['properties'] }); setShowCreate(false); toast.success('Property created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const properties = data?.properties || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500">{data?.total || 0} listings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setView('grid')} className={`p-2 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}><List className="w-4 h-4" /></button>
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5" id="create-property-btn">
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by title or location..." value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} className="input-base pl-9" />
        </div>
        <select value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }} className="input-base w-auto">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }} className="input-base w-auto">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card py-20 text-center text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No properties found</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map(p => (
            <div key={p._id} onClick={() => navigate(`/properties/${p._id}`)} className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-200 cursor-pointer group">
              <div className="h-44 bg-gradient-to-br from-accent/10 to-blue-50 relative overflow-hidden">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-accent/30" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`status-badge ${p.status === 'AVAILABLE' ? 'bg-green-500 text-white' : p.status === 'SOLD' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>{p.status.replace(/_/g, ' ')}</span>
                  <span className="status-badge bg-white/90 text-gray-700 backdrop-blur-sm">{p.type}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{p.address}</span></div>
                <p className="text-xl font-bold text-accent mt-2">{formatCurrency(p.price)}</p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                  {p.type !== 'PLOT' && <><div className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{p.bedrooms}</div><div className="flex items-center gap-1"><Bath className="w-4 h-4" />{p.bathrooms}</div></>}
                  <div className="flex items-center gap-1"><Maximize2 className="w-4 h-4" />{p.areaSqFt?.toLocaleString()} sqft</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="table-header px-4 py-3">Property</th>
              <th className="table-header px-4 py-3 hidden md:table-cell">Type</th>
              <th className="table-header px-4 py-3">Price</th>
              <th className="table-header px-4 py-3 hidden lg:table-cell">Area</th>
              <th className="table-header px-4 py-3">Status</th>
              <th className="table-header px-4 py-3 hidden xl:table-cell">Agent</th>
            </tr></thead>
            <tbody>
              {properties.map(p => (
                <tr key={p._id} onClick={() => navigate(`/properties/${p._id}`)} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3"><div><p className="text-sm font-medium text-gray-900">{p.title}</p><p className="text-xs text-gray-500">{p.address}</p></div></td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{p.type}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-accent">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">{p.areaSqFt?.toLocaleString()} sqft</td>
                  <td className="px-4 py-3"><span className={`status-badge ${p.status === 'AVAILABLE' ? 'status-available' : p.status === 'SOLD' ? 'status-sold' : 'status-under_negotiation'}`}>{p.status.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3 hidden xl:table-cell text-sm text-gray-600">{p.agent?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Property</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-base" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-base">{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Price *</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-base" required /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address *</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-base" required /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Area (sqft)</label><input type="number" value={form.areaSqFt} onChange={e => setForm(f => ({ ...f, areaSqFt: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label><input type="number" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label><input type="number" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} className="input-base" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label><input value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} className="input-base" placeholder="Pool, Garden, Parking" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-base" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50">{createMutation.isPending ? 'Creating...' : 'Add Property'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
