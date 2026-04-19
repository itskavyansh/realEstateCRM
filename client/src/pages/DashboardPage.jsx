import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '@/api/axios';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDateTime, getStatusColor, getInitials } from '@/lib/utils';
import { Users, Handshake, DollarSign, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
  <div className="stat-card group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} transition-transform group-hover:scale-110`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => reportsAPI.getDashboardStats().then((r) => r.data.data),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const activities = data?.recentActivities || [];
  const followUps = data?.todayFollowUps || [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={stats.totalLeads || 0} color="bg-blue-500" subtext="All time" />
        <StatCard icon={Handshake} label="Active Deals" value={stats.activeDeals || 0} color="bg-purple-500" subtext="In pipeline" />
        <StatCard icon={DollarSign} label="Revenue MTD" value={formatCurrency(stats.revenueMTD || 0)} color="bg-emerald-500" subtext="This month" />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${stats.conversionRate || 0}%`} color="bg-orange-500" subtext="Lead → Closed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <span className="text-xs text-gray-400">{activities.length} events</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              activities.map((a) => (
                <div key={a._id} className="px-6 py-3.5 hover:bg-gray-50/80 transition-colors flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-accent">{getInitials(a.user?.name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800">{a.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(a.createdAt)}</p>
                  </div>
                  <span className={`status-badge ${getStatusColor(a.type?.split('_')[0])} flex-shrink-0`}>
                    {a.type?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Follow-ups */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Follow-ups Today</h3>
            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">{followUps.length}</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {followUps.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No follow-ups today</p>
              </div>
            ) : (
              followUps.map((f) => (
                <div key={f._id} className="px-6 py-3.5 hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {f.lead?.name || f.client?.name || 'Unknown'}
                    </p>
                    <span className="text-xs text-gray-400">
                      {new Date(f.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{f.note || 'No note'}</p>
                  {f.lead?._id && (
                    <Link to={`/leads/${f.lead._id}`} className="inline-flex items-center gap-1 text-xs text-accent mt-2 hover:underline">
                      View lead <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
