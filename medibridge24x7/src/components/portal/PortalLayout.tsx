import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabaseClient';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FlaskConical,
  MessageSquare,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: 'Dashboard', path: '/portal', icon: LayoutDashboard, exact: true },
  { name: 'Patients', path: '/portal/patients', icon: Users },
  { name: 'Consultations', path: '/portal/consultations', icon: Calendar },
  { name: 'Lab Orders', path: '/portal/lab-orders', icon: FlaskConical },
  { name: 'Chat', path: '/portal/chat', icon: MessageSquare },
  { name: 'Escalations', path: '/portal/escalations', icon: AlertTriangle, badge: true },
];

export const PortalLayout = ({ children }: PortalLayoutProps) => {
  const navigate = useNavigate();
  const { user, organization, orgSettings, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [escalationCount, setEscalationCount] = useState(0);

  useEffect(() => {
    if (organization?.id && user?.id) {
      loadEscalationCount();
      const interval = setInterval(loadEscalationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [organization?.id, user?.id]);

  const loadEscalationCount = async () => {
    try {
      const { data: staffData } = await supabase
        .from('org_staff')
        .select('id, can_handle_escalations')
        .eq('organization_id', organization!.id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!staffData) return;

      let query = supabase
        .from('escalations')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'resolved');

      if (staffData.can_handle_escalations) {
        query = query.in('status', ['open', 'in_progress']);
      } else {
        query = query.eq('assigned_staff_id', staffData.id).eq('status', 'in_progress');
      }

      const { count } = await query;
      setEscalationCount(count || 0);
    } catch (error) {
      console.error('Error loading escalation count:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex pb-16 lg:pb-0">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-64 md:w-20 transform transition-all duration-300 lg:translate-x-0 lg:static ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: orgSettings?.primary_color || '#1e3a8a',
        }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white border-opacity-10">
            {orgSettings?.logo_url ? (
              <img
                src={orgSettings.logo_url}
                alt={organization?.name || 'Logo'}
                className="h-10 w-auto"
              />
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {organization?.name?.charAt(0) || 'C'}
                  </span>
                </div>
                <span className="text-white font-semibold text-lg">
                  {organization?.name || 'Clinic'}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-white hover:bg-white hover:bg-opacity-10 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setIsMobileMenuOpen(false)}
                title={item.name}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors relative md:justify-center lg:justify-start ${
                    isActive
                      ? 'bg-white bg-opacity-20 text-white font-medium'
                      : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 md:hidden lg:block">{item.name}</span>
                {item.badge && escalationCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full min-w-[1.25rem] md:absolute md:top-1 md:right-1 lg:relative lg:top-auto lg:right-auto">
                    {escalationCount > 99 ? '99+' : escalationCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-white border-opacity-10 md:hidden lg:block">
            <div className="text-xs text-white text-opacity-60 mb-2">Organization</div>
            <div className="text-sm text-white font-medium truncate">
              {organization?.name || 'Unknown Organization'}
            </div>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white p-2 -ml-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex-1 lg:flex-none">
                <h1 className="text-xl font-semibold text-white truncate">
                  {organization?.name || 'Clinic Portal'}
                </h1>
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-white">{user?.full_name}</div>
                    <div className="text-xs text-slate-400">{user?.email}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-40 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-700">
                        <div className="text-sm font-medium text-white truncate">
                          {user?.full_name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                        <div className="text-xs text-slate-500 mt-1 capitalize">
                          {user?.role?.replace('_', ' ')}
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 lg:hidden z-40">
          <div className="flex items-center justify-around">
            {navigationItems.slice(0, 5).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-2 px-2 relative min-h-[56px] ${
                    isActive ? 'text-primary' : 'text-slate-400'
                  }`
                }
              >
                <div className="relative">
                  <item.icon className="w-6 h-6" />
                  {item.badge && escalationCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full">
                      {escalationCount > 9 ? '9+' : escalationCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-medium">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};
