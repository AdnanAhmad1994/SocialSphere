import Header from '../Header';

export default function HeaderExample() {
  return (
    <div className="w-full">
      <Header 
        user={{
          name: "Ahmed Ali",
          role: "admin",
          avatar: ""
        }}
        pendingCount={7}
        onAuth={() => console.log('Auth clicked')}
        onLogout={() => console.log('Logout clicked')}
      />
    </div>
  );
}