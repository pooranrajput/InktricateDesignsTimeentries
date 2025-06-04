import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NavigationHeader() {
  const { user } = useAuth();
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
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold text-slate-900">Inktricate Designs</h1>
              <p className="text-xs text-slate-500">Time Tracking System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  className={`text-slate-600 hover:text-primary ${location === '/' ? 'text-primary bg-primary/10' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {user?.role === 'admin' ? 'Dashboard' : 'Time Entry'}
                </Button>
              </Link>
              
              {user?.role === 'admin' && (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-slate-600 hover:text-primary"
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
                <p className="text-sm font-medium text-slate-900">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {user?.role || 'Employee'}
                </p>
              </div>
              
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {getInitials(user?.firstName, user?.lastName)}
                </span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                className="text-slate-400 hover:text-slate-600"
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
