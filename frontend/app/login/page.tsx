"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { parseApiError } from "@/lib/errors";

import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Spinner from "@cloudscape-design/components/spinner";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (!mounted || isAuthLoading) {
    return (
      <Box
        margin={{ top: "xxxl" }}
        textAlign="center"
        padding={{ vertical: "xxxl" }}
      >
        <Spinner size="large" />
      </Box>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    let hasError = false;

    setEmailError("");
    setPasswordError("");
    setErrorMessage("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required.");
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const parsed = parseApiError(err, "auth");
      setErrorMessage(parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      margin={{ top: "xxxl" }}
      padding={{ horizontal: "s" }}
      className="awsui-polaris-theme"
    >
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SpaceBetween size="l">
          <Box textAlign="center">
            <Header variant="h1" description="AWS Management Console Sign In">
              Amazon Route 53
            </Header>
          </Box>

          {errorMessage && (
            <Alert
              type="error"
              dismissible
              onDismiss={() => setErrorMessage("")}
              header="Sign-in error"
            >
              {errorMessage}
            </Alert>
          )}

          <Container
            header={
              <Header variant="h2" description="Sign in to your Route 53 Administrator account">
                Sign In
              </Header>
            }
          >
            <form onSubmit={handleSubmit}>
              <Form
                actions={
                  <Button
                    variant="primary"
                    formAction="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Sign in
                  </Button>
                }
              >
                <SpaceBetween size="m">
                  <FormField
                    label="Email address"
                    errorText={emailError}
                  >
                    <Input
                      type="email"
                      value={email}
                      onChange={({ detail }) => setEmail(detail.value)}
                      placeholder="admin@example.com"
                      disabled={isSubmitting}
                    />
                  </FormField>

                  <FormField
                    label="Password"
                    errorText={passwordError}
                  >
                    <Input
                      type="password"
                      value={password}
                      onChange={({ detail }) => setPassword(detail.value)}
                      placeholder="Enter your password"
                      disabled={isSubmitting}
                    />
                  </FormField>
                </SpaceBetween>
              </Form>
            </form>
          </Container>
        </SpaceBetween>
      </div>
    </Box>
  );
}
