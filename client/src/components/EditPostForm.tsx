import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface EditPostFormProps {
  post?: Post;
  isOpen: boolean;
  onClose: () => void;
  onSave: (postId: string, caption: string, images?: File[]) => Promise<void>;
}

export default function EditPostForm({ post, isOpen, onClose, onSave }: EditPostFormProps) {
  const [caption, setCaption] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (post) {
      setCaption(post.caption || "");
      setPreviews(post.images || []);
      setSelectedFiles([]);
    }
  }, [post]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 4) {
      toast({
        title: "Too many files",
        description: "You can only upload up to 4 images.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(files);
    
    // Create preview URLs
    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === files.length) {
            setPreviews(newPreviews);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (files.length === 0) {
      setPreviews(post?.images || []);
    }
  };

  const removePreview = (index: number) => {
    if (selectedFiles.length > 0) {
      // Remove from new files
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      
      // Update previews for new files
      const newPreviews: string[] = [];
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string);
            if (newPreviews.length === newFiles.length) {
              setPreviews(newPreviews);
            }
          }
        };
        reader.readAsDataURL(file);
      });

      if (newFiles.length === 0) {
        setPreviews(post?.images || []);
      }
    } else {
      // Remove from existing images
      const newPreviews = previews.filter((_, i) => i !== index);
      setPreviews(newPreviews);
    }
  };

  const handleSubmit = async () => {
    if (!post) return;
    
    if (!caption.trim()) {
      toast({
        title: "Caption required",
        description: "Please enter a caption for your post.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(post.id, caption.trim(), selectedFiles.length > 0 ? selectedFiles : undefined);
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCaption("");
    setSelectedFiles([]);
    setPreviews([]);
    onClose();
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption here..."
              className="min-h-[100px] resize-none"
              data-testid="textarea-edit-caption"
            />
            <p className="text-xs text-muted-foreground">
              {caption.length}/1000 characters
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Images (optional)</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
                data-testid="input-edit-images"
              />
              <label 
                htmlFor="image-upload" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Choose images to replace current ones
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload up to 4 images (JPG, PNG, GIF, WebP)
                </p>
              </label>
            </div>
          </div>

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="space-y-2">
              <Label>
                {selectedFiles.length > 0 ? "New Images" : "Current Images"}
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePreview(index)}
                      data-testid={`button-remove-image-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {selectedFiles.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Upload new images to replace these
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !caption.trim()}
              data-testid="button-save-edit"
            >
              {isSubmitting ? "Updating..." : "Update Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}