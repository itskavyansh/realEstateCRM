import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '@/api/axios';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getInitials } from '@/lib/utils';
import { Users, TrendingUp, DollarSign, Briefcase } from 'lucide-react';

export default function AgentsPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => usersAPI.getAll({ role: 'AGENT', limit: 100 }).then(r => r.data.data.users),
  });

  const agents = data || [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Agents</h1><p className="text-sm text-gray-500">{agents.length} team members</p></div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card py-20 text-center text-gray-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-50" /><p>No agents found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div key={agent._id} onClick={() => navigate(`/agents/${agent._id}`)} className="bg-white rounded-xl shadow-card p-6 hover:shadow-card-hover transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-blue-400 flex items-center justify-center text-white text-xl font-bold group-hover:scale-105 transition-transform">
                  {getInitials(agent.name)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{agent.name}</p>
                  <p className="text-sm text-gray-500">{agent.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-400">{agent.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center"><Users className="w-4 h-4 text-blue-500 mx-auto mb-1" /><p className="text-xs text-gray-500">Leads</p></div>
                <div className="bg-green-50 rounded-lg p-3 text-center"><Briefcase className="w-4 h-4 text-green-500 mx-auto mb-1" /><p className="text-xs text-gray-500">Deals</p></div>
              </div>
              <p className="text-xs text-accent mt-3 group-hover:underline">View full profile →</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
