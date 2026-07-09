"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus } from "lucide-react";

type Mode = "sign-in" | "register";

const demoCredentials = [
  {
    label: "Admin demo",
    email: "test@mail.com",
    password: "Test@mail.com",
  },
  {
    label: "Sales user demo",
    email: "user@mail.com",
    password: "User@mail.com",
  },
];

export function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    if (!email || !password || (mode === "register" && !name)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({
              email,
              password,
              callbackURL: "/crm/dashboard",
            })
          : await authClient.signUp.email({
              name,
              email,
              password,
              callbackURL: "/crm/dashboard",
            });

      if (result.error) {
        toast.error(result.error.message || "Authentication failed.");
        return;
      }

      toast.success(mode === "sign-in" ? "Signed in." : "Account created.");
      window.location.replace("/crm/dashboard");
    } catch (error) {
      toast.error("Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg my-5">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </CardTitle>
        <CardDescription>
          Use an email and password to access the sales intelligence workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 rounded-md border bg-muted/40 p-3 text-sm">
          {demoCredentials.map((credential) => (
            <button
              key={credential.email}
              type="button"
              className="grid gap-1 rounded-md border bg-background p-3 text-left transition hover:border-primary"
              onClick={() => {
                setMode("sign-in");
                setEmail(credential.email);
                setPassword(credential.password);
              }}
              disabled={isLoading}
            >
              <span className="font-medium">{credential.label}</span>
              <span className="text-muted-foreground">
                {credential.email} / {credential.password}
              </span>
            </button>
          ))}
        </div>
        {mode === "register" && (
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Revenue Ops"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <Button onClick={submit} disabled={isLoading}>
          {mode === "sign-in" ? (
            <LogIn className="mr-2 h-4 w-4" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode(mode === "sign-in" ? "register" : "sign-in")}
          disabled={isLoading}
        >
          {mode === "sign-in"
            ? "Create the first admin account"
            : "Already have an account? Sign in"}
        </Button>
        <p className="text-xs text-muted-foreground">
          The first registered user is activated as admin automatically. Later
          users wait for admin approval.
        </p>
      </CardContent>
    </Card>
  );
}
