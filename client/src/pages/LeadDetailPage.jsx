import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI } from '@/api/axios';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getInitials } from '@/lib/utils';
import { ArrowLeft, Edit3, Clock, MessageSquare, Phone, Mail, Save, X, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CLOSED', 'LOST'];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [followUpForm, setFollowUpForm] = useState({ scheduledAt: '', note: '' });
  const [showFollowUp, setShowFollowUp] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsAPI.getById(id).then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: (d) => leadsAPI.update(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lead', id] }); setEditing(false); toast.success('Lead updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => leadsAPI.update(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lead', id] }); toast.success('Status updated'); },
  });

  const followUpMutation = useMutation({
    mutationFn: (d) => leadsAPI.createFollowUp(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lead', id] }); setShowFollowUp(false); setFollowUpForm({ scheduledAt: '', note: '' }); toast.success('Follow-up scheduled'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );

  const lead = data?.lead;
  const activities = data?.activities || [];
  const followUps = data?.followUps || [];

  if (!lead) return <div className="text-center py-20 text-gray-400">Lead not found</div>;

  const startEdit = () => { setEditForm({ name: lead.name, phone: lead.phone, email: lead.email, budgetMin: lead.budgetMin, budgetMax: lead.budgetMax, notes: lead.notes }); setEditing(true); };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/leads')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`status-badge ${getStatusColor(lead.status)}`}>{lead.status}</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">{lead.source}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFollowUp(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-700 text-sm font-medium hover:bg-orange-100 transition-colors" id="quick-followup-btn">
            <CalendarClock className="w-4 h-4" /> Quick Follow-up
          </button>
          <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors" id="edit-lead-btn">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Contact Card */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              {lead.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /><span className="text-sm">{lead.phone}</span></div>}
              {lead.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-400" /><span className="text-sm">{lead.email}</span></div>}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Budget</span><span className="font-medium">{formatCurrency(lead.budgetMin)} – {formatCurrency(lead.budgetMax)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Preference</span><span className="font-medium">{lead.propertyTypePreference || '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Agent</span><span className="font-medium">{lead.assignedAgent?.name || 'Unassigned'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Created</span><span className="font-medium">{formatDate(lead.createdAt)}</span></div>
            </div>
            {lead.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Status Change */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Change Status</h3>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => statusMutation.mutate(s)} className={`status-badge ${getStatusColor(s)} cursor-pointer hover:opacity-80 transition-opacity ${lead.status === s ? 'ring-2 ring-offset-1 ring-current' : ''}`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Follow-ups */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Follow-ups</h3>
            {followUps.length === 0 ? (
              <p className="text-sm text-gray-400">No follow-ups scheduled</p>
            ) : (
              <div className="space-y-3">
                {followUps.map(f => (
                  <div key={f._id} className={`p-3 rounded-lg border ${f.isCompleted ? 'bg-green-50 border-green-200' : f.emailSent ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between text-sm"><span className="font-medium">{formatDateTime(f.scheduledAt)}</span>{f.isCompleted && <span className="text-green-600 text-xs">Completed</span>}{!f.isCompleted && f.emailSent && <span className="text-yellow-600 text-xs">Sent</span>}</div>
                    <p className="text-xs text-gray-600 mt-1">{f.note || 'No note'}</p>
                    <p className="text-xs text-gray-400 mt-1">by {f.user?.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
          </div>
          <div className="p-6">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activity yet</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-6">
                  {activities.map(a => (
                    <div key={a._id} className="relative pl-10">
                      <div className="absolute left-2.5 w-3 h-3 rounded-full bg-accent border-2 border-white" />
                      <div>
                        <p className="text-sm text-gray-800">{a.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{formatDateTime(a.createdAt)}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{a.user?.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Lead</h3>
              <button onClick={() => setEditing(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(editForm); }} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input-base" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="input-base" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Budget Min</label><input type="number" value={editForm.budgetMin} onChange={e => setEditForm(f => ({ ...f, budgetMin: Number(e.target.value) }))} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Budget Max</label><input type="number" value={editForm.budgetMax} onChange={e => setEditForm(f => ({ ...f, budgetMax: Number(e.target.value) }))} className="input-base" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={3} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="input-base" /></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 flex items-center justify-center gap-1.5"><Save className="w-4 h-4" /> Save</button>
              </div>
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
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Note</label><textarea rows={3} value={followUpForm.note} onChange={e => setFollowUpForm(f => ({ ...f, note: e.target.value }))} className="input-base" placeholder="Reminder note..." /></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowFollowUp(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={followUpMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
