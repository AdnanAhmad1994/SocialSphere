import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Settings as SettingsIcon, Save, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { settingsSchema, type Settings, type User } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function AdminSettings() {
  const { user, logout } = useCustomAuth();
  const { toast } = useToast();

  const { data: settings, isLoading, error } = useQuery<Settings>({
    queryKey: ['/api/admin/settings'],
  });

  // Handle query errors with useEffect
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      captionMax: 500,
      maxImages: 4,
      requiresApproval: true,
      showMetricsToContributors: false,
    },
  });

  // Reset form when settings load
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<Settings>) => apiRequest('PUT', '/api/admin/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      // Also invalidate public settings cache used by PostSubmissionForm
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: Settings) => {
    updateSettingsMutation.mutate(data);
  };

  const handleReset = () => {
    if (settings) {
      form.reset(settings);
    }
  };

  // Watch for form changes
  const watchedValues = form.watch();
  const hasChanges = settings && JSON.stringify(watchedValues) !== JSON.stringify(settings);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          user={user ? { 
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User', 
            role: user.role as 'admin' | 'contributor',
            avatar: user.profileImageUrl 
          } : undefined}
          onLogout={logout}
        />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user ? { 
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User', 
          role: user.role as 'admin' | 'contributor',
          avatar: user.profileImageUrl 
        } : undefined}
        onLogout={logout}
      />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Organization Settings</h1>
            <p className="text-muted-foreground">Configure global settings for the social media portal</p>
          </div>
        </div>

        {/* Settings Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Content Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="captionMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Caption Length</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={100}
                          max={1000}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? undefined : parseInt(value));
                          }}
                          data-testid="input-max-caption-length"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of characters allowed in post captions (100-1000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxImages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Image Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? undefined : parseInt(value));
                          }}
                          data-testid="input-max-image-count"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of images per post (1-10)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Require Approval
                        </FormLabel>
                        <FormDescription>
                          All posts must be approved by an admin before publishing
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-require-approval"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="showMetricsToContributors"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Show Performance Metrics to Contributors
                        </FormLabel>
                        <FormDescription>
                          Allow contributors to view their own performance statistics
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-show-metrics"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges || updateSettingsMutation.isPending}
                data-testid="button-reset"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || updateSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}