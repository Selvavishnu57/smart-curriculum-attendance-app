import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useListTimetable, useListDepartments } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, UserSquare } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Timetable() {
  const { user } = useAuth();
  
  // Default to user's department/section if student, else IT/3/A as placeholder
  const [department, setDepartment] = useState<string>('CSE');
  const [year, setYear] = useState<string>('3');
  const [section, setSection] = useState<string>('A');

  const { data: departments } = useListDepartments({ query: { queryKey: ['/api/departments'] } });

  const { data: timetable, isLoading } = useListTimetable(
    { department, year: parseInt(year), section },
    { query: { enabled: !!department && !!year && !!section, queryKey: ['/api/timetable', { department, year: parseInt(year), section }] } }
  );

  const entriesByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable?.filter(t => t.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)) || [];
    return acc;
  }, {} as Record<string, typeof timetable>);

  // Simple time formatter
  const formatTime = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Class Timetable</h2>
        <p className="text-muted-foreground">Weekly schedule for lectures and practicals.</p>
      </div>

      <div className="bg-card p-4 rounded-lg border grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase">Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {departments?.map(dept => (
                <SelectItem key={dept.id} value={dept.code}>{dept.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase">Section</Label>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger>
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Section A</SelectItem>
              <SelectItem value="B">Section B</SelectItem>
              <SelectItem value="C">Section C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading schedule...</div>
      ) : (
        <div className="grid gap-6">
          {DAYS.map(day => {
            const dayEntries = entriesByDay[day];
            if (!dayEntries || dayEntries.length === 0) return null;
            
            const isToday = day === currentDay;

            return (
              <Card key={day} className={`overflow-hidden ${isToday ? 'border-primary shadow-sm' : ''}`}>
                <div className={`px-4 py-3 border-b font-medium ${isToday ? 'bg-primary/10 text-primary' : 'bg-muted/50'}`}>
                  {day} {isToday && <span className="ml-2 text-xs uppercase tracking-wider font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Today</span>}
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {dayEntries.map(entry => (
                      <div key={entry.id} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/20 transition-colors ${entry.isCurrent ? 'bg-primary/5 relative' : ''}`}>
                        {entry.isCurrent && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                        )}
                        <div className="flex items-center sm:w-48 shrink-0 text-muted-foreground font-mono text-sm gap-2">
                          <Clock className="w-4 h-4" />
                          {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{entry.subjectName}</div>
                          <div className="text-sm font-mono text-muted-foreground mt-0.5">{entry.subjectCode}</div>
                        </div>
                        <div className="flex flex-col gap-1.5 sm:w-64 shrink-0 sm:items-end text-sm">
                          {entry.facultyName && (
                            <div className="flex items-center text-muted-foreground">
                              <UserSquare className="w-4 h-4 mr-2 sm:hidden" />
                              <span className="truncate">{entry.facultyName}</span>
                            </div>
                          )}
                          {entry.room && (
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2 sm:hidden" />
                              <span>Room {entry.room}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {Object.values(entriesByDay).every(entries => !entries || entries.length === 0) && (
            <div className="text-center py-20 text-muted-foreground border rounded-xl border-dashed">
              No classes scheduled for this selection.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
