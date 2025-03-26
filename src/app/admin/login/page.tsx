"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/admin/login", {
        email,
        password,
      });

      if (response.data.token) {
        // Store admin token and info
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem("adminName", response.data.admin.name);
        localStorage.setItem("adminEmail", response.data.admin.email);
        localStorage.setItem("adminRole", response.data.admin.role);
        localStorage.setItem("isAdmin", "true");  // Set isAdmin flag for admin users
        
        // Redirect to admin dashboard
        router.push("/admin/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md p-8 bg-gray-100 shadow-md rounded-lg">
        <div className="flex justify-center mb-8">
          
            <g>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </g>
         
        </div>
        
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">Admin Login</h1>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full p-3 rounded-md bg-white border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full p-3 rounded-md bg-white border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-200 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded-md bg-blue-500 text-white font-bold hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
            >
              {loading ? "Logging in..." : "Sign in"}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-gray-500">
            Don&apos;t have an admin account?{" "}
            <Link href="/admin/signup" className="text-blue-500 hover:text-blue-400">
              Sign up
            </Link>
          </p>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <Link href="/login" className="text-blue-500 hover:text-blue-400">
            Login as Student
          </Link>
        </div>
      </div>
    </div>
  );
}