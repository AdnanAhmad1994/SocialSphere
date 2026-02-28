import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema, emailLoginSchema, type AdminLoginData, type EmailLoginData } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Mail, Lock, Users, Eye, EyeOff } from "lucide-react";

interface CustomLoginFormProps {
  onLoginSuccess: () => void;
}

export default function CustomLoginForm({ onLoginSuccess }: CustomLoginFormProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("admin");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [seedEmail, setSeedEmail] = useState('admin@example.com');
  const [seedPassword, setSeedPassword] = useState('Admin123!');

  const adminForm = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailForm = useForm<EmailLoginData>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleAdminLogin = async (data: AdminLoginData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Store JWT token if provided for Vercel deployment compatibility
        if (result.token) {
          localStorage.setItem('auth-token', result.token);
        }
        onLoginSuccess();
        // Redirect to dashboard after successful login
        setLocation('/');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Admin login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedAdmin = async () => {
    setSeedStatus(null);
    setError(null);
    try {
      const resp = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-seed-token': 'dev-seed',
        },
        body: JSON.stringify({
          email: seedEmail || 'admin@example.com',
          password: seedPassword || 'Admin123!',
          firstName: 'Admin',
          lastName: 'User',
        }),
      });
      const result = await resp.json();
      if (resp.ok && result?.success) {
        adminForm.setValue('email', seedEmail || 'admin@example.com');
        adminForm.setValue('password', seedPassword || 'Admin123!');
        setSeedStatus(`Admin user created (${seedEmail}). You can now sign in.`);
      } else {
        setError(result?.message || 'Failed to seed admin. Ensure the server was started with ADMIN_SEED_TOKEN=dev-seed');
      }
    } catch (e) {
      setError('Network error while seeding admin');
    }
  };

  const handleEmailLogin = async (data: EmailLoginData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/email-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Store JWT token if provided for Vercel deployment compatibility
        if (result.token) {
          localStorage.setItem('auth-token', result.token);
        }
        onLoginSuccess();
        // Redirect to dashboard after successful login
        setLocation('/');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Email login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access the Social Media Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" data-testid="tab-admin-login">
                <Shield className="h-4 w-4 mr-2" />
                Administrator
              </TabsTrigger>
              <TabsTrigger value="contributor" data-testid="tab-contributor-login">
                <Users className="h-4 w-4 mr-2" />
                Contributor
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert className="mt-4 border-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Admin Login Tab */}
            <TabsContent value="admin" className="space-y-4">
              <div className="text-center">
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                  Admin Access Required
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Sign in with your administrator credentials
                </p>
              </div>

              <Form {...adminForm}>
                <form onSubmit={adminForm.handleSubmit(handleAdminLogin)} className="space-y-4">
                  <FormField
                    control={adminForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="admin@example.com"
                              className="pl-10"
                              data-testid="input-admin-email"
                              autoComplete="email"
                              disabled={isLoading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showAdminPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="pl-10"
                              data-testid="input-admin-password"
                              autoComplete="current-password"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowAdminPassword((s) => !s)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              aria-label={showAdminPassword ? "Hide password" : "Show password"}
                              data-testid="toggle-admin-password-visibility"
                            >
                              {showAdminPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-destructive hover:bg-destructive/90"
                    disabled={isLoading}
                    data-testid="button-admin-login"
                  >
                    {isLoading ? "Signing in..." : "Sign in as Administrator"}
                  </Button>
                </form>
              </Form>

              {import.meta.env.DEV && (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      value={seedEmail}
                      onChange={(e) => setSeedEmail(e.target.value)}
                      placeholder="admin email (e.g., admin@riphah.edu.pk)"
                      data-testid="input-seed-email"
                    />
                    <Input
                      value={seedPassword}
                      onChange={(e) => setSeedPassword(e.target.value)}
                      placeholder="optional password"
                      data-testid="input-seed-password"
                    />
                  </div>
                  {seedStatus && (
                    <p className="text-xs text-green-600">{seedStatus}</p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSeedAdmin}
                    data-testid="button-seed-admin"
                  >
                    Seed Admin (dev)
                  </Button>
                  <p className="text-[11px] text-muted-foreground">Uses token 'dev-seed'. Start server with ADMIN_SEED_TOKEN=dev-seed.</p>
                </div>
              )}
            </TabsContent>

            {/* Contributor Login Tab */}
            <TabsContent value="contributor" className="space-y-4">
              <div className="text-center">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Whitelisted Access
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your authorized email address
                </p>
              </div>

              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.email@riphah.edu.pk"
                              className="pl-10"
                              data-testid="input-contributor-email"
                              disabled={isLoading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-contributor-login"
                  >
                    {isLoading ? "Signing in..." : "Sign in as Contributor"}
                  </Button>
                </form>
              </Form>

              <div className="text-center text-xs text-muted-foreground">
                <p>Don't have access? Contact your administrator to get whitelisted.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}