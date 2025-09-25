import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema, type UpdateUserData, type User } from "@shared/schema";

// Extended User type with profile fields that should be available from API
interface UserProfile extends User {
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User as UserIcon, Camera } from "lucide-react";
import { Link } from "wouter";

export default function UserProfile() {
  const { user, logout } = useCustomAuth();
  const { toast } = useToast();

  // Fetch current user profile data
  const { data: profileData, isLoading, error, refetch } = useQuery<UserProfile>({
    queryKey: ['/api/users/me'],
    enabled: !!user
  });

  // Setup form with current profile data
  const form = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      profileImageUrl: "",
      password: "",
    },
  });

  // Reset form when profile data loads
  React.useEffect(() => {
    if (profileData) {
      form.reset({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        profileImageUrl: profileData.profileImageUrl || "",
        password: "", // Always start with empty password
      });
    }
  }, [profileData, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserData) => {
      // Filter out empty values
      const updateData: Partial<UpdateUserData> = {};
      if (data.firstName?.trim()) updateData.firstName = data.firstName.trim();
      if (data.lastName?.trim()) updateData.lastName = data.lastName.trim();
      if (data.profileImageUrl?.trim()) updateData.profileImageUrl = data.profileImageUrl.trim();
      if (data.password?.trim()) updateData.password = data.password.trim();

      if (Object.keys(updateData).length === 0) {
        throw new Error("No changes to save");
      }

      return apiRequest('PATCH', '/api/users/me', updateData);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      // Clear password field after successful update
      form.setValue("password", "");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateUserData) => {
    updateProfileMutation.mutate(data);
  };

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your personal information</p>
            </div>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your personal information</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-destructive">Failed to load profile data</p>
                <Button onClick={() => refetch()} data-testid="button-retry">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim() || profileData?.email || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your personal information</p>
          </div>
        </div>

        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <UserIcon className="h-5 w-5" />
              Your Profile
            </CardTitle>
            <CardDescription>
              Update your personal information and account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Profile Display */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-16 w-16">
                {profileData?.profileImageUrl ? (
                  <AvatarImage src={profileData.profileImageUrl} alt="Profile" />
                ) : null}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium" data-testid="text-current-name">{displayName}</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-current-email">{profileData?.email}</p>
                <p className="text-xs text-muted-foreground capitalize" data-testid="text-current-role">
                  {profileData?.role || 'contributor'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Edit Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter your first name"
                            data-testid="input-first-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter your last name"
                            data-testid="input-last-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="profileImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Profile Image URL
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="url"
                          placeholder="https://example.com/profile-image.jpg"
                          data-testid="input-profile-image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password"
                          placeholder="Leave empty to keep current password"
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      if (profileData) {
                        form.reset({
                          firstName: profileData.firstName || "",
                          lastName: profileData.lastName || "",
                          profileImageUrl: profileData.profileImageUrl || "",
                          password: "", // Always reset password to empty
                        });
                      }
                    }}
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-reset"
                  >
                    Reset
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Email Address</Label>
                <p className="font-medium" data-testid="text-account-email">{profileData?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Account Role</Label>
                <p className="font-medium capitalize" data-testid="text-account-role">{profileData?.role || 'contributor'}</p>
              </div>
              {profileData?.createdAt && (
                <div>
                  <Label className="text-muted-foreground">Member Since</Label>
                  <p className="font-medium" data-testid="text-member-since">
                    {new Date(profileData.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}