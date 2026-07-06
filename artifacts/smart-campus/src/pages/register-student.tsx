import React from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { COLLEGE_LIST } from '@/lib/colleges';
import { DepartmentCombobox } from '@/components/department-combobox';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, ArrowLeft } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, "Full name is required"),
  registerNumber: z.string().min(3, "Register number is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  departmentId: z.string().min(1, "Department is required"),
  customDepartment: z.string().optional(),
  year: z.string().min(1, "Year is required"),
  section: z.string().min(1, "Section is required"),
  collegeName: z.string().min(1, "College name is required"),
  customCollege: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  address: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(d => d.departmentId !== "other" || (d.customDepartment && d.customDepartment.trim().length > 0), {
  message: "Please enter your department name",
  path: ["customDepartment"],
});

type FormValues = z.infer<typeof schema>;

export default function RegisterStudent() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', registerNumber: '', email: '', phone: '',
      password: '', confirmPassword: '', departmentId: '',
      customDepartment: '', year: '', section: '', collegeName: '',
      customCollege: '', gender: '', dateOfBirth: '',
      parentName: '', parentPhone: '', address: '',
    },
  });

  const watchedCollege = form.watch('collegeName');
  const watchedDeptId = form.watch('departmentId');
  const watchedCustomDept = form.watch('customDepartment');

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const collegeName = data.collegeName === 'Other'
        ? (data.customCollege?.trim() || 'Other')
        : data.collegeName;

      const body: Record<string, unknown> = {
        name: data.name,
        registerNumber: data.registerNumber,
        email: data.email,
        phone: data.phone || null,
        password: data.password,
        year: data.year,
        section: data.section,
        collegeName,
        gender: data.gender || null,
        dateOfBirth: data.dateOfBirth || null,
        parentName: data.parentName || null,
        parentPhone: data.parentPhone || null,
        address: data.address || null,
      };
      if (data.departmentId === 'other') {
        body.customDepartment = data.customDepartment;
      } else {
        body.departmentId = data.departmentId;
      }

      const res = await fetch(`${import.meta.env.BASE_URL}api/auth/register/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Registration failed", description: json.error ?? "Please try again.", variant: "destructive" });
        return;
      }
      login(json.user, json.token);
      toast({ title: "Registration successful!", description: `Welcome, ${json.user.name}!` });
      setLocation('/dashboard');
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-background rounded-xl shadow-lg p-8 space-y-6">
        <div className="space-y-1">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Student Registration</h1>
              <p className="text-sm text-muted-foreground">Create your account — log in immediately after</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl><Input placeholder="Arun Kumar" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="registerNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Register Number *</FormLabel>
                  <FormControl><Input placeholder="311722104001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl><Input type="email" placeholder="arun@student.edu.in" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Searchable Department Combobox */}
              <div className="sm:col-span-2">
                <FormField control={form.control} name="departmentId" render={() => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <DepartmentCombobox
                      value={watchedDeptId}
                      customValue={watchedCustomDept}
                      onChange={(id) => {
                        form.setValue('departmentId', id, { shouldValidate: true });
                        if (id !== 'other') form.setValue('customDepartment', '');
                      }}
                      onCustomChange={(val) => form.setValue('customDepartment', val, { shouldValidate: true })}
                      placeholder="Search and select department"
                    />
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem>
                  <FormLabel>Year *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="section" render={({ field }) => (
                <FormItem>
                  <FormLabel>Section *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['A', 'B', 'C', 'D', 'E'].map(s => (
                        <SelectItem key={s} value={s}>Section {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="parentName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent / Guardian Name</FormLabel>
                  <FormControl><Input placeholder="Parent name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="parentPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Phone Number</FormLabel>
                  <FormControl><Input placeholder="Parent phone" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl><Input type="password" placeholder="Min. 8 characters" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password *</FormLabel>
                  <FormControl><Input type="password" placeholder="Repeat password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="sm:col-span-2">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input placeholder="Your address (optional)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* College Name */}
              <div className="sm:col-span-2">
                <FormField control={form.control} name="collegeName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>College Name *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select your college" /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {COLLEGE_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {watchedCollege === 'Other' && (
                <div className="sm:col-span-2">
                  <FormField control={form.control} name="customCollege" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter College Name *</FormLabel>
                      <FormControl><Input placeholder="Your college name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Register as Student"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
