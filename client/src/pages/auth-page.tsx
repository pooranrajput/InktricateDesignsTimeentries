import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, Lock, User } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      if (user.mustResetPassword) {
        setCurrentUser(user);
        setShowResetForm(true);
        toast({
          title: "Password Reset Required",
          description: "Please set a new password for your account.",
        });
      } else {
        window.location.href = "/";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const res = await apiRequest("POST", "/api/reset-password", {
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onResetPassword = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

  if (showResetForm) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Welcome {currentUser?.firstName}! Please set a new password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    {...resetForm.register("newPassword")}
                    className="pr-10"
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {resetForm.formState.errors.newPassword && (
                  <p className="text-sm text-red-600 mt-1">
                    {resetForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...resetForm.register("confirmPassword")}
                  placeholder="Confirm new password"
                />
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">
                    {resetForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your Inktricate Designs account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    {...loginForm.register("username")}
                    className="pl-10"
                    placeholder="Enter your username"
                  />
                  <User className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                </div>
                {loginForm.formState.errors.username && (
                  <p className="text-sm text-red-600 mt-1">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...loginForm.register("password")}
                    className="pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Default Login Credentials:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Admin:</strong> username: admin, password: Inktricate2024!</p>
                <p><strong>Employees:</strong> username: [firstname], password: Inktricate2024!</p>
                <p className="text-xs mt-2 text-blue-700">
                  You'll be asked to reset your password on first login.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-8 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4">Inktricate Designs</h1>
          <p className="text-xl mb-6">Time Tracking System</p>
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
              <p>Track time for different projects and tasks</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
              <p>Automated payroll calculations</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
              <p>Role-based access controls</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
              <p>Monthly reporting and analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}