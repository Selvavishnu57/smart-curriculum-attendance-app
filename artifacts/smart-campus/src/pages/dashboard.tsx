import React from 'react';
import { useAuth } from '@/lib/auth';
import { 
  useGetDashboardStats, 
  useGetRecentActivity,
  useGetTodayAttendanceSummary
} from '@workspace/api-client-react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Building2, 
  ClipboardCheck, 
  AlertTriangle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { enabled: !!user, queryKey: ['/api/dashboard/stats'] }
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useGetRecentActivity(
    { limit: 5 },
    { query: { enabled: !!user, queryKey: ['/api/dashboard/recent-activity', { limit: 5 }] } }
  );

  const { data: todaySummary, isLoading: todayLoading } = useGetTodayAttendanceSummary({
    query: { enabled: !!user && (isAdmin || isFaculty), queryKey: ['/api/attendance/today-summary'] }
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome, {user?.name}</h2>
        <p className="text-muted-foreground">Here is what's happening today.</p>
      </div>

      {(isAdmin || isFaculty) && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overallAttendancePercentage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">{stats.todayPresent}</span> Present,{' '}
                <span className="text-destructive font-medium">{stats.todayAbsent}</span> Absent
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Attendance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.lowAttendanceCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Students below 75%</p>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDepartments}</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {(isAdmin || isFaculty) && (
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Today's Department Overview</CardTitle>
              <CardDescription>
                Attendance summary for {format(new Date(), 'MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : todaySummary?.byDepartment && todaySummary.byDepartment.length > 0 ? (
                <div className="space-y-6">
                  {todaySummary.byDepartment.map(dept => (
                    <div key={dept.departmentName} className="flex items-center">
                      <div className="w-[100px] text-sm font-medium truncate" title={dept.departmentName}>
                        {dept.departmentName}
                      </div>
                      <div className="flex-1 ml-4 h-3 bg-muted rounded-full overflow-hidden flex">
                        <div 
                          className="bg-primary h-full" 
                          style={{ width: `${dept.percentage}%` }}
                        />
                        <div 
                          className="bg-destructive/60 h-full" 
                          style={{ width: `${100 - dept.percentage}%` }}
                        />
                      </div>
                      <div className="w-[50px] text-right text-sm text-muted-foreground ml-4">
                        {dept.percentage.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-md border-dashed">
                  No attendance data for today yet.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className={isAdmin || isFaculty ? "col-span-3" : "col-span-7"}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates across the campus
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-6">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <div className="flex items-center text-xs text-muted-foreground gap-2 pt-1">
                        <span>{format(new Date(activity.createdAt), 'MMM d, h:mm a')}</span>
                        {activity.userName && (
                          <>
                            <span>•</span>
                            <span>{activity.userName} ({activity.userRole})</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-md border-dashed">
                No recent activity.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
