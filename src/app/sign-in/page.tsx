"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ArrowRight, Mail, Lock, BarChart3, Sparkles } from "lucide-react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });

    if (result === undefined) return;
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f2fdf0] px-4 py-8 relative overflow-hidden font-sans">
      {/* Modern Abstract Background Elements */}
      <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#e0d6ff] to-[#f0ebff] blur-[120px] mix-blend-multiply pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-[#d8ccff] to-[#f3f0ff] blur-[100px] mix-blend-multiply pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-[#f8f5ff] blur-[80px] pointer-events-none" />

      {/* Main Glass Container */}
      <div className="relative w-full max-w-[1060px] flex flex-col lg:flex-row rounded-[2.5rem] bg-white/70 backdrop-blur-2xl shadow-[0_8px_40px_rgba(124,92,250,0.06)] border border-white/80 overflow-hidden">
        
        {/* Left Side - Visuals & Branding */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-14 bg-gradient-to-br from-[#7c5cfa]/[0.08] to-transparent relative overflow-hidden">
          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-gradient-to-br from-[#7c5cfa] to-[#5b3eb8] text-white shadow-lg shadow-[#7c5cfa]/30">
              <span className="text-xl font-bold">提</span>
            </div>
            <span className="text-[22px] font-bold text-[#1a1625] tracking-tight">提分教练</span>
          </div>

          {/* Hero Text */}
          <div className="relative z-10 mt-20 mb-10">
            <h1 className="text-[2.75rem] font-extrabold text-[#1a1625] leading-[1.15] tracking-tight">
              掌握你的 <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c5cfa] to-[#5b3eb8]">提分节奏</span>
            </h1>
            <p className="mt-5 text-[#645e76] text-[15px] leading-relaxed max-w-[340px]">
              智能规划备考路径，真题题库精准训练，学习数据可视化追踪。你的专属 AI 学习教练。
            </p>
          </div>

          {/* Feature List */}
          <div className="relative z-10 space-y-4 mb-4">
            {[
              { icon: BarChart3, title: "科学规划路径", desc: "AI定制专属学习方案" },
              { icon: Sparkles, title: "沉浸式学习", desc: "互动式智能提分体验" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm w-fit pr-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#7c5cfa] shadow-sm">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#1a1625]">{item.title}</div>
                  <div className="text-[13px] text-[#8b85a3]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-16 -bottom-16 w-[350px] h-[350px] rounded-full border-[30px] border-white/30 blur-[2px] pointer-events-none" />
          <div className="absolute right-12 top-[25%] w-20 h-20 rounded-2xl bg-gradient-to-br from-white/90 to-white/30 backdrop-blur-xl border border-white/50 shadow-xl rotate-12 pointer-events-none" />
          <div className="absolute left-[30%] bottom-[8%] w-12 h-12 rounded-full bg-gradient-to-tr from-[#7c5cfa]/30 to-[#7c5cfa]/5 backdrop-blur-md border border-white/60 shadow-lg pointer-events-none" />
        </div>

        {/* Right Side - Form Container */}
        <div className="w-full lg:w-1/2 p-10 lg:p-16 bg-white/90 flex flex-col justify-center relative">
          <div className="max-w-[380px] w-full mx-auto">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-[#1a1625] tracking-tight">欢迎回来</h2>
              <p className="mt-2.5 text-[15px] text-[#645e76]">输入邮箱和密码进入你的学习工作台</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-[14px] text-red-600 flex items-center gap-2">
                  <span className="flex-shrink-0">⚠️</span>
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#1a1625]">邮箱</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a19bad] transition-colors group-focus-within:text-[#7c5cfa]" />
                  <input
                    autoComplete="email"
                    className="h-14 w-full rounded-2xl border border-[#e4e0ef] bg-[#faf8ff] pl-11 pr-4 text-[15px] text-[#1a1625] outline-none transition-all placeholder:text-[#a19bad] focus:border-[#7c5cfa] focus:bg-white focus:ring-4 focus:ring-[#7c5cfa]/10 hover:border-[#d4cff0]"
                    placeholder="admin@cetelts.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[14px] font-semibold text-[#1a1625]">密码</label>
                  <Link href="#" className="text-[13px] font-medium text-[#7c5cfa] hover:text-[#5b3eb8] transition-colors">
                    忘记密码？
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a19bad] transition-colors group-focus-within:text-[#7c5cfa]" />
                  <input
                    autoComplete="current-password"
                    className="h-14 w-full rounded-2xl border border-[#e4e0ef] bg-[#faf8ff] pl-11 pr-12 text-[15px] text-[#1a1625] outline-none transition-all placeholder:text-[#a19bad] focus:border-[#7c5cfa] focus:bg-white focus:ring-4 focus:ring-[#7c5cfa]/10 hover:border-[#d4cff0]"
                    placeholder="请输入密码"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a19bad] transition-colors hover:text-[#1a1625]"
                    onClick={() => setShowPassword((v) => !v)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                className="group relative flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#1a1625] px-6 text-[16px] font-semibold text-white shadow-lg shadow-[#1a1625]/20 transition-all hover:bg-[#2d283e] hover:shadow-[#1a1625]/30 hover:-translate-y-[1px] disabled:opacity-70 disabled:hover:translate-y-0"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? "登录中…" : "立即登录"}
                {!isLoading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            <div className="mt-8 text-center">
              <span className="text-[14px] text-[#645e76]">还没有账户？</span>{" "}
              <Link className="text-[14px] font-semibold text-[#7c5cfa] transition-colors hover:text-[#5b3eb8]" href="/sign-up">
                免费注册
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}