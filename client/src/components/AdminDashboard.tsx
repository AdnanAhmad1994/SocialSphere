import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  Filter, 
  Clock, 
  Check, 
  X, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  Mail,
  Upload,
  Plus,
  Trash2
} from "lucide-react";
import PostCard from "./PostCard";

interface DashboardStats {
  totalPosts: number;
  pendingPosts: number;
  approvedPosts: number;
  rejectedPosts: number;
  totalUsers: number;
}

interface AdminDashboardProps {
  stats?: DashboardStats;
  posts?: any[];
  currentUserId?: string;
  onApprovePost?: (id: string) => void;
  onRejectPost?: (id: string) => void;
  onEditPost?: (id: string) => void;
  onDeletePost?: (id: string) => void;
  onBulkAction?: (action: string, postIds: string[]) => void;
}

export default function AdminDashboard({
  stats = {
    totalPosts: 45,
    pendingPosts: 7,
    approvedPosts: 32,
    rejectedPosts: 6,
    totalUsers: 156
  },
  posts = [],
  currentUserId,
  onApprovePost,
  onRejectPost,
  onEditPost,
  onDeletePost,
  onBulkAction
}: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  
  // Email whitelist state
  const [newEmail, setNewEmail] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const { toast } = useToast();

  // Fetch whitelisted emails
  const { data: whitelistedEmails = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/whitelist'],
  });

  // Add email mutation
  const addEmailMutation = useMutation({
    mutationFn: (email: string) => apiRequest('/api/admin/whitelist', 'POST', { email }),
    onSuccess: () => {
      toast({
        title: "Email Added",
        description: "Email has been added to the whitelist successfully.",
      });
      setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whitelist'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message.includes("409") 
          ? "Email is already whitelisted" 
          : "Failed to add email to whitelist",
        variant: "destructive",
      });
    },
  });

  // Remove email mutation
  const removeEmailMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/whitelist/${id}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: "Email Removed",
        description: "Email has been removed from the whitelist successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whitelist'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove email from whitelist",
        variant: "destructive",
      });
    },
  });

  // Bulk add emails mutation
  const bulkAddEmailsMutation = useMutation({
    mutationFn: (csvContent: string) => apiRequest('/api/admin/whitelist/bulk', 'POST', { csvContent }),
    onSuccess: (response: any) => {
      toast({
        title: "Emails Added",
        description: response.message,
      });
      setCsvContent("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whitelist'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to bulk add emails",
        variant: "destructive",
      });
    },
  });

  // todo: remove mock functionality
  const mockPosts = [
    {
      id: "1",
      caption: "Excited to announce our CS Department's collaboration with tech industry leaders! Students will get hands-on experience with real-world projects. #RiphahTech #Innovation",
      images: ["https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=400&fit=crop"],
      author: { name: "Dr. Ahmad Hassan", role: "faculty" as const, avatar: "" },
      status: "pending" as const,
      submittedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2", 
      caption: "Our hackathon team won first place! 48 hours of coding, debugging, and innovation. Proud to represent Riphah School. Special thanks to all mentors who guided us!",
      images: [
        "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop"
      ],
      author: { name: "Ali Ahmed", role: "student" as const, avatar: "" },
      status: "approved" as const,
      submittedAt: "2024-01-14T15:45:00Z",
      reviewedAt: "2024-01-14T16:20:00Z",
      reviewedBy: "Dr. Sarah Khan",
      shareableLink: "https://riphah-social.com/posts/2"
    },
    {
      id: "3",
      caption: "Join us for the upcoming AI & Machine Learning seminar. Industry experts will share insights on the future of technology. Register now!",
      author: { name: "Ayesha Malik", role: "student" as const, avatar: "" },
      status: "rejected" as const,
      submittedAt: "2024-01-13T09:15:00Z",
      reviewedAt: "2024-01-13T11:30:00Z",
      reviewedBy: "Admin"
    }
  ];

  const displayPosts = posts.length > 0 ? posts : mockPosts;

  const filteredPosts = displayPosts.filter(post => {
    const matchesSearch = post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    const matchesRole = roleFilter === "all" || post.author.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for posts:`, selectedPosts);
    onBulkAction?.(action, selectedPosts);
    setSelectedPosts([]);
  };

  const handlePostSelection = (postId: string, selected: boolean) => {
    if (selected) {
      setSelectedPosts(prev => [...prev, postId]);
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId));
    }
  };

  const handleAddEmail = () => {
    if (newEmail.trim()) {
      addEmailMutation.mutate(newEmail.trim());
    }
  };

  const handleBulkAddEmails = () => {
    if (csvContent.trim()) {
      bulkAddEmailsMutation.mutate(csvContent.trim());
    }
  };

  const handleRemoveEmail = (id: string) => {
    removeEmailMutation.mutate(id);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage social media content and email whitelist for Riphah School</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" data-testid="badge-total-posts">{stats.totalPosts}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">Total Posts</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-l-4 border-l-chart-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Clock className="h-4 w-4 text-chart-2" />
              <Badge className="bg-chart-2 text-white" data-testid="badge-pending-posts">{stats.pendingPosts}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">Pending</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-l-4 border-l-chart-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Check className="h-4 w-4 text-chart-1" />
              <Badge className="bg-chart-1 text-white" data-testid="badge-approved-posts">{stats.approvedPosts}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">Approved</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <X className="h-4 w-4 text-destructive" />
              <Badge variant="destructive" data-testid="badge-rejected-posts">{stats.rejectedPosts}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">Rejected</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" data-testid="badge-total-users">{stats.totalUsers}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">Total Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different management sections */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts" data-testid="tab-posts">
            <FileText className="mr-2 h-4 w-4" />
            Posts Management
          </TabsTrigger>
          <TabsTrigger value="emails" data-testid="tab-emails">
            <Mail className="mr-2 h-4 w-4" />
            Email Whitelist
          </TabsTrigger>
        </TabsList>

        {/* Posts Management Tab */}
        <TabsContent value="posts">
          <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manage Posts</CardTitle>
          <CardDescription>Review, approve, or reject submitted content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-posts"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32" data-testid="select-role-filter">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedPosts.length > 0 && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedPosts.length} post{selectedPosts.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  className="bg-chart-1 hover:bg-chart-1/90 text-white"
                  data-testid="button-bulk-approve"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Approve All
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('reject')}
                  data-testid="button-bulk-reject"
                >
                  <X className="mr-1 h-3 w-3" />
                  Reject All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserRole="admin"
              currentUserId={currentUserId}
              onApprove={onApprovePost}
              onReject={onRejectPost}
              onEdit={onEditPost}
              onDelete={onDeletePost}
              onShare={(id) => console.log('Share post:', id)}
            />
          ))
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No posts found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" || roleFilter !== "all"
                  ? "Try adjusting your filters or search query"
                  : "No posts have been submitted yet"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
        </TabsContent>

        {/* Email Whitelist Tab */}
        <TabsContent value="emails">
          <div className="space-y-6">
            {/* Add Email Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Email to Whitelist</CardTitle>
                <CardDescription>Add individual emails or bulk upload via CSV</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Individual Email Add */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address..."
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                    data-testid="input-email-address"
                  />
                  <Button 
                    onClick={handleAddEmail}
                    disabled={!newEmail.trim() || addEmailMutation.isPending}
                    data-testid="button-add-email"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Email
                  </Button>
                </div>

                {/* CSV Bulk Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bulk Add from CSV</label>
                  <Textarea
                    placeholder="Paste CSV content here (one email per line or comma-separated)..."
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    rows={4}
                    data-testid="textarea-csv-content"
                  />
                  <Button 
                    onClick={handleBulkAddEmails}
                    disabled={!csvContent.trim() || bulkAddEmailsMutation.isPending}
                    data-testid="button-bulk-add-emails"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Add Emails
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Whitelisted Emails List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Whitelisted Emails</CardTitle>
                <CardDescription>
                  Only these emails can submit posts. Total: {whitelistedEmails.length} emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                {whitelistedEmails.length > 0 ? (
                  <div className="space-y-2">
                    {whitelistedEmails.map((emailEntry: any) => (
                      <div
                        key={emailEntry.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                      >
                        <div className="flex-1">
                          <p className="font-medium" data-testid={`text-email-${emailEntry.id}`}>
                            {emailEntry.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Added by {emailEntry.addedByAdmin?.name} on{' '}
                            {new Date(emailEntry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveEmail(emailEntry.id)}
                          disabled={removeEmailMutation.isPending}
                          data-testid={`button-remove-email-${emailEntry.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No whitelisted emails</p>
                    <p className="text-sm text-muted-foreground">
                      Add emails above to allow users to submit posts
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}