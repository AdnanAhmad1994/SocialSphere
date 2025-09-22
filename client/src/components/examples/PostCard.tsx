import PostCard from '../PostCard';

export default function PostCardExample() {
  // todo: remove mock functionality
  const mockPost = {
    id: "1",
    caption: "Excited to share our latest Computer Science project! Our team developed an innovative mobile app for campus navigation. The app uses AR technology to help students and visitors find their way around our beautiful Riphah campus. Special thanks to Dr. Sarah Ahmed for her guidance throughout this project. #RiphahInnovation #ComputerScience #AR",
    images: [
      "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=400&fit=crop"
    ],
    author: {
      name: "Fatima Khan",
      role: "student" as const,
      avatar: ""
    },
    status: "pending" as const,
    submittedAt: "2024-01-15T10:30:00Z",
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <PostCard 
        post={mockPost}
        currentUserRole="admin"
        onApprove={(id) => console.log('Approve post:', id)}
        onReject={(id) => console.log('Reject post:', id)}
        onShare={(id) => console.log('Share post:', id)}
        onDelete={(id) => console.log('Delete post:', id)}
      />
    </div>
  );
}