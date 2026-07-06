import React from 'react';
import { useAuth } from '@/lib/auth';
import { useListDepartments } from '@workspace/api-client-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Building2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Departments() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: deptData, isLoading } = useListDepartments({
    query: { queryKey: ['/api/departments'] }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">Manage university departments and academic units.</p>
        </div>
        
        {isAdmin && (
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Department
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Head of Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-48 animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-32 animate-pulse" /></TableCell>
                    <TableCell><div className="h-8 bg-muted rounded w-8 ml-auto animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : deptData?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    No departments found.
                  </TableCell>
                </TableRow>
              ) : (
                deptData?.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.code}</TableCell>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell>{dept.hodName || 'Not Assigned'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!isAdmin}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
