import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useListSubjects, useListDepartments } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookCopy } from 'lucide-react';

export default function Curriculum() {
  const [department, setDepartment] = useState<string>('CSE');
  const [semester, setSemester] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: departments } = useListDepartments({ query: { queryKey: ['/api/departments'] } });

  const { data: subjects, isLoading } = useListSubjects(
    { 
      department: department !== 'all' ? department : undefined,
      semester: semester !== 'all' ? parseInt(semester) : undefined,
      search: search || undefined
    },
    { query: { queryKey: ['/api/subjects', { department, semester, search }] } }
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Anna University Curriculum</h2>
        <p className="text-muted-foreground">Browse course syllabus, credits, and requirements.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subject code or name..."
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments?.map(dept => (
                <SelectItem key={dept.id} value={dept.code}>{dept.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead>Subject Name</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-center">Sem</TableHead>
                <TableHead className="text-center hidden sm:table-cell">L-T-P</TableHead>
                <TableHead className="text-center font-bold text-primary">C</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 bg-muted rounded w-20 animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-48 animate-pulse" /></TableCell>
                    <TableCell className="hidden md:table-cell"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                    <TableCell className="text-center"><div className="h-4 bg-muted rounded w-8 mx-auto animate-pulse" /></TableCell>
                    <TableCell className="text-center hidden sm:table-cell"><div className="h-4 bg-muted rounded w-12 mx-auto animate-pulse" /></TableCell>
                    <TableCell className="text-center"><div className="h-4 bg-muted rounded w-8 mx-auto animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : subjects?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    <BookCopy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    No subjects found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                subjects?.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-mono text-sm font-medium">{subject.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{subject.name}</div>
                      <div className="text-xs text-muted-foreground block md:hidden mt-1">{subject.category}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs font-normal bg-muted/50">
                        {subject.category || 'Core'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{subject.semester}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell text-muted-foreground whitespace-nowrap">
                      {subject.lectureHours || 0} - 0 - {subject.practicalHours || 0}
                    </TableCell>
                    <TableCell className="text-center font-bold text-primary">{subject.credits}</TableCell>
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
