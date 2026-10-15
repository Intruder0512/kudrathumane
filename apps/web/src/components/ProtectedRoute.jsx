import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, isAdmin, isAuthenticated, initialLoading } = useAuth();
  const location = useLocation();

  console.log(`ProtectedRoute checking access for route: ${location.pathname}`, { 
    isAuthenticated, 
    isAdmin, 
    adminOnly, 
    initialLoading,
    userRole: currentUser?.role
  });

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: User not authenticated, redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    console.warn("ProtectedRoute: User authenticated but NOT admin. Access denied.", currentUser);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card rounded-2xl shadow-lg border p-8 max-w-md w-full text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You do not have the required administrator privileges to view this page. 
            Current role is: <span className="font-semibold">{currentUser?.role || 'user'}</span>
          </p>
          <Button onClick={() => window.location.href = '/'} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  console.log("ProtectedRoute: Access granted.");
  return children;
};

export default ProtectedRoute;