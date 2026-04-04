import { useAuth } from "@/hooks/use-auth";
import { useViewToggle } from "@/hooks/use-view-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, LogOut, ToggleLeft, ToggleRight } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NavigationHeader() {
  const { user, logoutMutation } = useAuth();
  const { viewAsEmployee, setViewAsEmployee } = useViewToggle();
  const [location] = useLocation();

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || 'User';
  };

  return (
    <header className="bg-card shadow-elegant border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
              <img
                src="https://images.squarespace-cdn.com/content/v1/6490bc5d65728852ce40b805/1c310731-bb1d-41a1-99ef-b6a3e3932e3e/inktricatelogo-01.png?format=300w"
                alt="Inktricate Designs"
                className="h-8 sm:h-10 w-auto"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="hidden sm:block">
                <h1 className="text-sm sm:text-lg font-semibold text-foreground">Inktricate Designs</h1>
                <p className="text-xs text-muted-foreground">Time Tracking</p>
              </div>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Admin/Employee toggle */}
            {user?.role === 'admin' && (
              <div className="flex items-center space-x-1.5 bg-muted rounded-lg px-2 py-1.5">
                <Badge variant={!viewAsEmployee ? "default" : "outline"} className="text-xs cursor-pointer" onClick={() => setViewAsEmployee(false)}>
                  Admin
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewAsEmployee(!viewAsEmployee)}
                  className="h-7 w-7 p-0"
                >
                  {viewAsEmployee ? (
                    <ToggleRight className="h-4 w-4 text-primary" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Badge variant={viewAsEmployee ? "default" : "outline"} className="text-xs cursor-pointer" onClick={() => setViewAsEmployee(true)}>
                  Employee
                </Badge>
              </div>
            )}

            {/* User info */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{getDisplayName()}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {viewAsEmployee ? 'Employee View' : (user?.role || 'Employee')}
              </p>
            </div>

            {/* Avatar */}
            <Link href="/profile">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                <span className="text-primary-foreground text-sm font-medium">
                  {getInitials(user?.firstName, user?.lastName)}
                </span>
              </div>
            </Link>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
