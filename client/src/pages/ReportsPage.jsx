import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '@/api/axios';
import { formatCurrency } from '@/lib/utils';
import { Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, FunnelChart, Funnel, LabelList, Cell
} from 'recharts';
import Papa from 'papaparse';

const FUNNEL_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#22c55e', '#ef4444'];

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  const leadsBySource = useQuery({ queryKey: ['report-leads-source', year], queryFn: () => reportsAPI.getLeadsBySource(year).then(r => r.data.data) });
  const funnel = useQuery({ queryKey: ['report-funnel'], queryFn: () => reportsAPI.getConversionFunnel().then(r => r.data.data) });
  const revenue = useQuery({ queryKey: ['report-revenue', year], queryFn: () => reportsAPI.getRevenueByMonth(year).then(r => r.data.data) });
  const leaderboard = useQuery({ queryKey: ['report-leaderboard'], queryFn: () => reportsAPI.getAgentLeaderboard().then(r => r.data.data) });
  const topProperties = useQuery({ queryKey: ['report-top-properties'], queryFn: () => reportsAPI.getTopProperties().then(r => r.data.data) });

  const exportToCSV = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1><p className="text-sm text-gray-500">Data-driven insights for your business</p></div>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="input-base w-auto">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Leads by Source — Stacked Bar */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Monthly Leads by Source</h3>
          <button onClick={() => leadsBySource.data && exportToCSV(leadsBySource.data, 'leads_by_source')} className="text-sm text-accent hover:underline flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadsBySource.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="WEBSITE" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="AD" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="REFERRAL" stackId="a" fill="#10b981" />
              <Bar dataKey="CALL" stackId="a" fill="#f59e0b" />
              <Bar dataKey="WALKIN" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Lead Conversion Funnel</h3>
          <div className="space-y-3">
            {(funnel.data || []).map((item, i) => {
              const maxCount = Math.max(...(funnel.data || []).map(d => d.count), 1);
              const pct = (item.count / maxCount) * 100;
              return (
                <div key={item.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{item.stage}</span>
                    <span className="text-gray-500">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 flex items-center pl-3" style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: FUNNEL_COLORS[i] }}>
                      <span className="text-xs text-white font-medium">{Math.round(pct)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Month */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Revenue by Month</h3>
            <button onClick={() => revenue.data && exportToCSV(revenue.data, 'revenue_by_month')} className="text-sm text-accent hover:underline flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="commission" name="Commission" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agent Leaderboard */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Agent Leaderboard</h3>
          <button onClick={() => leaderboard.data && exportToCSV(leaderboard.data, 'agent_leaderboard')} className="text-sm text-accent hover:underline flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="table-header px-4 py-3">#</th>
              <th className="table-header px-4 py-3">Agent</th>
              <th className="table-header px-4 py-3">Leads</th>
              <th className="table-header px-4 py-3">Converted</th>
              <th className="table-header px-4 py-3 hidden md:table-cell">Deals Closed</th>
              <th className="table-header px-4 py-3 hidden lg:table-cell">Revenue</th>
              <th className="table-header px-4 py-3">Commission</th>
            </tr></thead>
            <tbody>
              {(leaderboard.data || []).map((a, i) => (
                <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>{i + 1}</span></td>
                  <td className="px-4 py-3 text-sm font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-sm">{a.leadsAssigned}</td>
                  <td className="px-4 py-3 text-sm">{a.leadsConverted}</td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">{a.dealsClosed}</td>
                  <td className="px-4 py-3 text-sm hidden lg:table-cell font-medium">{formatCurrency(a.totalRevenue)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(a.totalCommission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Properties */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Top Performing Properties</h3>
          <button onClick={() => topProperties.data && exportToCSV(topProperties.data, 'top_properties')} className="text-sm text-accent hover:underline flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="table-header px-4 py-3">Property</th>
              <th className="table-header px-4 py-3">Type</th>
              <th className="table-header px-4 py-3">Price</th>
              <th className="table-header px-4 py-3">Deals</th>
              <th className="table-header px-4 py-3 hidden md:table-cell">Total Value</th>
            </tr></thead>
            <tbody>
              {(topProperties.data || []).map(p => (
                <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3"><div><p className="text-sm font-medium">{p.title}</p><p className="text-xs text-gray-500">{p.address}</p></div></td>
                  <td className="px-4 py-3 text-sm">{p.type}</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-0.5 bg-accent/10 text-accent rounded-md font-medium">{p.dealCount}</span></td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell font-medium">{formatCurrency(p.totalValue)}</td>
                </tr>
              ))}
              {(!topProperties.data || topProperties.data.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
