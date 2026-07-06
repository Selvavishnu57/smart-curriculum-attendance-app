import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useListAttendance, useMarkBulkAttendance, useListSubjects, useListDepartments, useListStudents } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ClipboardCheck, Search, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

export default function Attendance() {
  const { user } = useAuth();
  const isAdminOrFaculty = user?.role === 'admin' || user?.role === 'faculty';
  const { toast } = useToast();

  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [department, setDepartment] = useState<string>('');
  const [year, setYear] = useState<string>('1');
  const [section, setSection] = useState<string>('A');
  const [subjectId, setSubjectId] = useState<string>('');

  const { data: departments } = useListDepartments({ query: { queryKey: ['/api/departments'] } });
  const { data: subjects } = useListSubjects(
    { department: department || undefined, semester: parseInt(year) * 2 - 1 },
    { query: { enabled: !!department, queryKey: ['/api/subjects', { department, semester: parseInt(year) * 2 - 1 }] } }
  );

  const { data: studentsData, isLoading: studentsLoading } = useListStudents(
    { department, year: parseInt(year), section, limit: 100 },
    { query: { enabled: !!department && !!year && !!section, queryKey: ['/api/students', { department, year: parseInt(year), section, limit: 100 }] } }
  );

  const { data: existingAttendance } = useListAttendance(
    { subjectId: parseInt(subjectId), date, limit: 100 },
    { query: { enabled: !!subjectId && !!date, queryKey: ['/api/attendance', { subjectId: parseInt(subjectId), date, limit: 100 }] } }
  );

  const markBulkAttendance = useMarkBulkAttendance();

  const [attendanceState, setAttendanceState] = useState<Record<number, 'present' | 'absent' | 'late'>>({});

  // Initialize attendance state from existing records or default to present
  React.useEffect(() => {
    if (studentsData?.students) {
      const newState: Record<number, 'present' | 'absent' | 'late'> = {};
      
      studentsData.students.forEach(student => {
        // Find existing record
        const existing = existingAttendance?.records?.find(r => r.studentId === student.id);
        newState[student.id] = existing ? existing.status as any : 'present';
      });
      
      setAttendanceState(newState);
    }
  }, [studentsData, existingAttendance]);

  const handleMarkAll = (status: 'present' | 'absent') => {
    if (!studentsData?.students) return;
    const newState = { ...attendanceState };
    studentsData.students.forEach(s => {
      newState[s.id] = status;
    });
    setAttendanceState(newState);
  };

  const handleSave = () => {
    if (!subjectId) {
      toast({ title: "Select a subject", variant: "destructive" });
      return;
    }

    const records = Object.entries(attendanceState).map(([studentId, status]) => ({
      studentId: parseInt(studentId),
      status
    }));

    markBulkAttendance.mutate(
      { 
        data: {
          subjectId: parseInt(subjectId),
          date,
          method: 'manual',
          records
        } 
      },
      {
        onSuccess: (res) => {
          toast({ title: "Attendance saved", description: `Saved ${res.total} records.` });
        }
      }
    );
  };

  if (!isAdminOrFaculty) {
    return <div>Student attendance view goes here.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mark Attendance</h2>
        <p className="text-muted-foreground">Select class details to mark today's attendance.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map(d => (
                    <SelectItem key={d.id} value={d.code}>{d.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                  <SelectItem value="C">Section C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!department}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.code} - {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {department && year && section && subjectId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Class List</CardTitle>
              <CardDescription>
                {studentsData?.students.length || 0} students found.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('present')}>
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('absent')}>
                Mark All Absent
              </Button>
              <Button size="sm" onClick={handleSave} disabled={markBulkAttendance.isPending}>
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Save Attendance
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading students...</div>
            ) : studentsData?.students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                No students found for this class.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Reg No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Attendance Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsData?.students.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-xs">{student.registerNumber}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-right">
                        <RadioGroup 
                          className="flex justify-end gap-4" 
                          value={attendanceState[student.id] || 'present'}
                          onValueChange={(val: 'present' | 'absent' | 'late') => {
                            setAttendanceState(prev => ({ ...prev, [student.id]: val }));
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="present" id={`p-${student.id}`} className="text-green-600 border-green-600" />
                            <Label htmlFor={`p-${student.id}`} className="text-green-600 cursor-pointer">P</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="absent" id={`a-${student.id}`} className="text-destructive border-destructive" />
                            <Label htmlFor={`a-${student.id}`} className="text-destructive cursor-pointer">A</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="late" id={`l-${student.id}`} className="text-yellow-600 border-yellow-600" />
                            <Label htmlFor={`l-${student.id}`} className="text-yellow-600 cursor-pointer">L</Label>
                          </div>
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
