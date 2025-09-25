import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, TrendingUp, Users, BarChart3, Clock, CheckCircle, XCircle, FileText, Calendar } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import type { ContributorMetrics, User } from "@shared/schema";

export default function ContributorPerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("totalSubmitted");
  const { user, logout } = useCustomAuth();

  const { data: metrics = [], isLoading, error, refetch } = useQuery<ContributorMetrics[]>({
    queryKey: ['/api/admin/performance'],
  });

  // Add client-side admin guard
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          user={{
            name: `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || user.email || 'User',
            role: user.role as 'admin' | 'contributor',
            avatar: (user as any).profileImageUrl
          }}
          onLogout={logout}
        />
        <div className="max-w-6xl mx-auto p-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground">
                  You need administrator privileges to view contributor performance data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredAndSortedMetrics = metrics
    .filter((metric) => 
      metric.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      metric.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'userName':
          return a.userName.localeCompare(b.userName);
        case 'totalSubmitted':
          return b.totalSubmitted - a.totalSubmitted;
        case 'approvalRate':
          return b.approvalRate - a.approvalRate;
        case 'avgTimeToApproval':
          return (a.avgTimeToApproval || 0) - (b.avgTimeToApproval || 0);
        case 'lastSubmissionDate':
          const aDate = a.lastSubmissionDate ? new Date(a.lastSubmissionDate) : new Date(0);
          const bDate = b.lastSubmissionDate ? new Date(b.lastSubmissionDate) : new Date(0);
          return bDate.getTime() - aDate.getTime();
        default:
          return 0;
      }
    });

  const getApprovalRateColor = (rate: number) => {
    if (rate >= 80) return 'bg-chart-1 text-white';
    if (rate >= 60) return 'bg-chart-2 text-white';
    if (rate >= 40) return 'bg-chart-3 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTimeToApproval = (hours: number | null) => {
    if (!hours) return 'N/A';
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle query errors
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          user={user ? { 
            name: `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || user.email || 'User', 
            role: user.role as 'admin' | 'contributor',
            avatar: (user as any).profileImageUrl 
          } : undefined}
          onLogout={logout}
        />
        <div className="max-w-6xl mx-auto p-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load Performance Data</h3>
                <p className="text-muted-foreground mb-4">
                  There was an error loading contributor performance metrics. Please try again.
                </p>
                <Button onClick={() => refetch()} data-testid="button-retry">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          user={user ? { 
            name: `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || user.email || 'User', 
            role: user.role as 'admin' | 'contributor',
            avatar: (user as any).profileImageUrl 
          } : undefined}
          onLogout={logout}
        />
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading contributor performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user ? { 
          name: `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || user.email || 'User', 
          role: user.role as 'admin' | 'contributor',
          avatar: (user as any).profileImageUrl 
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
            <h1 className="text-3xl font-bold text-foreground">Contributor Performance</h1>
            <p className="text-muted-foreground">Analytics and insights on contributor activity and approval rates</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Total Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-contributors">
                {metrics.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-submissions">
                {metrics.reduce((sum, m) => sum + m.totalSubmitted, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Total Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-approved">
                {metrics.reduce((sum, m) => sum + m.totalApproved, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Average Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-avg-approval-rate">
                {metrics.length > 0 
                  ? Math.round(metrics.reduce((sum, m) => sum + m.approvalRate, 0) / metrics.length)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contributors by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-contributors"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-sort-by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="userName">Name (A-Z)</SelectItem>
              <SelectItem value="totalSubmitted">Total Submitted</SelectItem>
              <SelectItem value="approvalRate">Approval Rate</SelectItem>
              <SelectItem value="avgTimeToApproval">Response Time</SelectItem>
              <SelectItem value="lastSubmissionDate">Last Activity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contributors List */}
        <div className="space-y-4">
          {filteredAndSortedMetrics.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No contributors found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms.' : 'No contributors have submitted posts yet.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedMetrics.map((metric) => (
              <Card key={metric.userId} className="hover-elevate" data-testid={`card-contributor-${metric.userId}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback data-testid={`avatar-${metric.userId}`}>
                          {getInitials(metric.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold" data-testid={`name-${metric.userId}`}>
                          {metric.userName}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`email-${metric.userId}`}>
                          {metric.userEmail}
                        </p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold" data-testid={`submitted-${metric.userId}`}>
                          {metric.totalSubmitted}
                        </div>
                        <div className="text-xs text-muted-foreground">Submitted</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-chart-1" data-testid={`approved-${metric.userId}`}>
                          {metric.totalApproved}
                        </div>
                        <div className="text-xs text-muted-foreground">Approved</div>
                      </div>

                      <div className="text-center">
                        <Badge 
                          className={getApprovalRateColor(metric.approvalRate)}
                          data-testid={`approval-rate-${metric.userId}`}
                        >
                          {Math.round(metric.approvalRate)}%
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">Approval Rate</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium" data-testid={`avg-time-${metric.userId}`}>
                            {formatTimeToApproval(metric.avgTimeToApproval)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Response</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium" data-testid={`last-submission-${metric.userId}`}>
                            {formatDate(metric.lastSubmissionDate)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">Last Activity</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Posts */}
                  {metric.recentPosts && metric.recentPosts.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Recent Posts</h4>
                      <div className="flex gap-2 flex-wrap">
                        {metric.recentPosts.map((post, index) => (
                          <Badge 
                            key={index}
                            variant={post.status === 'approved' ? 'default' : post.status === 'pending' ? 'secondary' : 'destructive'}
                            className="text-xs"
                            data-testid={`recent-post-${metric.userId}-${index}`}
                          >
                            {post.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {post.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {post.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                            {post.caption.length > 30 ? `${post.caption.substring(0, 30)}...` : post.caption}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}