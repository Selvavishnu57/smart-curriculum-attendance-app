import React from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout';

import Login from '@/pages/login';
import RegisterStudent from '@/pages/register-student';
import RegisterFaculty from '@/pages/register-faculty';
import Dashboard from '@/pages/dashboard';
import Students from '@/pages/students';
import Notifications from '@/pages/notifications';
import Settings from '@/pages/settings';
import Attendance from '@/pages/attendance';
import AttendanceAnalytics from '@/pages/attendance-analytics';
import Activities from '@/pages/activities';
import Curriculum from '@/pages/curriculum';
import Timetable from '@/pages/timetable';
import StudentProfile from '@/pages/student-profile';
import Faculty from '@/pages/faculty';
import Departments from '@/pages/departments';
import Contact from '@/pages/contact';

const queryClient = new QueryClient();

// A wrapper to protect routes and add the layout
function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          You do not have permission to view this page.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function MainRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  React.useEffect(() => {
    if (!isLoading && location === '/' && isAuthenticated) {
      setLocation('/dashboard');
    } else if (!isLoading && location === '/' && !isAuthenticated) {
      setLocation('/login');
    } else if (!isLoading && !isAuthenticated && location !== '/login' && !location.startsWith('/register')) {
      setLocation('/login');
    }
  }, [isLoading, location, isAuthenticated, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register/student" component={RegisterStudent} />
      <Route path="/register/faculty" component={RegisterFaculty} />
      
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      
      <Route path="/students">
        {() => <ProtectedRoute component={Students} allowedRoles={['admin', 'faculty']} />}
      </Route>

      <Route path="/students/:id">
        {() => <ProtectedRoute component={StudentProfile} allowedRoles={['admin', 'faculty']} />}
      </Route>

      <Route path="/attendance">
        {() => <ProtectedRoute component={Attendance} />}
      </Route>

      <Route path="/attendance/analytics">
        {() => <ProtectedRoute component={AttendanceAnalytics} allowedRoles={['admin', 'faculty']} />}
      </Route>

      <Route path="/timetable">
        {() => <ProtectedRoute component={Timetable} />}
      </Route>

      <Route path="/curriculum">
        {() => <ProtectedRoute component={Curriculum} />}
      </Route>

      <Route path="/activities">
        {() => <ProtectedRoute component={Activities} />}
      </Route>

      <Route path="/notifications">
        {() => <ProtectedRoute component={Notifications} />}
      </Route>

      <Route path="/faculty">
        {() => <ProtectedRoute component={Faculty} allowedRoles={['admin']} />}
      </Route>

      <Route path="/departments">
        {() => <ProtectedRoute component={Departments} allowedRoles={['admin']} />}
      </Route>

      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>

      <Route path="/contact">
        {() => <ProtectedRoute component={Contact} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AuthProvider>
          <TooltipProvider>
            <MainRouter />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
