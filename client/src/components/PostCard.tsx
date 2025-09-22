import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Check, 
  X, 
  Clock, 
  Share2, 
  MoreVertical, 
  Calendar, 
  User,
  Eye,
  MessageSquare,
  Edit3,
  Trash2
} from "lucide-react";
import SocialMediaPreview from "./SocialMediaPreview";

type PostStatus = 'pending' | 'approved' | 'rejected';
type UserRole = 'student' | 'faculty' | 'admin';

interface Post {
  id: string;
  caption: string;
  images?: string[];
  authorId: string;
  author: {
    name: string;
    role: UserRole;
    avatar?: string;
  };
  status: PostStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  shareableLink?: string;
}

interface PostCardProps {
  post: Post;
  currentUserRole?: UserRole;
  currentUserId?: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function PostCard({ 
  post, 
  currentUserRole,
  currentUserId,
  onApprove, 
  onReject, 
  onShare, 
  onDelete,
  onEdit
}: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusConfig = (status: PostStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending Review',
          color: 'bg-chart-2 text-white',
          bgColor: 'bg-chart-2/10'
        };
      case 'approved':
        return {
          icon: Check,
          label: 'Approved',
          color: 'bg-chart-1 text-white',
          bgColor: 'bg-chart-1/10'
        };
      case 'rejected':
        return {
          icon: X,
          label: 'Rejected',
          color: 'bg-destructive text-destructive-foreground',
          bgColor: 'bg-destructive/10'
        };
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-destructive text-destructive-foreground';
      case 'faculty': return 'bg-chart-2 text-white';
      case 'student': return 'bg-chart-1 text-white';
    }
  };

  const handleAction = (action: string) => {
    console.log(`${action} triggered for post ${post.id}`);
    switch (action) {
      case 'approve':
        onApprove?.(post.id);
        break;
      case 'reject':
        onReject?.(post.id);
        break;
      case 'share':
        onShare?.(post.id);
        break;
      case 'delete':
        onDelete?.(post.id);
        break;
      case 'edit':
        onEdit?.(post.id);
        break;
    }
  };

  const statusConfig = getStatusConfig(post.status);
  const StatusIcon = statusConfig.icon;
  const isAdmin = currentUserRole === 'admin';
  const isOwnPost = currentUserId && post.authorId === currentUserId;
  const canTakeAction = isAdmin && post.status === 'pending';
  const canEdit = (isAdmin || isOwnPost) && post.status === 'pending';
  const canDelete = isOwnPost || isAdmin;
  const truncatedCaption = post.caption.length > 150 
    ? post.caption.substring(0, 150) + "..." 
    : post.caption;

  return (
    <Card className={`hover-elevate transition-all ${statusConfig.bgColor} border-l-4 ${
      post.status === 'pending' ? 'border-l-chart-2' :
      post.status === 'approved' ? 'border-l-chart-1' :
      'border-l-destructive'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Author Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback>{post.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground" data-testid={`text-author-${post.id}`}>
                {post.author.name}
              </p>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getRoleColor(post.author.role)}`}>
                  {post.author.role.charAt(0).toUpperCase() + post.author.role.slice(1)}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="flex items-center gap-2">
            <Badge className={statusConfig.color} data-testid={`badge-status-${post.id}`}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-menu-${post.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {post.status === 'approved' && post.shareableLink && (
                  <DropdownMenuItem onClick={() => handleAction('share')} data-testid={`menu-share-${post.id}`}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Link
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem data-testid={`menu-view-${post.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem 
                    onClick={() => handleAction('edit')}
                    data-testid={`menu-edit-${post.id}`}
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Post
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={() => handleAction('delete')}
                    className="text-destructive"
                    data-testid={`menu-delete-${post.id}`}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        <div>
          <p className="text-foreground leading-relaxed" data-testid={`text-caption-${post.id}`}>
            {isExpanded ? post.caption : truncatedCaption}
          </p>
          {post.caption.length > 150 && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-xs text-primary"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`button-expand-${post.id}`}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>

        {/* Images Preview */}
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
            {post.images.slice(0, 4).map((image, index) => (
              <div 
                key={index} 
                className="aspect-square bg-muted relative overflow-hidden rounded-md"
              >
                <img 
                  src={image} 
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  data-testid={`img-post-${post.id}-${index}`}
                />
                {index === 3 && post.images && post.images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      +{post.images.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Admin Actions */}
        {canTakeAction && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleAction('approve')}
              className="flex-1 bg-chart-1 hover:bg-chart-1/90 text-white"
              data-testid={`button-approve-${post.id}`}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction('reject')}
              className="flex-1"
              data-testid={`button-reject-${post.id}`}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}

        {/* Review Info */}
        {post.reviewedAt && post.reviewedBy && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 pt-2 border-t">
            <User className="h-3 w-3" />
            Reviewed by {post.reviewedBy} on {new Date(post.reviewedAt).toLocaleDateString()}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <SocialMediaPreview post={post} />
            {post.status === 'approved' && post.shareableLink && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('share')}
                data-testid={`button-copy-link-${post.id}`}
                className="flex items-center gap-1"
              >
                <Share2 className="h-3 w-3" />
                Copy Link
              </Button>
            )}
          </div>
          
          {post.status === 'approved' && post.shareableLink && (
            <div className="text-xs text-muted-foreground">
              <span className="hidden md:inline">Ready to share</span>
            </div>
          )}
        </div>

        {/* Shareable Link Preview */}
        {post.status === 'approved' && post.shareableLink && (
          <div className="bg-muted/50 p-2 rounded-md">
            <div className="flex items-center gap-2">
              <code className="text-xs bg-background p-1 rounded flex-1 truncate">
                {post.shareableLink}
              </code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}