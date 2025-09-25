import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import CustomLoginForm from "@/components/CustomLoginForm";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import AllPosts from "@/pages/AllPosts";
import PendingPosts from "@/pages/PendingPosts";
import ApprovedPosts from "@/pages/ApprovedPosts";
import UsersManagement from "@/pages/UsersManagement";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, refreshAuth } = useCustomAuth();

  const handleLoginSuccess = () => {
    refreshAuth();
  };

  // Component to redirect authenticated users from login page
  const LoginRedirect = () => {
    const [, setLocation] = useLocation();
    setLocation('/');
    return <div>Redirecting...</div>;
  };

  return (
    <Switch>
      {isLoading ? (
        <Route path="/" component={() => <div>Loading...</div>} />
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={() => <CustomLoginForm onLoginSuccess={handleLoginSuccess} />} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/login" component={LoginRedirect} />
          <Route path="/admin/posts/all" component={AllPosts} />
          <Route path="/admin/posts/pending" component={PendingPosts} />
          <Route path="/admin/posts/approved" component={ApprovedPosts} />
          <Route path="/admin/users" component={UsersManagement} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;