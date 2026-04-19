import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '@/api/axios';
import { formatCurrency, getInitials } from '@/lib/utils';
import { ArrowLeft, Users, Briefcase, DollarSign, TrendingUp, Target, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AgentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['agent-stats', id],
    queryFn: () => usersAPI.getStats(id).then(r => r.data.data),
  });

  if (isLoading) return <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />;
  if (!data) return <div className="text-center py-20 text-gray-400">Agent not found</div>;

  const { user, stats, monthlyPerformance } = data;

  const statCards = [
    { icon: Users, label: 'Total Leads', value: stats.totalLeads, color: 'bg-blue-500' },
    { icon: CheckCircle, label: 'Converted', value: stats.leadsConverted, color: 'bg-green-500' },
    { icon: Briefcase, label: 'Active Deals', value: stats.activeDeals, color: 'bg-purple-500' },
    { icon: Target, label: 'Closed Deals', value: stats.closedDeals, color: 'bg-orange-500' },
    { icon: DollarSign, label: 'Revenue', value: formatCurrency(stats.totalRevenue), color: 'bg-emerald-500' },
    { icon: TrendingUp, label: 'Commission', value: formatCurrency(stats.totalCommission), color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/agents')} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-blue-400 flex items-center justify-center text-white text-2xl font-bold">{getInitials(user.name)}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email} • {user.phone}</p>
            <div className="flex items-center gap-1.5 mt-0.5"><div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-gray-300'}`} /><span className="text-xs text-gray-400">{user.role}</span></div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-4 h-4 text-white" /></div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Conversion Rate */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Conversion Rate</h3>
          <span className="text-2xl font-bold text-accent">{stats.conversionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-accent rounded-full h-3 transition-all duration-500" style={{ width: `${stats.conversionRate}%` }} />
        </div>
      </div>

      {/* Monthly Performance Chart */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Monthly Performance</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" name="Commission" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
