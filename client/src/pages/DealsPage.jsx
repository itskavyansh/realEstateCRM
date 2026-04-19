import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsAPI, clientsAPI, propertiesAPI } from '@/api/axios';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatCurrency, getStatusColor, getInitials } from '@/lib/utils';
import { Plus, X, GripVertical, Handshake } from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES = ['INQUIRY', 'SITE_VISIT', 'NEGOTIATION', 'AGREEMENT', 'CLOSED', 'CANCELLED'];
const STAGE_COLORS = {
  INQUIRY: 'border-t-blue-400', SITE_VISIT: 'border-t-yellow-400', NEGOTIATION: 'border-t-orange-400',
  AGREEMENT: 'border-t-purple-400', CLOSED: 'border-t-green-400', CANCELLED: 'border-t-red-400',
};
const STAGE_BG = {
  INQUIRY: 'bg-blue-50', SITE_VISIT: 'bg-yellow-50', NEGOTIATION: 'bg-orange-50',
  AGREEMENT: 'bg-purple-50', CLOSED: 'bg-green-50', CANCELLED: 'bg-red-50',
};

function DealCard({ deal, isDragging }) {
  return (
    <div className={`kanban-card border-t-4 ${STAGE_COLORS[deal.stage]} ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{deal.client?.name || 'Client'}</p>
          <p className="text-xs text-gray-500 truncate">{deal.property?.title || 'Property'}</p>
        </div>
        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
      </div>
      <p className="text-lg font-bold text-accent">{formatCurrency(deal.dealValue)}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[9px] font-bold">{getInitials(deal.agent?.name)}</div>
        <span className="text-xs text-gray-400">{deal.agent?.name}</span>
      </div>
    </div>
  );
}

function SortableDealCard({ deal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal._id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} isDragging={isDragging} />
    </div>
  );
}

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeDeal, setActiveDeal] = useState(null);
  const [form, setForm] = useState({ client: '', property: '', dealValue: '', commissionPercent: 2, notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['kanban'],
    queryFn: () => dealsAPI.getKanban().then(r => r.data.data),
  });

  const clients = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsAPI.getAll({ limit: 100 }).then(r => r.data.data.clients) });
  const properties = useQuery({ queryKey: ['properties-select'], queryFn: () => propertiesAPI.getAll({ limit: 100 }).then(r => r.data.data.properties) });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }) => dealsAPI.updateStage(id, stage),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kanban'] }); toast.success('Deal stage updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update stage'),
  });

  const createMutation = useMutation({
    mutationFn: (d) => dealsAPI.create({ ...d, dealValue: Number(d.dealValue), commissionPercent: Number(d.commissionPercent) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kanban'] }); setShowCreate(false); toast.success('Deal created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const findDealById = (id) => {
    if (!data) return null;
    for (const stage of STAGES) {
      const deal = data[stage]?.find(d => d._id === id);
      if (deal) return deal;
    }
    return null;
  };

  const findStageOfDeal = (id) => {
    if (!data) return null;
    for (const stage of STAGES) {
      if (data[stage]?.find(d => d._id === id)) return stage;
    }
    return null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setActiveDeal(findDealById(event.active.id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id;
    const currentStage = findStageOfDeal(dealId);

    // Check if dropped over a stage column or another deal
    let targetStage = over.id;
    if (!STAGES.includes(targetStage)) {
      targetStage = findStageOfDeal(over.id);
    }

    if (targetStage && targetStage !== currentStage) {
      stageMutation.mutate({ id: dealId, stage: targetStage });
    }
  };

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="flex gap-4 overflow-x-auto pb-4">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-72 h-96 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />)}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Deals Pipeline</h1><p className="text-sm text-gray-500">Drag cards to change deal stage</p></div>
        <button onClick={() => setShowCreate(true)} className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5" id="create-deal-btn"><Plus className="w-4 h-4" /> New Deal</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
          {STAGES.map(stage => {
            const stageDeals = data?.[stage] || [];
            const totalValue = stageDeals.reduce((sum, d) => sum + d.dealValue, 0);

            return (
              <div key={stage} id={`kanban-col-${stage}`}>
                <SortableContext items={stageDeals.map(d => d._id)} strategy={verticalListSortingStrategy} id={stage}>
                  <div className={`kanban-column ${STAGE_BG[stage]} border border-gray-200/50`}>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-700">{stage.replace(/_/g, ' ')}</h3>
                        <span className="text-xs bg-white px-1.5 py-0.5 rounded-md text-gray-500 font-medium">{stageDeals.length}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatCurrency(totalValue)}</span>
                    </div>
                    <div className="space-y-2 min-h-[100px]" data-stage={stage}>
                      {stageDeals.map(deal => (
                        <SortableDealCard key={deal._id} deal={deal} />
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-xs">Drop deals here</div>
                      )}
                    </div>
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal && <DealCard deal={activeDeal} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* Create Deal Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Create Deal</h3><button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} className="input-base" required>
                  <option value="">Select Client</option>
                  {clients.data?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                <select value={form.property} onChange={e => setForm(f => ({ ...f, property: e.target.value }))} className="input-base" required>
                  <option value="">Select Property</option>
                  {properties.data?.map(p => <option key={p._id} value={p._id}>{p.title} — {formatCurrency(p.price)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Deal Value *</label><input type="number" value={form.dealValue} onChange={e => setForm(f => ({ ...f, dealValue: e.target.value }))} className="input-base" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label><input type="number" step="0.1" value={form.commissionPercent} onChange={e => setForm(f => ({ ...f, commissionPercent: e.target.value }))} className="input-base" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-base" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50">{createMutation.isPending ? 'Creating...' : 'Create Deal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
