import PostSubmissionForm from '../PostSubmissionForm';

export default function PostSubmissionFormExample() {
  return (
    <div className="min-h-screen bg-background py-8">
      <PostSubmissionForm 
        onSubmit={(post) => console.log('Post submitted:', post)}
      />
    </div>
  );
}