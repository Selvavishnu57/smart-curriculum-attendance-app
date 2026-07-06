import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useListFaculty, useListDepartments } from '@workspace/api-client-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Filter, MoreHorizontal } from 'lucide-react';

export default function Faculty() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<string>('all');
  
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: deptData } = useListDepartments({
    query: { queryKey: ['/api/departments'] }
  });

  const { data: facultyData, isLoading } = useListFaculty(
    { 
      search: search || undefined, 
      department: department !== 'all' ? department : undefined,
    },
    { query: { queryKey: ['/api/faculty', { search, department }] } }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Faculty Directory</h2>
          <p className="text-muted-foreground">Manage and view teaching staff members.</p>
        </div>
        
        {isAdmin && (
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Faculty
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or employee ID..."
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {deptData?.map(dept => (
                <SelectItem key={dept.id} value={dept.code}>{dept.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Faculty Member</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-10 bg-muted rounded w-48 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-24 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-32 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                  <TableCell><div className="h-8 bg-muted rounded w-8 ml-auto animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : facultyData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No faculty members found.
                </TableCell>
              </TableRow>
            ) : (
              facultyData?.map((faculty) => (
                <TableRow key={faculty.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={faculty.photoUrl || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {faculty.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{faculty.name}</div>
                        <div className="text-xs text-muted-foreground">{faculty.email || 'No email'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{faculty.employeeId}</TableCell>
                  <TableCell>{faculty.designation || 'Faculty'}</TableCell>
                  <TableCell>{faculty.departmentName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!isAdmin}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
