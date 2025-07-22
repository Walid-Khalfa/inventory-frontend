"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";

export function RegisterForm() {
  const [formData, setFormData] = useState({ 
    firstName: "",
    lastName: "",
    username: "",
    email: "", 
    password: "" 
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const errors = [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Invalid email format");
    }
    if (formData.password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    if (formData.username.length < 3) {
      errors.push("Username must be at least 3 characters");
    }
    
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    setLoading(true);

    try {
      // Prepare data for Strapi as a JSON object
      const payload = {
        username: formData.username,
        email: formData.email.toLowerCase(),
        password: formData.password,
      };

      // Debug: Log the payload to console
      console.log("Sending payload to Strapi:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        "http://localhost:1337/api/auth/local/register",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000 // 10 seconds timeout
        }
      );

      if (response.status === 200) {
        toast.success("Registration successful!");
        router.push("/login");
      } else {
        // Handle non-200 responses
        const errorMsg = response.data?.error?.message || 
                        "Unknown registration error";
        toast.error(errorMsg);
      }
    } catch (error) {
      // Detailed error handling
      let errorMsg = "Unknown error occurred";
      
      if (error.response) {
        // Server responded with error status
        const serverError = error.response.data?.error || {};
        
        // Extract validation errors
        if (serverError.details?.errors) {
          errorMsg = serverError.details.errors
            .map(err => `${err.path.join('.')}: ${err.message}`)
            .join('\n');
        } 
        // Standard error message
        else if (serverError.message) {
          errorMsg = serverError.message;
        }
        
        // Specific status code handling
        if (error.response.status === 400) {
          errorMsg = `Validation error: ${errorMsg}`;
        } else if (error.response.status === 403) {
          errorMsg = "Forbidden: Missing permissions";
        } else if (error.response.status === 409) {
          errorMsg = "Conflict: User already exists";
        }
      } else if (error.code === "ECONNABORTED") {
        errorMsg = "Server timeout - please try again";
      } else if (error.request) {
        errorMsg = "No response from server";
      } else {
        errorMsg = error.message || "Network error";
      }
      
      toast.error(errorMsg);
      console.error("Error details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Register</CardTitle>
        <CardDescription>
          Please enter your details to register.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                minLength={2}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                minLength={2}
              />
            </div>
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
            />
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              type="password"
              required
              minLength={6}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
