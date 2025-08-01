import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

const resetPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function UserProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      await apiRequest("POST", "/api/reset-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      form.reset();
      setShowPasswordForm(false);
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                <p className="text-foreground">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                <p className="text-foreground">{user.username}</p>
              </div>
              
              {user.email && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-foreground">{user.email}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                <p className="text-foreground capitalize">{user.role}</p>
              </div>
              
              {user.phone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-foreground">{user.phone}</p>
                </div>
              )}
              
              {user.homeAddress && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <p className="text-foreground">{user.homeAddress}</p>
                </div>
              )}
              
              {user.hourlyRate && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Standard Hourly Rate</Label>
                  <p className="text-foreground">${user.hourlyRate}/hour</p>
                  {user.username === 'rhea' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Production work: $15/hour
                    </p>
                  )}
                </div>
              )}
              
              {user.inktricateStartDate && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                  <p className="text-foreground">{formatDate(user.inktricateStartDate)}</p>
                </div>
              )}
              
              {user.createdAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
                  <p className="text-foreground">{formatDate(user.createdAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Password Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Lock className="w-5 h-5 mr-2" />
                Password Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showPasswordForm ? (
                <div>
                  <p className="text-muted-foreground mb-4">
                    Keep your account secure by updating your password regularly.
                  </p>
                  <Button 
                    onClick={() => setShowPasswordForm(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Change Password
                  </Button>
                </div>
              ) : (
                <div>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...form.register("currentPassword")}
                        className="mt-1"
                      />
                      {form.formState.errors.currentPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...form.register("newPassword")}
                        className="mt-1"
                      />
                      {form.formState.errors.newPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...form.register("confirmPassword")}
                        className="mt-1"
                      />
                      {form.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="submit" 
                        disabled={resetPasswordMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowPasswordForm(false);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}