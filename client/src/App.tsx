import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Components
import Header from "@/components/Header";
import LoginForm from "@/components/LoginForm";
import PostSubmissionForm from "@/components/PostSubmissionForm";
import AdminDashboard from "@/components/AdminDashboard";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3, FileText, Users, Clock } from "lucide-react";
import PostCard from "@/components/PostCard";

// Types
type UserRole = 'student' | 'faculty' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface Post {
  id: string;
  caption: string;
  images?: string[];
  author: {
    name: string;
    role: UserRole;
    avatar?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  shareableLink?: string;
}

// Main App Component
function App() {
  // todo: remove mock functionality - replace with real auth
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'submit' | 'admin'>('dashboard');
  
  // todo: remove mock functionality - replace with real data
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      caption: "Excited to share our latest research in AI and Machine Learning! Our team has developed innovative algorithms for natural language processing. Thank you to all faculty mentors for their guidance. #RiphahResearch #AI",
      images: ["https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=400&fit=crop"],
      author: { name: "Hassan Ali", role: "student", avatar: "" },
      status: "approved",
      submittedAt: "2024-01-15T10:30:00Z",
      reviewedAt: "2024-01-15T11:00:00Z",
      reviewedBy: "Dr. Ahmed Khan",
      shareableLink: "https://riphah-social.com/posts/1"
    },
    {
      id: "2",
      caption: "Our cybersecurity workshop was a huge success! Students learned about ethical hacking, network security, and data protection. Industry experts shared real-world insights.",
      images: [
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=400&fit=crop"
      ],
      author: { name: "Dr. Sarah Ahmed", role: "faculty", avatar: "" },
      status: "pending",
      submittedAt: "2024-01-14T15:45:00Z"
    }
  ]);

  const handleLogin = (credentials: { email: string; password: string; role?: string }) => {
    console.log('Login attempt:', credentials);
    // todo: remove mock functionality - integrate with real auth
    const mockUser: User = {
      id: "user-1",
      name: credentials.role === 'admin' ? 'Dr. Ahmad Hassan' : 
           credentials.role === 'faculty' ? 'Dr. Sarah Ahmed' : 'Fatima Khan',
      email: credentials.email,
      role: (credentials.role as UserRole) || 'student',
      avatar: ""
    };
    setUser(mockUser);
  };

  const handleSocialLogin = (provider: string) => {
    console.log('Social login with:', provider);
    // todo: remove mock functionality - integrate with real social auth
    const mockUser: User = {
      id: "user-social",
      name: 'Ahmed Ali',
      email: 'ahmed.ali@riphah.edu.pk',
      role: 'student',
      avatar: ""
    };
    setUser(mockUser);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
    console.log('User logged out');
  };

  const handlePostSubmit = (postData: { caption: string; images: File[]; type: string }) => {
    console.log('New post submitted:', postData);
    
    // todo: remove mock functionality - send to real backend
    const newPost: Post = {
      id: `post-${Date.now()}`,
      caption: postData.caption,
      images: postData.images.map((_, index) => `https://images.unsplash.com/photo-${Date.now() + index}?w=400&h=400&fit=crop`),
      author: {
        name: user?.name || 'Unknown User',
        role: user?.role || 'student',
        avatar: user?.avatar
      },
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    
    setPosts(prev => [newPost, ...prev]);
    setCurrentView('dashboard');
    
    // Show success feedback
    console.log('Post submitted successfully! Awaiting admin approval.');
  };

  const handleApprovePost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            status: 'approved' as const, 
            reviewedAt: new Date().toISOString(),
            reviewedBy: user?.name || 'Admin',
            shareableLink: `https://riphah-social.com/posts/${postId}`
          }
        : post
    ));
    console.log('Post approved:', postId);
  };

  const handleRejectPost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            status: 'rejected' as const, 
            reviewedAt: new Date().toISOString(),
            reviewedBy: user?.name || 'Admin'
          }
        : post
    ));
    console.log('Post rejected:', postId);
  };

  const stats = {
    totalPosts: posts.length,
    pendingPosts: posts.filter(p => p.status === 'pending').length,
    approvedPosts: posts.filter(p => p.status === 'approved').length,
    rejectedPosts: posts.filter(p => p.status === 'rejected').length,
    totalUsers: 156 // todo: remove mock functionality
  };

  // Not authenticated - show login
  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            <LoginForm onLogin={handleLogin} onSocialLogin={handleSocialLogin} />
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Authenticated - show main app
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header 
            user={user} 
            pendingCount={stats.pendingPosts}
            onLogout={handleLogout}
          />
          
          <main className="pb-6">
            {/* Navigation Tabs for different views */}
            <div className="bg-background/95 backdrop-blur border-b sticky top-16 z-40">
              <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
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
                        {stats.pendingPosts > 0 && (
                          <Badge className="ml-1 bg-destructive text-destructive-foreground">
                            {stats.pendingPosts}
                          </Badge>
                        )}
                      </Button>
                    )}
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>

            {/* Content based on current view */}
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
                  onApprovePost={handleApprovePost}
                  onRejectPost={handleRejectPost}
                  onBulkAction={(action, postIds) => {
                    console.log('Bulk action:', action, postIds);
                    if (action === 'approve') {
                      postIds.forEach(handleApprovePost);
                    } else if (action === 'reject') {
                      postIds.forEach(handleRejectPost);
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
                      Welcome, {user.name}!
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="hover-elevate">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{user.role === 'admin' ? stats.totalPosts : posts.filter(p => p.author.name === user.name).length}</Badge>
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
                          {user.role === 'admin' ? stats.pendingPosts : posts.filter(p => p.author.name === user.name && p.status === 'pending').length}
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
                          {user.role === 'admin' ? stats.approvedPosts : posts.filter(p => p.author.name === user.name && p.status === 'approved').length}
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
                    {(user.role === 'admin' ? posts : posts.filter(p => p.author.name === user.name))
                      .slice(0, 3)
                      .map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUserRole={user.role}
                          onApprove={handleApprovePost}
                          onReject={handleRejectPost}
                          onShare={(id) => {
                            const shareableLink = posts.find(p => p.id === id)?.shareableLink;
                            if (shareableLink) {
                              navigator.clipboard.writeText(shareableLink);
                              console.log('Link copied to clipboard');
                            }
                          }}
                        />
                      ))}
                    
                    {(user.role === 'admin' ? posts : posts.filter(p => p.author.name === user.name)).length === 0 && (
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
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;