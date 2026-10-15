import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  // If redirected from a protected route, we know where to send them back
  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log("1. Login form submission started for:", formData.email);

    try {
      const user = await login(formData.email, formData.password);
      console.log("2. Auth response received successfully:", user);
      
      toast.success('Login successful');
      setFormData({ email: '', password: '' });
      
      console.log("3. Executing redirect based on role and location state");
      
      // Determine redirect path
      if (user?.role === 'admin') {
        console.log("User is admin. Routing directly to /admin dashboard");
        navigate('/admin');
      } else if (from) {
        console.log(`Routing back to originally requested path: ${from}`);
        navigate(from);
      } else {
        console.log("Routing to homepage fallback");
        navigate('/');
      }

    } catch (error) {
      console.error('Login error details:', error);
      
      // Extract detailed error message from PocketBase response
      const errorMessage = 
        error.response?.message || 
        error.message || 
        'Invalid email or password. Please try again.';
        
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Kudrat Humane Living Trust</title>
        <meta name="description" content="Login to your Kudrat Humane Living Trust account to manage your virtual adoptions and fostering applications." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow flex items-center justify-center py-20 bg-muted/30">
          <div className="container max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card rounded-2xl p-8 shadow-lg border"
            >
              <h1 className="text-3xl font-bold mb-2 text-card-foreground">Welcome back</h1>
              <p className="text-muted-foreground mb-8">Login to your account</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="Enter your email"
                    className="mt-2 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="mt-2 text-foreground"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full h-11" size="lg">
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </div>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default LoginPage;