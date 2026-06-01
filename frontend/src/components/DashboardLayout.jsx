import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/ui.store';
import { MaintenanceBanner } from './MaintenanceBanner';
import { getEffectivePlanDetails } from '../utils/plans';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  LayoutDashboard,
  Phone,
  Bot,
  Settings,
  School,
  Drama,
  Settings2,
  BarChart3,
  CreditCard,
  LineChart,
  LogOut,
  MoreVertical,
  User,
  Users,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Bot, label: 'Practice Call', path: '/practice' },
  { icon: Phone, label: 'Call History', path: '/calls' },
  { icon: LineChart, label: 'Analytics', path: '/analytics', requires: 'schoolAdmin' },
  { icon: Users, label: 'Members', path: '/members', requires: 'schoolAdmin' },
  { icon: Settings, label: 'School Settings', path: '/settings', requires: 'schoolAdmin' },
  { icon: School, label: 'All Schools', path: '/admin/schools', requires: 'globalAdmin' },
  { icon: BarChart3, label: 'Usage', path: '/admin/usage', requires: 'globalAdmin' },
  { icon: Drama, label: 'Scenarios', path: '/admin/scenarios', requires: 'schoolAdmin' },
  { icon: Settings2, label: 'Platform Settings', path: '/admin/platform-settings', requires: 'globalAdmin' },
];

function NavItems({ onNavigate, collapsed }) {
  const { isGlobalAdmin, isSchoolAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visible = menuItems.filter((item) => {
    if (!item.requires) return true;
    if (item.requires === 'globalAdmin') return isGlobalAdmin;
    if (item.requires === 'schoolAdmin') return isSchoolAdmin;
    return false;
  });

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
      {visible.map((item, idx) => {
        const isActive = location.pathname === item.path;
        const prev = visible[idx - 1];
        const isFirstGlobal = item.requires === 'globalAdmin' && prev?.requires !== 'globalAdmin';

        const btn = (
          <button
            onClick={() => { navigate(item.path); onNavigate?.(); }}
            className={`w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition-colors ${
              collapsed ? 'justify-center' : ''
            } ${
              isActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-foreground/80 hover:bg-accent hover:text-foreground'
            }`}
          >
            <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-foreground/75'}`} />
            {!collapsed && item.label}
          </button>
        );

        return (
          <div key={item.path}>
            {isFirstGlobal && (
              <div className={`mt-3 mb-1 ${collapsed ? 'px-0' : 'px-2'}`}>
                <div className="border-t border-border mb-2" />
                {!collapsed && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Global
                  </span>
                )}
              </div>
            )}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : btn}
          </div>
        );
      })}
    </nav>
  );
}

function UserFooter({ onNavigate, collapsed }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (profile?.name || user?.email || '?').charAt(0).toUpperCase();
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Account';
  const email = user?.email || '';
  const plan = profile?.school?.planDetails ?? getEffectivePlanDetails(profile?.school);

  const trigger = (
    <button className={`w-full flex items-center gap-3 rounded-xl bg-accent/60 px-3 py-2.5 text-left transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? 'justify-center' : ''}`}>
      <Avatar className="h-9 w-9 shrink-0 rounded-lg">
        <AvatarFallback className="rounded-lg text-sm font-semibold text-white bg-linear-to-br from-blue-500 to-blue-800">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="flex-1 min-w-0 text-foreground">
          <p className="text-sm font-medium truncate leading-none">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate mt-1">{email || '-'}</p>
        </div>
      )}
      {!collapsed && <MoreVertical className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="border-t border-border p-3">
      {!collapsed && (
        <div className="mb-3 flex aspect-[2.8/1] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background/40 dark:bg-card/80">
          <img
            src="/ai_dojo_logo_banner.png"
            alt="AI Dojo"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          align={collapsed ? 'center' : 'start'}
          side={collapsed ? 'right' : 'top'}
          sideOffset={collapsed ? 8 : 12}
          alignOffset={collapsed ? 0 : 18}
          className="w-64 p-0"
        >
          {!collapsed && (
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Avatar className="h-9 w-9 shrink-0 rounded-lg">
                <AvatarFallback className="rounded-lg text-sm font-semibold text-white bg-linear-to-br from-blue-500 to-blue-800">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
                {plan && <p className="mt-1 truncate text-xs font-medium text-primary">{plan.label}</p>}
              </div>
            </div>
          )}
          <div className="p-1.5">
          <DropdownMenuItem
            onClick={() => { navigate('/profile'); onNavigate?.(); }}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SidebarBody({ onNavigate, collapsed }) {
  const { profile, isGlobalAdmin } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <div className={`h-16 flex items-center shrink-0 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        {!collapsed && (
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Dojo Roleplay
            </span>
            <span className="text-sm font-semibold truncate text-foreground">
              {profile?.school?.name || (isGlobalAdmin ? 'Platform Admin' : 'Training Platform')}
            </span>
          </div>
        )}
      </div>
      <NavItems onNavigate={onNavigate} collapsed={collapsed} />
      <UserFooter onNavigate={onNavigate} collapsed={collapsed} />
    </div>
  );
}

export default function DashboardLayout({ children, title }) {
  const { user, profile, isGlobalAdmin, initialized, profileLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('dojo:theme') === 'dark';
  });
  const collapsed = useUIStore((s) => !s.sidebarOpen);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('dojo:theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (!initialized || (user && !profile && profileLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile?.schoolId && !isGlobalAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">✉️</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Waiting for your invite</h1>
          <p className="text-sm text-muted-foreground">
            Your account ({user.email}) isn't attached to a school yet. Ask your school admin for an invite link.
          </p>
          <Button onClick={signOut} variant="outline" size="lg" className="w-full">
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const activeItem = menuItems.find((item) => location.pathname === item.path);
  const headerTitle = title || activeItem?.label || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA] dark:bg-background">
      {/* Desktop sidebar — no background, inherits muted from root */}
      <aside
        className={`hidden md:flex md:flex-col shrink-0 transition-all duration-200 ${
          collapsed ? 'md:w-15' : 'md:w-60'
        }`}
      >
        <SidebarBody collapsed={collapsed} />
      </aside>

      {/* Right: content card */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden md:m-3 md:rounded-xl md:border md:border-border bg-card md:shadow-sm dark:bg-background dark:shadow-none">
        {/* Desktop toggle bar */}
        <div className="hidden md:flex items-center h-12 px-4 border-b border-border shrink-0">
          <button
            onClick={() => useUIStore.getState().toggleSidebar()}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          <div className="mx-4 h-5 w-px bg-border" />
          <h1 className="truncate text-sm font-semibold text-foreground">{headerTitle}</h1>
          <div className="ml-auto flex items-center gap-2 text-muted-foreground">
            <Sun className="h-4 w-4" />
            <Switch
              aria-label="Toggle dark mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
            <Moon className="h-4 w-4" />
          </div>
        </div>

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarBody onNavigate={() => setMobileOpen(false)} collapsed={false} />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium">{headerTitle}</span>
          <div className="flex w-20 items-center justify-end gap-1.5 text-muted-foreground">
            <Sun className="h-3.5 w-3.5" />
            <Switch
              aria-label="Toggle dark mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <MaintenanceBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
