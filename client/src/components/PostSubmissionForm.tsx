import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image as ImageIcon, FileText, Send, Eye } from "lucide-react";
import SocialMediaPreview from "./SocialMediaPreview";

interface PostSubmissionFormProps {
  onSubmit?: (post: { caption: string; images: File[]; type: string }) => void;
}

export default function PostSubmissionForm({ onSubmit }: PostSubmissionFormProps) {
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxCaptionLength = 500;
  const maxImages = 4;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newImages = Array.from(files).slice(0, maxImages - images.length);
    setImages(prev => [...prev, ...newImages]);
    console.log('Images selected:', newImages.map(f => f.name));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    console.log('Image removed at index:', index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const trimmedCaption = caption.trim();
    
    if (!trimmedCaption) {
      alert('Caption is required');
      return;
    }
    
    if (trimmedCaption.length > maxCaptionLength) {
      alert(`Caption too long. Maximum ${maxCaptionLength} characters allowed. Current: ${trimmedCaption.length}`);
      return;
    }
    
    const postData = {
      caption: trimmedCaption,
      images,
      type: images.length > 0 ? 'image_post' : 'text_post'
    };
    onSubmit?.(postData);
    
    // Reset form
    setCaption("");
    setImages([]);
  };

  const getImagePreview = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Submit New Post
          </CardTitle>
          <CardDescription>
            Share your content with the Riphah School community. All posts require admin approval.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Caption Input */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption / Message</Label>
              <Textarea
                id="caption"
                placeholder="Write your caption here... What's happening at Riphah School?"
                value={caption}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= maxCaptionLength) {
                    setCaption(value);
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault(); // Always prevent default paste behavior
                  
                  const pastedText = e.clipboardData.getData('text');
                  const currentText = caption;
                  const cursorStart = e.currentTarget.selectionStart || 0;
                  const cursorEnd = e.currentTarget.selectionEnd || 0;
                  const beforeSelection = currentText.slice(0, cursorStart);
                  const afterSelection = currentText.slice(cursorEnd);
                  
                  // Calculate the maximum text we can paste
                  const availableLength = maxCaptionLength - beforeSelection.length - afterSelection.length;
                  
                  if (availableLength <= 0) {
                    alert(`Cannot paste: caption is at maximum ${maxCaptionLength} character limit`);
                    return;
                  }
                  
                  if (pastedText.length <= availableLength) {
                    // Paste fits completely
                    const newText = beforeSelection + pastedText + afterSelection;
                    setCaption(newText);
                  } else {
                    // Truncate paste to fit
                    const truncatedPaste = pastedText.slice(0, availableLength);
                    const newText = beforeSelection + truncatedPaste + afterSelection;
                    setCaption(newText);
                    alert(`Pasted text was truncated to fit ${maxCaptionLength} character limit`);
                  }
                }}
                rows={4}
                maxLength={maxCaptionLength}
                className="resize-none"
                data-testid="textarea-caption"
              />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {caption.length}/{maxCaptionLength} characters
                </span>
                <Badge variant={caption.length > maxCaptionLength * 0.9 ? "destructive" : "secondary"}>
                  {caption.length > maxCaptionLength * 0.9 ? "Almost full" : "Good"}
                </Badge>
              </div>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-4">
              <Label>Images (Optional)</Label>
              
              {/* Drag and Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors hover-elevate cursor-pointer ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-muted/30'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone-images"
              >
                <Upload className={`mx-auto h-8 w-8 mb-2 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium">
                  Drop images here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 10MB each (max {maxImages} images)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                data-testid="input-file-hidden"
              />

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={getImagePreview(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          data-testid={`img-preview-${index}`}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {images.length >= maxImages && (
                <Badge variant="secondary" className="w-fit">
                  <ImageIcon className="mr-1 h-3 w-3" />
                  Maximum {maxImages} images reached
                </Badge>
              )}
            </div>

            {/* Preview and Submit */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                {(images.length > 0 || caption.trim()) && (
                  <SocialMediaPreview 
                    post={{
                      id: 'preview',
                      caption: caption || 'Your caption will appear here...',
                      images: images.map(file => URL.createObjectURL(file)),
                      author: {
                        name: 'Your Name',
                        role: 'student',
                        avatar: undefined
                      },
                      shareableLink: 'https://your-domain.com/posts/preview'
                    }}
                  />
                )}
                <div className="text-sm text-muted-foreground">
                  <p>Your post will be reviewed by admins before publishing</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <Button 
                  type="submit" 
                  disabled={!caption.trim()}
                  className="min-w-32"
                  data-testid="button-submit-post"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Review
                </Button>
                {!caption.trim() && (
                  <p className="text-xs text-muted-foreground" data-testid="text-validation-error">
                    Caption required to submit
                  </p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}