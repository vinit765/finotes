import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { api } from "../../lib/api";
import { setToken } from "../../lib/auth";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const response = await api.login({ email, password });
        setToken(response.access_token);
        toast.success("Signed in successfully");
        navigate("/app");
      } else {
        await api.register({ email, password });
        toast.success("Account created. You can sign in now.");
        navigate("/login");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <motion.section
        className="auth-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="pill">
          <Sparkles size={14} />
          Your private workspace
        </div>
        <h1>Capture ideas before they slip away.</h1>
        <p>
          Finotes keeps your writing organized, easy to revisit, and simple to
          share when the moment calls for it.
        </p>
        <div className="hero-grid">
          <div className="hero-stat">
            <span>Private by default</span>
            <strong>Your notes stay yours</strong>
          </div>
          <div className="hero-stat">
            <span>Edit with confidence</span>
            <strong>Earlier drafts stay available</strong>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="auth-card"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="auth-card-header">
          <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
          <p>
            {isLogin
              ? "Sign in to manage your workspace."
              : "Register with email and password to get started."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <div className="input-shell">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="input-shell">
              <Lock size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </div>
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-footnote">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <Link to={isLogin ? "/register" : "/login"}>
            {isLogin ? "Create one" : "Sign in"}
          </Link>
        </p>
      </motion.section>
    </div>
  );
}
