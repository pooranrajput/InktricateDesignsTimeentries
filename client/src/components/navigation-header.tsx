import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NavigationHeader() {
  const { user, logoutMutation } = useAuth();
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
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0 flex items-center space-x-2 sm:space-x-3">
              <img 
                src="https://images.squarespace-cdn.com/content/v1/6490bc5d65728852ce40b805/1c310731-bb1d-41a1-99ef-b6a3e3932e3e/inktricatelogo-01.png?format=300w"
                alt="Inktricate Designs"
                className="h-8 sm:h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  console.log('Logo failed to load');
                }}
              />
              <div className="hidden sm:block min-w-0">
                <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate">Inktricate Designs</h1>
                <p className="text-xs text-muted-foreground">Time Tracking System</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  className={`text-muted-foreground hover:text-primary ${location === '/' ? 'text-primary bg-primary/10' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {user?.role === 'admin' ? 'Dashboard' : 'Time Entry'}
                </Button>
              </Link>
              
              {user?.role === 'admin' && (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-muted-foreground hover:text-primary"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Reports
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="text-primary bg-primary/10"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role || 'Employee'}
                </p>
              </div>
              
              <Link href="/profile">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <span className="text-primary-foreground text-sm font-medium">
                    {getInitials(user?.firstName, user?.lastName)}
                  </span>
                </div>
              </Link>
              
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
      </div>
    </header>
  );
}
