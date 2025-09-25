import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Filter, FileText, Clock, Check, X } from "lucide-react";
import { Link } from "wouter";
import PostCard from "@/components/PostCard";
import Header from "@/components/Header";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import type { Post, User } from "@shared/schema";

export default function AllPosts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user, logout } = useCustomAuth();

  const { data: posts = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/posts'],
  });

  const { data: stats } = useQuery<{
    totalPosts: number;
    pendingPosts: number;
    approvedPosts: number;
    rejectedPosts: number;
    totalUsers: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const filteredPosts = posts.filter((post: any) => {
    const matchesSearch = post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-chart-2 text-white';
      case 'approved': return 'bg-chart-1 text-white';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
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
            <h1 className="text-3xl font-bold text-foreground">All Posts</h1>
            <p className="text-muted-foreground">Manage and review all social media posts</p>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary" data-testid="badge-total">{stats.totalPosts}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium">Total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Clock className="h-4 w-4 text-chart-2" />
                  <Badge className="bg-chart-2 text-white" data-testid="badge-pending">{stats.pendingPosts}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium">Pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Check className="h-4 w-4 text-chart-1" />
                  <Badge className="bg-chart-1 text-white" data-testid="badge-approved">{stats.approvedPosts}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium">Approved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <X className="h-4 w-4 text-destructive" />
                  <Badge variant="destructive" data-testid="badge-rejected">{stats.rejectedPosts}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium">Rejected</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search posts by caption or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-posts">
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No posts found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "No posts have been submitted yet"
                }
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPosts.length} of {posts.length} posts
                </p>
              </div>
              
              <div className="space-y-4">
                {filteredPosts.map((post: any) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    currentUserRole={user?.role as 'admin' | 'contributor'}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}