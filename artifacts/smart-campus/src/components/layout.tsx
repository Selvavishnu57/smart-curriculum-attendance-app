import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  Calendar, 
  BookOpen, 
  ActivitySquare, 
  Bell, 
  GraduationCap,
  Building2,
  Settings,
  LogOut,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useListNotifications } from '@workspace/api-client-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const { data: notifications } = useListNotifications(
    { unreadOnly: true },
    { query: { enabled: !!user, queryKey: ['/api/notifications', { unreadOnly: true }] } }
  );

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  const adminNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Faculty', href: '/faculty', icon: GraduationCap },
    { name: 'Departments', href: '/departments', icon: Building2 },
    { name: 'Attendance', href: '/attendance', icon: ClipboardCheck },
    { name: 'Analytics', href: '/attendance/analytics', icon: BarChart3 },
    { name: 'Timetable', href: '/timetable', icon: Calendar },
    { name: 'Curriculum', href: '/curriculum', icon: BookOpen },
    { name: 'Activities', href: '/activities', icon: ActivitySquare },
    { name: 'Contact Messages', href: '/contact', icon: Mail },
  ];

  const facultyNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: ClipboardCheck },
    { name: 'Timetable', href: '/timetable', icon: Calendar },
    { name: 'Curriculum', href: '/curriculum', icon: BookOpen },
    { name: 'Activities', href: '/activities', icon: ActivitySquare },
    { name: 'Contact Us', href: '/contact', icon: Mail },
  ];

  const studentNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Attendance', href: '/attendance', icon: ClipboardCheck },
    { name: 'Timetable', href: '/timetable', icon: Calendar },
    { name: 'Curriculum', href: '/curriculum', icon: BookOpen },
    { name: 'Activities', href: '/activities', icon: ActivitySquare },
    { name: 'Contact Us', href: '/contact', icon: Mail },
  ];

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'faculty' ? facultyNav : studentNav;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="w-8 h-8 bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center rounded font-bold mr-3">
            AU
          </div>
          <span className="text-sidebar-foreground font-semibold tracking-tight uppercase text-sm">ANNA UNIVERSITY ERP</span>
        </div>
        
        <div className="flex-1 py-6 overflow-y-auto">
          <nav className="space-y-1 px-4">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  location === item.href || location.startsWith(item.href + '/')
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10 border border-sidebar-border">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                {user?.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize truncate">{user?.role}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Link href="/settings" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors">
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0 md:hidden">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded font-bold">
              AU
            </div>
            <span className="font-semibold text-sm">AU ERP</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications" className="relative p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Link>
          </div>
        </header>

        <header className="h-16 border-b bg-card hidden md:flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-semibold text-foreground tracking-tight capitalize">
            {location === '/' ? 'Dashboard' : location.split('/')[1].replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer block">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-background p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
