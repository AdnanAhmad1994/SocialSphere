import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Share2, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import logoUrl from "@assets/RSCILogo_1758526996897.png";

interface SocialMediaPreviewProps {
  post: {
    id: string;
    caption: string;
    images?: string[];
    author: {
      name: string;
      role: string;
      avatar?: string;
    };
    shareableLink?: string;
  };
}

export default function SocialMediaPreview({ post }: SocialMediaPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const firstImage = post.images?.[0];
  const truncatedCaption = post.caption.length > 100 
    ? post.caption.substring(0, 100) + "..." 
    : post.caption;

  const FacebookPreview = () => (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-md mx-auto">
      {/* Facebook Header */}
      <div className="p-3 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <img src={logoUrl} alt="Riphah" className="w-6 h-6 object-contain" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900 dark:text-white">
            Riphah School of Computing & Innovation
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago • 🌐</p>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-3">
        <p className="text-sm text-gray-900 dark:text-white mb-2">
          🎉 Celebrating our amazing {post.author.role} {post.author.name}!
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {truncatedCaption}
        </p>
      </div>

      {/* Image */}
      {firstImage && (
        <div className="relative">
          <img 
            src={firstImage} 
            alt="Post content" 
            className="w-full h-64 object-cover"
          />
          {post.images && post.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              1/{post.images.length}
            </div>
          )}
        </div>
      )}

      {/* Facebook Actions */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm mb-2">
          <span>👍❤️ 42 others</span>
          <span>8 comments • 5 shares</span>
        </div>
        <div className="flex items-center justify-around py-2 border-t border-gray-200 dark:border-gray-700">
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600">
            <Heart className="w-4 h-4" />
            <span className="text-sm">Like</span>
          </button>
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Comment</span>
          </button>
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600">
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </div>
  );

  const InstagramPreview = () => (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-sm mx-auto">
      {/* Instagram Header */}
      <div className="p-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-tr from-purple-400 via-pink-500 to-red-500 rounded-full p-0.5">
          <img 
            src={logoUrl} 
            alt="Riphah" 
            className="w-full h-full object-contain bg-white rounded-full p-1"
          />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900 dark:text-white">
            riphah_school
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sponsored</p>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
          •••
        </Button>
      </div>

      {/* Image Carousel */}
      {firstImage && (
        <div className="relative aspect-square">
          <img 
            src={post.images?.[currentImageIndex] || firstImage} 
            alt="Post content" 
            className="w-full h-full object-cover"
          />
          {post.images && post.images.length > 1 && (
            <>
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                {currentImageIndex + 1}/{post.images.length}
              </div>
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
                {post.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-1.5 h-1.5 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Instagram Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <MessageCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <Send className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </div>
          <Bookmark className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </div>
        
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          1,234 likes
        </p>
        
        <div className="text-sm text-gray-900 dark:text-white">
          <span className="font-semibold">riphah_school</span> {truncatedCaption}
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View all 23 comments
        </p>
        
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 uppercase">
          2 hours ago
        </p>
      </div>
    </div>
  );

  const LinkedInPreview = () => (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-md mx-auto">
      {/* LinkedIn Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
          <img src={logoUrl} alt="Riphah" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900 dark:text-white">
            Riphah School of Computing & Innovation
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Educational Institution • Following
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">2h • 🌐</p>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-900 dark:text-white mb-2">
          🎓 Spotlight on Excellence: {post.author.name}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {post.caption}
        </p>
        
        {post.images && post.images.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {post.images.length} image{post.images.length > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Image */}
      {firstImage && (
        <img 
          src={firstImage} 
          alt="Post content" 
          className="w-full h-64 object-cover"
        />
      )}

      {/* LinkedIn Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span>👍💡❤️ 87 reactions</span>
          <span>12 comments • 8 reposts</span>
        </div>
        <div className="flex items-center justify-around">
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 py-2 px-4 rounded">
            <span className="text-sm">👍 Like</span>
          </button>
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 py-2 px-4 rounded">
            <span className="text-sm">💬 Comment</span>
          </button>
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 py-2 px-4 rounded">
            <span className="text-sm">🔄 Repost</span>
          </button>
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 py-2 px-4 rounded">
            <span className="text-sm">📤 Send</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          data-testid={`button-preview-${post.id}`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Social Media Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              See how your post will look when shared on different social media platforms
            </p>
            {post.shareableLink && (
              <div className="mt-2 p-2 bg-muted/30 rounded border text-sm">
                <span className="font-medium">Shareable Link: </span>
                <code className="text-xs">{post.shareableLink}</code>
              </div>
            )}
          </div>

          <Tabs defaultValue="facebook" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="facebook" className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                Facebook
              </TabsTrigger>
              <TabsTrigger value="instagram" className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-tr from-purple-400 via-pink-500 to-red-500 rounded"></div>
                Instagram
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-700 rounded"></div>
                LinkedIn
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="facebook" className="mt-6">
              <div className="text-center mb-4">
                <Badge variant="secondary">Facebook Post Preview</Badge>
              </div>
              <FacebookPreview />
            </TabsContent>
            
            <TabsContent value="instagram" className="mt-6">
              <div className="text-center mb-4">
                <Badge variant="secondary">Instagram Post Preview</Badge>
              </div>
              <InstagramPreview />
            </TabsContent>
            
            <TabsContent value="linkedin" className="mt-6">
              <div className="text-center mb-4">
                <Badge variant="secondary">LinkedIn Post Preview</Badge>
              </div>
              <LinkedInPreview />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}