import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3, FileText, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

// Components
import Header from "@/components/Header";
import PostSubmissionForm from "@/components/PostSubmissionForm";
import AdminDashboard from "@/components/AdminDashboard";
import PostCard from "@/components/PostCard";
import EditPostForm from "@/components/EditPostForm";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: 'student' | 'faculty' | 'admin';
}

interface PostAuthor {
  name: string;
  role: 'student' | 'faculty' | 'admin';
  avatar?: string;
}

interface Post {
  id: string;
  caption: string;
  images?: string[];
  authorId: string;
  author: PostAuthor;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  shareableLink?: string;
}

interface Stats {
  totalPosts: number;
  pendingPosts: number;
  approvedPosts: number;
  rejectedPosts: number;
  totalUsers: number;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'submit' | 'admin'>('dashboard');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Handle unauthorized errors globally
  useEffect(() => {
    const handleUnauthorized = (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session Expired",
          description: "You are logged out. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
      }
    };

    // Listen for query errors
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'observerResultsUpdated') {
        const result = event.query.state;
        if (result.error && isUnauthorizedError(result.error as Error)) {
          handleUnauthorized(result.error as Error);
        }
      }
    });

    return unsubscribe;
  }, [toast, queryClient]);

  // Post submission mutation
  const submitPostMutation = useMutation({
    mutationFn: async (postData: { caption: string; images: File[] }) => {
      const formData = new FormData();
      formData.append('caption', postData.caption);
      
      postData.images.forEach((file, index) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Submitted!",
        description: "Your post has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setCurrentView('dashboard');
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Post approval mutations
  const approvePostMutation = useMutation({
    mutationFn: (postId: string) => apiRequest(`/api/posts/${postId}/approve`, 'PUT'),
    onSuccess: () => {
      toast({
        title: "Post Approved",
        description: "The post has been approved and a shareable link has been generated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to approve post.",
        variant: "destructive",
      });
    },
  });

  const rejectPostMutation = useMutation({
    mutationFn: (postId: string) => apiRequest(`/api/posts/${postId}/reject`, 'PUT'),
    onSuccess: () => {
      toast({
        title: "Post Rejected",
        description: "The post has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to reject post.",
        variant: "destructive",
      });
    },
  });

  // Edit post mutation
  const editPostMutation = useMutation({
    mutationFn: async ({ postId, caption, images }: { postId: string; caption: string; images?: File[] }) => {
      const formData = new FormData();
      formData.append('caption', caption);
      
      if (images && images.length > 0) {
        images.forEach((file) => {
          formData.append('images', file);
        });
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Updated",
        description: "Your post has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setEditingPost(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => apiRequest('DELETE', `/api/posts/${postId}`),
    onSuccess: () => {
      toast({
        title: "Post Deleted",
        description: "Your post has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handlePostSubmit = (postData: { caption: string; images: File[]; type: string }) => {
    submitPostMutation.mutate(postData);
  };

  const handleSharePost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post?.shareableLink) {
      navigator.clipboard.writeText(post.shareableLink);
      toast({
        title: "Link Copied",
        description: "The shareable link has been copied to your clipboard.",
      });
    }
  };

  const handleEditPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setEditingPost(post);
    }
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleEditPostSave = async (postId: string, caption: string, images?: File[]) => {
    await editPostMutation.mutateAsync({ postId, caption, images });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // This should not happen due to router logic
  }

  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User';

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={{
          name: userName,
          role: user.role,
          avatar: user.profileImageUrl,
        }}
        pendingCount={stats?.pendingPosts || 0}
        onLogout={handleLogout}
      />
      
      <main className="pb-6">
        {/* Navigation Tabs */}
        <div className="bg-background/95 backdrop-blur border-b sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2"
                data-testid="button-nav-dashboard"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant={currentView === 'submit' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('submit')}
                className="flex items-center gap-2"
                data-testid="button-nav-submit"
              >
                <Plus className="h-4 w-4" />
                Submit Post
              </Button>
              {user.role === 'admin' && (
                <Button
                  variant={currentView === 'admin' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('admin')}
                  className="flex items-center gap-2"
                  data-testid="button-nav-admin"
                >
                  <Users className="h-4 w-4" />
                  Admin Panel
                  {stats && stats.pendingPosts > 0 && (
                    <Badge className="ml-1 bg-destructive text-destructive-foreground">
                      {stats.pendingPosts}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {currentView === 'submit' && (
          <div className="pt-6">
            <PostSubmissionForm onSubmit={handlePostSubmit} />
          </div>
        )}

        {currentView === 'admin' && user.role === 'admin' && (
          <div className="pt-6">
            <AdminDashboard 
              stats={stats}
              posts={posts}
              currentUserId={user.id}
              onApprovePost={(postId) => approvePostMutation.mutate(postId)}
              onRejectPost={(postId) => rejectPostMutation.mutate(postId)}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onBulkAction={(action, postIds) => {
                if (action === 'approve') {
                  postIds.forEach(id => approvePostMutation.mutate(id));
                } else if (action === 'reject') {
                  postIds.forEach(id => rejectPostMutation.mutate(id));
                }
              }}
            />
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome, {userName}!
                </h1>
                <p className="text-muted-foreground">
                  Manage your social media content for Riphah School
                </p>
              </div>
              <Badge className={`text-sm px-3 py-1 ${
                user.role === 'admin' ? 'bg-destructive text-destructive-foreground' :
                user.role === 'faculty' ? 'bg-chart-2 text-white' :
                'bg-chart-1 text-white'
              }`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="hover-elevate">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">
                        {user.role === 'admin' ? stats.totalPosts : posts.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm font-medium">
                      {user.role === 'admin' ? 'Total Posts' : 'Your Posts'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate border-l-4 border-l-chart-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Clock className="h-4 w-4 text-chart-2" />
                      <Badge className="bg-chart-2 text-white">
                        {user.role === 'admin' ? 
                          stats.pendingPosts : 
                          posts.filter(p => p.status === 'pending').length
                        }
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm font-medium">Pending Review</p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate border-l-4 border-l-chart-1">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <FileText className="h-4 w-4 text-chart-1" />
                      <Badge className="bg-chart-1 text-white">
                        {user.role === 'admin' ? 
                          stats.approvedPosts : 
                          posts.filter(p => p.status === 'approved').length
                        }
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm font-medium">Approved</p>
                  </CardContent>
                </Card>

                {user.role === 'admin' && (
                  <Card className="hover-elevate">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{stats.totalUsers}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm font-medium">Active Users</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Recent Posts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {user.role === 'admin' ? 'Recent Posts' : 'Your Posts'}
                </h2>
                {posts.length > 3 && (
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {postsLoading ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading posts...</p>
                    </CardContent>
                  </Card>
                ) : posts.length > 0 ? (
                  posts.slice(0, 3).map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserRole={user.role}
                      currentUserId={user.id}
                      onApprove={(id) => approvePostMutation.mutate(id)}
                      onReject={(id) => rejectPostMutation.mutate(id)}
                      onShare={handleSharePost}
                      onEdit={handleEditPost}
                      onDelete={handleDeletePost}
                    />
                  ))
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">No posts yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start by submitting your first post for the community!
                      </p>
                      <Button onClick={() => setCurrentView('submit')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Submit Your First Post
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Post Form */}
      <EditPostForm
        post={editingPost || undefined}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleEditPostSave}
      />
    </div>
  );
}