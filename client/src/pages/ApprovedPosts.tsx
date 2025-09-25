import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Check, Share, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import PostCard from "@/components/PostCard";
import Header from "@/components/Header";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import type { Post, User } from "@shared/schema";

export default function ApprovedPosts() {
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

  const approvedPosts = posts.filter((post: any) => {
    const isApproved = post.status === 'approved';
    const matchesSearch = post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.author?.toLowerCase().includes(searchTerm.toLowerCase());
    return isApproved && matchesSearch;
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
            <h1 className="text-3xl font-bold text-foreground">Approved Posts</h1>
            <p className="text-muted-foreground">Published content ready for social media sharing</p>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="border-l-4 border-l-chart-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-chart-1" />
              Published Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-chart-1">
                {stats?.approvedPosts || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                posts ready for sharing
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Share className="h-4 w-4" />
              Posts with shareable links can be distributed across social platforms
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search approved posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-approved"
          />
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-approved-posts">
              <p className="text-muted-foreground">Loading approved posts...</p>
            </div>
          ) : approvedPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                {searchTerm ? (
                  <Search className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <Check className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? "No matching approved posts" : "No approved posts yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search criteria"
                  : "Approved posts will appear here once content is reviewed and published"
                }
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {approvedPosts.length} approved post{approvedPosts.length !== 1 ? 's' : ''}
                </p>
                <Badge className="bg-chart-1 text-white">
                  <Check className="h-3 w-3 mr-1" />
                  Published
                </Badge>
              </div>
              
              <div className="space-y-4">
                {approvedPosts.map((post: any) => (
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

        {/* Success Metrics */}
        {approvedPosts.length > 0 && (
          <Card className="border-chart-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-chart-1" />
                <div>
                  <p className="text-sm font-medium text-foreground">Content Performance</p>
                  <p className="text-xs text-muted-foreground">
                    {approvedPosts.length} piece{approvedPosts.length !== 1 ? 's' : ''} of content ready for social media distribution
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