import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import PostCard from "@/components/PostCard";
import Header from "@/components/Header";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import type { Post, User } from "@shared/schema";

export default function PendingPosts() {
  const [searchTerm, setSearchTerm] = useState("");
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

  const pendingPosts = posts.filter((post: any) => {
    const isPending = post.status === 'pending';
    const matchesSearch = post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.author?.toLowerCase().includes(searchTerm.toLowerCase());
    return isPending && matchesSearch;
  });

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
            <h1 className="text-3xl font-bold text-foreground">Pending Posts</h1>
            <p className="text-muted-foreground">Review and approve posts awaiting moderation</p>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="border-l-4 border-l-chart-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-chart-2" />
              Posts Awaiting Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-chart-2">
                {stats?.pendingPosts || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                posts need your attention
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search pending posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-pending"
          />
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-pending-posts">
              <p className="text-muted-foreground">Loading pending posts...</p>
            </div>
          ) : pendingPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                {searchTerm ? (
                  <Search className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <Clock className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? "No matching pending posts" : "All caught up!"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search criteria"
                  : "No posts are currently pending review"
                }
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pendingPosts.length} pending post{pendingPosts.length !== 1 ? 's' : ''}
                </p>
                <Badge className="bg-chart-2 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  Needs Review
                </Badge>
              </div>
              
              <div className="space-y-4">
                {pendingPosts.map((post: any) => (
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

        {/* Quick Action Notice */}
        {pendingPosts.length > 0 && user?.role === 'admin' && (
          <Card className="border-chart-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-chart-2" />
                <div>
                  <p className="text-sm font-medium text-foreground">Quick Actions Available</p>
                  <p className="text-xs text-muted-foreground">
                    You can approve or reject posts directly from this page
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}