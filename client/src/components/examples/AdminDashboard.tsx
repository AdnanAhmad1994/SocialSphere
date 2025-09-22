import AdminDashboard from '../AdminDashboard';

export default function AdminDashboardExample() {
  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard
        onApprovePost={(id) => console.log('Approve post:', id)}
        onRejectPost={(id) => console.log('Reject post:', id)}
        onBulkAction={(action, postIds) => console.log('Bulk action:', action, postIds)}
      />
    </div>
  );
}