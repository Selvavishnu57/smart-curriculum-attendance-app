import React from 'react';
import { useAuth } from '@/lib/auth';
import { 
  useListDepartments, 
  useGetDailyAnalytics,
  useGetWeeklyAnalytics,
  useGetMonthlyAnalytics,
  useGetDepartmentComparison
} from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';

export default function AttendanceAnalytics() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [department, setDepartment] = React.useState<string>('all');

  const { data: departments } = useListDepartments({ query: { queryKey: ['/api/departments'] } });

  const queryParams = department !== 'all' ? { department } : {};

  const { data: dailyData } = useGetDailyAnalytics(queryParams, {
    query: { queryKey: ['/api/attendance/analytics/daily', queryParams] }
  });

  const { data: weeklyData } = useGetWeeklyAnalytics(queryParams, {
    query: { queryKey: ['/api/attendance/analytics/weekly', queryParams] }
  });

  const { data: monthlyData } = useGetMonthlyAnalytics(queryParams, {
    query: { queryKey: ['/api/attendance/analytics/monthly', queryParams] }
  });

  const { data: deptComparison } = useGetDepartmentComparison({
    query: { enabled: isAdmin, queryKey: ['/api/attendance/analytics/departments'] }
  });

  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Analytics</h2>
          <p className="text-muted-foreground">Detailed metrics and trends for student attendance.</p>
        </div>

        <div className="flex gap-2">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments?.map(d => (
                <SelectItem key={d.id} value={d.code}>{d.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Trend (Last 30 Days)</CardTitle>
            <CardDescription>Daily attendance percentage fluctuation</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatPercent} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance']}
                />
                <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>Average attendance by week</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatPercent} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="percentage" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Present vs Absent student counts per month</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatPercent} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="present" name="Present Count" fill="hsl(var(--primary))" stackId="a" />
                <Bar yAxisId="left" dataKey="absent" name="Absent Count" fill="hsl(var(--destructive))" stackId="a" />
                <Line yAxisId="right" type="monotone" dataKey="percentage" name="Attendance %" stroke="hsl(var(--chart-4))" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {isAdmin && deptComparison && deptComparison.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Department Comparison</CardTitle>
              <CardDescription>Overall attendance percentage by department</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptComparison} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="department" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Bar dataKey="percentage" name="Attendance %" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
