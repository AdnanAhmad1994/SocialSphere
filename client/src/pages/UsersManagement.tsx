import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Filter, Users, UserPlus, Mail, Calendar, Shield, UserCheck } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import type { User } from "@shared/schema";

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { user, logout } = useCustomAuth();

  // Mock user data - replace with actual API call
  const mockUsers: any[] = [
    {
      id: "1",
      firstName: "Admin",
      lastName: "User",
      email: "admin@riphah.edu.pk",
      role: "admin",
      createdAt: new Date().toISOString(),
      profileImageUrl: null
    },
    {
      id: "2", 
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@riphah.edu.pk",
      role: "contributor",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      profileImageUrl: null
    }
  ];

  const { data: stats } = useQuery<{
    totalPosts: number;
    pendingPosts: number;
    approvedPosts: number;
    rejectedPosts: number;
    totalUsers: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const filteredUsers = mockUsers.filter((user: any) => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive text-destructive-foreground';
      case 'contributor': return 'bg-chart-1 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user ? { 
          name: `${user.firstName} ${user.lastName}`, 
          role: user.role as 'admin' | 'contributor',
          avatar: user.profileImageUrl 
        } : undefined}
        onLogout={logout}
      />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
            <p className="text-muted-foreground">Manage user accounts and access permissions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" data-testid="badge-total-users">{stats?.totalUsers || 0}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium">Total Users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Shield className="h-4 w-4 text-destructive" />
                <Badge variant="destructive" data-testid="badge-admin-users">{mockUsers.filter(u => u.role === 'admin').length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium">Administrators</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <UserCheck className="h-4 w-4 text-chart-1" />
                <Badge className="bg-chart-1 text-white" data-testid="badge-contributor-users">{mockUsers.filter(u => u.role === 'contributor').length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium">Contributors</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-role-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="contributor">Contributor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "No users are registered yet"
                }
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {mockUsers.length} users
                </p>
              </div>
              
              <div className="grid gap-4">
                {filteredUsers.map((userData: any) => (
                  <Card key={userData.id} className="hover-elevate">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={userData.profileImageUrl} alt={userData.firstName} />
                            <AvatarFallback>
                              {userData.firstName?.[0]}{userData.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground">
                                {userData.firstName} {userData.lastName}
                              </h3>
                              <Badge className={getRoleColor(userData.role)}>
                                {userData.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                                {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {userData.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Joined {formatDate(userData.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {user?.role === 'admin' && (
                            <>
                              <Button variant="outline" size="sm" data-testid={`button-edit-user-${userData.id}`}>
                                Edit
                              </Button>
                              {userData.role !== 'admin' && (
                                <Button variant="destructive" size="sm" data-testid={`button-delete-user-${userData.id}`}>
                                  Remove
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        {user?.role === 'admin' && (
          <Card className="border-chart-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-chart-1" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage user access through the email whitelist system. Add emails to allow contributors to register.
              </p>
              <Link href="/">
                <Button variant="outline" data-testid="button-manage-whitelist">
                  <Mail className="h-4 w-4 mr-2" />
                  Manage Email Whitelist
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}