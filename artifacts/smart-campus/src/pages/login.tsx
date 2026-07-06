import React from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useLogin } from '@workspace/api-client-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, KeyRound, UserRound, GraduationCap } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  username: z.string().min(1, "This field is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(['faculty', 'student', 'admin']),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

function UsernameField({ label, placeholder, form }: { label: string; placeholder: string; form: any }) {
  return (
    <FormField control={form.control} name="username" render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input placeholder={placeholder} autoComplete="username" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function PasswordField({ form, showForgot }: { form: any; showForgot?: boolean }) {
  return (
    <FormField control={form.control} name="password" render={({ field }) => (
      <FormItem>
        <div className="flex items-center justify-between">
          <FormLabel>Password</FormLabel>
          {showForgot && (
            <span className="text-xs text-primary cursor-pointer hover:underline" onClick={(e) => e.preventDefault()}>
              Forgot Password?
            </span>
          )}
        </div>
        <FormControl>
          <div className="relative">
            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="password" placeholder="••••••••" className="pl-9" autoComplete="current-password" {...field} />
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function RememberMeField({ form }: { form: any }) {
  return (
    <FormField control={form.control} name="rememberMe" render={({ field }) => (
      <FormItem className="flex items-center gap-2 space-y-0">
        <FormControl>
          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
        </FormControl>
        <FormLabel className="font-normal text-sm cursor-pointer">Remember me</FormLabel>
      </FormItem>
    )} />
  );
}

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '', role: 'faculty', rememberMe: false },
  });

  const onSubmit = (data: FormValues) => {
    loginMutation.mutate(
      { data: { username: data.username, password: data.password, role: data.role } },
      {
        onSuccess: (res) => {
          if (data.rememberMe) {
            localStorage.setItem('auth_remember', '1');
          }
          login(res.user, res.token);
          toast({ title: "Login successful", description: `Welcome back, ${res.user.name}!` });
          setLocation('/dashboard');
        },
        onError: () => {
          toast({ title: "Login failed", description: "Invalid credentials. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex bg-muted/40">
      {/* Left panel */}
      <div className="flex-1 hidden lg:flex bg-primary flex-col justify-between p-12 text-primary-foreground">
        <div>
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight mb-8">
            <div className="w-10 h-10 bg-white text-primary flex items-center justify-center rounded font-bold text-sm">
              AU
            </div>
            Anna University
          </div>
          <h1 className="text-5xl font-bold leading-tight mt-20 max-w-xl">
            Smart Curriculum Activity & Attendance App
          </h1>
          <p className="text-primary-foreground/80 text-lg mt-6 max-w-md">
            The central nervous system for academic management, tracking attendance, monitoring performance, and scheduling activities.
          </p>
        </div>
        <p className="text-primary-foreground/60 text-sm">
          &copy; {new Date().getFullYear()} Anna University. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <Tabs
                defaultValue="faculty"
                className="w-full"
                onValueChange={(val) => {
                  form.setValue('role', val as FormValues['role']);
                  form.clearErrors();
                  form.reset({ ...form.getValues(), role: val as FormValues['role'], username: '', password: '' });
                }}
              >
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="faculty" className="text-xs">
                    <UserRound className="w-3 h-3 mr-1.5" /> Faculty
                  </TabsTrigger>
                  <TabsTrigger value="student" className="text-xs">
                    <GraduationCap className="w-3 h-3 mr-1.5" /> Student
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="text-xs">
                    <Building2 className="w-3 h-3 mr-1.5" /> Admin
                  </TabsTrigger>
                </TabsList>

                {/* FACULTY TAB */}
                <TabsContent value="faculty" className="space-y-4 mt-0">
                  <UsernameField label="Email or Faculty ID" placeholder="Enter your email or Faculty ID" form={form} />
                  <PasswordField form={form} showForgot />
                  <RememberMeField form={form} />
                  <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing in…" : "Sign In as Faculty"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    New faculty member?{' '}
                    <Link href="/register/faculty" className="text-primary font-medium hover:underline">
                      Register as Faculty
                    </Link>
                  </p>
                </TabsContent>

                {/* STUDENT TAB */}
                <TabsContent value="student" className="space-y-4 mt-0">
                  <UsernameField label="Email or Register Number" placeholder="Enter your email or Register Number" form={form} />
                  <PasswordField form={form} showForgot />
                  <RememberMeField form={form} />
                  <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing in…" : "Sign In as Student"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    New student?{' '}
                    <Link href="/register/student" className="text-primary font-medium hover:underline">
                      Register as Student
                    </Link>
                  </p>
                </TabsContent>

                {/* ADMIN TAB */}
                <TabsContent value="admin" className="space-y-4 mt-0">
                  <UsernameField label="Username" placeholder="Enter admin username" form={form} />
                  <PasswordField form={form} />
                  <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing in…" : "Sign In as Admin"}
                  </Button>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
