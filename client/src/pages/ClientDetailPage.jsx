import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsAPI } from '@/api/axios';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getInitials } from '@/lib/utils';
import { ArrowLeft, Phone as PhoneIcon, Mail, MapPin, Clock, Plus, X, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showInteraction, setShowInteraction] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [interactionForm, setInteractionForm] = useState({ type: 'CALL', date: '', notes: '' });
  const [followUpForm, setFollowUpForm] = useState({ scheduledAt: '', note: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsAPI.getById(id).then(r => r.data.data),
  });

  const interactionMutation = useMutation({
    mutationFn: (d) => clientsAPI.logInteraction(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['client', id] }); setShowInteraction(false); toast.success('Interaction logged'); },
  });

  const followUpMutation = useMutation({
    mutationFn: (d) => clientsAPI.createFollowUp(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['client', id] }); setShowFollowUp(false); toast.success('Follow-up scheduled'); },
  });

  if (isLoading) return <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />;
  const client = data?.client;
  if (!client) return <div className="text-center py-20 text-gray-400">Client not found</div>;

  const interactions = data?.interactions || [];
  const deals = data?.deals || [];
  const followUps = data?.followUps || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/clients')} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <span className={`status-badge ${getStatusColor(client.type)}`}>{client.type}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFollowUp(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-700 text-sm font-medium hover:bg-orange-100"><CalendarClock className="w-4 h-4" /> Follow-up</button>
          <button onClick={() => setShowInteraction(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover"><Plus className="w-4 h-4" /> Log Interaction</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-card p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Contact</h3>
            {client.phone && <div className="flex items-center gap-3 text-sm"><PhoneIcon className="w-4 h-4 text-gray-400" />{client.phone}</div>}
            {client.email && <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-gray-400" />{client.email}</div>}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Budget</span><span className="font-medium">{formatCurrency(client.budget)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Created</span><span className="font-medium">{formatDate(client.createdAt)}</span></div>
            </div>
            {client.preferredLocations?.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Preferred Locations</p>
                <div className="flex flex-wrap gap-1.5">{client.preferredLocations.map((l, i) => <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg flex items-center gap-1"><MapPin className="w-3 h-3" />{l}</span>)}</div>
              </div>
            )}
            {client.notes && <div className="pt-3 border-t border-gray-100"><p className="text-sm text-gray-500 mb-1">Notes</p><p className="text-sm">{client.notes}</p></div>}
          </div>

          {/* Deals */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Deals ({deals.length})</h3>
            {deals.length === 0 ? <p className="text-sm text-gray-400">No deals</p> : (
              <div className="space-y-2">{deals.map(d => (
                <div key={d._id} className="p-3 border border-gray-200 rounded-lg hover:border-accent/30 transition-colors cursor-pointer" onClick={() => navigate(`/deals`)}>
                  <div className="flex justify-between text-sm"><span className="font-medium">{d.property?.title}</span><span className={`status-badge ${getStatusColor(d.stage)}`}>{d.stage}</span></div>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(d.dealValue)} • {d.agent?.name}</p>
                </div>
              ))}</div>
            )}
          </div>

          {/* Follow-ups */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Follow-ups</h3>
            {followUps.length === 0 ? <p className="text-sm text-gray-400">None</p> : (
              <div className="space-y-2">{followUps.map(f => (
                <div key={f._id} className={`p-3 rounded-lg border ${f.isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between text-sm"><span className="font-medium">{formatDateTime(f.scheduledAt)}</span>{f.isCompleted && <span className="text-xs text-green-600">Done</span>}</div>
                  <p className="text-xs text-gray-600 mt-1">{f.note || 'No note'}</p>
                </div>
              ))}</div>
            )}
          </div>
        </div>

        {/* Interactions Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Interaction Timeline</h3></div>
          <div className="p-6">
            {interactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><Clock className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No interactions logged</p></div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-6">{interactions.map(i => (
                  <div key={i._id} className="relative pl-10">
                    <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white ${i.type === 'CALL' ? 'bg-blue-500' : i.type === 'EMAIL' ? 'bg-green-500' : 'bg-purple-500'}`} />
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`status-badge ${i.type === 'CALL' ? 'bg-blue-100 text-blue-700' : i.type === 'EMAIL' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{i.type.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(i.date)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{i.notes || 'No notes'}</p>
                      <p className="text-xs text-gray-400 mt-1">by {i.user?.name}</p>
                    </div>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interaction Modal */}
      {showInteraction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowInteraction(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Log Interaction</h3><button onClick={() => setShowInteraction(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
            <form onSubmit={e => { e.preventDefault(); interactionMutation.mutate({ ...interactionForm, date: interactionForm.date || new Date().toISOString() }); }} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={interactionForm.type} onChange={e => setInteractionForm(f => ({ ...f, type: e.target.value }))} className="input-base"><option value="CALL">Call</option><option value="SITE_VISIT">Site Visit</option><option value="EMAIL">Email</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="datetime-local" value={interactionForm.date} onChange={e => setInteractionForm(f => ({ ...f, date: e.target.value }))} className="input-base" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={3} value={interactionForm.notes} onChange={e => setInteractionForm(f => ({ ...f, notes: e.target.value }))} className="input-base" /></div>
              <div className="flex gap-3"><button type="button" onClick={() => setShowInteraction(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button><button type="submit" disabled={interactionMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUp && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowFollowUp(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Schedule Follow-up</h3>
            <form onSubmit={e => { e.preventDefault(); followUpMutation.mutate(followUpForm); }} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label><input type="datetime-local" value={followUpForm.scheduledAt} onChange={e => setFollowUpForm(f => ({ ...f, scheduledAt: e.target.value }))} className="input-base" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Note</label><textarea rows={3} value={followUpForm.note} onChange={e => setFollowUpForm(f => ({ ...f, note: e.target.value }))} className="input-base" /></div>
              <div className="flex gap-3"><button type="button" onClick={() => setShowFollowUp(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button><button type="submit" disabled={followUpMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50">Schedule</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
