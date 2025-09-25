import { User, Settings, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import logoUrl from "@assets/RSCILogo_1758526996897.png";

interface HeaderProps {
  user?: {
    name: string;
    role: 'admin' | 'contributor';
    avatar?: string;
  };
  pendingCount?: number;
  onAuth?: () => void;
  onLogout?: () => void;
}

export default function Header({ user, pendingCount = 0, onAuth, onLogout }: HeaderProps) {
  const handleAuth = () => {
    console.log('Login/Signup triggered');
    onAuth?.();
  };

  const handleLogout = () => {
    console.log('Logout triggered');
    onLogout?.();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive text-destructive-foreground';
      case 'contributor': return 'bg-chart-1 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center gap-3 hover-elevate cursor-pointer" data-testid="link-logo">
          <img 
            src={logoUrl} 
            alt="Riphah School Logo" 
            className="h-10 w-10 object-contain"
            data-testid="img-logo"
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Social Media Portal</h1>
            <p className="text-sm text-muted-foreground">Riphah School of Computing & Innovation</p>
          </div>
        </Link>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Notifications for Admin */}
              {user.role === 'admin' && (
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    data-testid="button-notifications"
                    onClick={() => console.log('Notifications clicked')}
                  >
                    <Bell className="h-5 w-5" />
                  </Button>
                  {pendingCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-destructive text-destructive-foreground"
                      data-testid="badge-pending-count"
                    >
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </Badge>
                  )}
                </div>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover-elevate" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild data-testid="menu-profile">
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild data-testid="menu-admin-settings">
                      <Link href="/admin/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Settings
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={handleAuth} data-testid="button-login">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}