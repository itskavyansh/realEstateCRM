import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, Building2, UserCheck, Handshake,
  BarChart3, Settings, ChevronLeft, ChevronRight, UserCog, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'AGENT'] },
  { path: '/leads', label: 'Leads', icon: Users, roles: ['ADMIN', 'MANAGER', 'AGENT'] },
  { path: '/properties', label: 'Properties', icon: Building2, roles: ['ADMIN', 'MANAGER', 'AGENT'] },
  { path: '/clients', label: 'Clients', icon: UserCheck, roles: ['ADMIN', 'MANAGER', 'AGENT'] },
  { path: '/deals', label: 'Deals', icon: Handshake, roles: ['ADMIN', 'MANAGER', 'AGENT'] },
  { path: '/agents', label: 'Agents', icon: UserCog, roles: ['ADMIN', 'MANAGER'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar text-white z-30 flex flex-col transition-all duration-300 shadow-sidebar',
        collapsed ? 'w-[68px]' : 'w-[250px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-white/10', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <Home className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold tracking-tight">PropertyHub</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">CRM</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'sidebar-link group relative',
                isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link sidebar-link-inactive w-full justify-center"
          id="sidebar-collapse-btn"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
