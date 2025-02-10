import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <div className="min-h-screen flex bg-[#0B1120]">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="grid grid-cols-1 gap-8">
            {/* Login Form */}
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit((data) =>
                      loginMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <Input
                      placeholder="Username"
                      {...loginForm.register("username")}
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      {...loginForm.register("password")}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      Sign In
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Register Form */}
            <Card>
              <CardHeader>
                <CardTitle>Register</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit((data) =>
                      registerMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <Input
                      placeholder="Username"
                      {...registerForm.register("username")}
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      {...registerForm.register("password")}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      Create Account
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-[#0D1424]">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-bold text-white mb-6">
              SONIC Blockchain AI Platform
            </h1>
            <p className="text-xl text-gray-300">
              Interact with the SONIC blockchain using natural language through our
              AI-powered agents. Manage accounts, execute transactions, and monitor
              network activity seamlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
