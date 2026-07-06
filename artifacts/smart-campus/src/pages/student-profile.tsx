import React from 'react';
import { useParams } from 'wouter';
import { useGetStudent, useGetStudentAttendanceSummary, useListAttendance } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Mail, GraduationCap, Building2, MapPin, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentProfile() {
  const params = useParams();
  const id = parseInt(params.id || '0');

  const { data: student, isLoading: studentLoading } = useGetStudent(id, {
    query: { enabled: !!id, queryKey: ['/api/students', id] }
  });

  const { data: summary, isLoading: summaryLoading } = useGetStudentAttendanceSummary(id, {
    query: { enabled: !!id, queryKey: ['/api/students', id, 'attendance-summary'] }
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useListAttendance(
    { studentId: id, limit: 15 },
    { query: { enabled: !!id, queryKey: ['/api/attendance', { studentId: id, limit: 15 }] } }
  );

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-destructive bg-destructive/10';
  };

  if (studentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-1" />
          <Skeleton className="h-64 col-span-2" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20 text-muted-foreground border rounded-xl border-dashed">
        Student not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Card */}
        <Card className="w-full md:w-1/3 shrink-0">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-sm">
              <AvatarImage src={student.photoUrl || ''} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {student.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p className="font-mono text-muted-foreground">{student.registerNumber}</p>
            
            <div className="mt-4 flex gap-2">
              <Badge variant="secondary">{student.departmentName}</Badge>
              <Badge variant="outline">Year {student.year} - Sec {student.section}</Badge>
            </div>

            <div className="w-full mt-6 space-y-3 text-sm text-left">
              {student.email && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{student.email}</span>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{student.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-muted-foreground">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Department of {student.departmentName}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Attendance Summary */}
        <Card className="w-full md:w-2/3">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Cumulative attendance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : summary ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-sm text-muted-foreground mb-1">Overall %</span>
                    <span className={`text-2xl font-bold px-3 py-1 rounded-md ${getAttendanceColor(summary.percentage)}`}>
                      {summary.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-sm text-muted-foreground mb-1">Total Classes</span>
                    <span className="text-2xl font-bold">{summary.totalClasses}</span>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-sm text-muted-foreground mb-1">Present</span>
                    <span className="text-2xl font-bold text-green-600">{summary.present}</span>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-sm text-muted-foreground mb-1">Absent</span>
                    <span className="text-2xl font-bold text-destructive">{summary.absent}</span>
                  </div>
                </div>

                {summary.bySubject && summary.bySubject.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-semibold text-sm">By Subject</h4>
                    {summary.bySubject.map(sub => (
                      <div key={sub.subjectId} className="flex items-center">
                        <div className="w-[120px] text-sm font-medium truncate" title={sub.subjectName}>
                          {sub.subjectName}
                        </div>
                        <div className="flex-1 mx-4 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full" 
                            style={{ width: `${sub.percentage}%` }}
                          />
                        </div>
                        <div className="w-[40px] text-right text-sm font-medium">
                          {sub.percentage.toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">No attendance data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance History</CardTitle>
          <CardDescription>Latest records marked for this student.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : attendanceData?.records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No recent history found.
                  </TableCell>
                </TableRow>
              ) : (
                attendanceData?.records.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(record.date), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>{record.subjectName}</TableCell>
                    <TableCell className="capitalize">{record.method}</TableCell>
                    <TableCell className="text-right">
                      {record.status === 'present' ? (
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">Present</Badge>
                      ) : record.status === 'absent' ? (
                        <Badge variant="outline" className="text-destructive bg-destructive/10 border-destructive/20">Absent</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900">Late</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
