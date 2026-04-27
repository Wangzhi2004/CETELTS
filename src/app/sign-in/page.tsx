"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ArrowRight, Mail, Lock, BarChart3, Sparkles } from "lucide-react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const urlError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(urlError === "CredentialsSignin" ? "邮箱或密码不正确" : urlError ?? "");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    await signIn("credentials", {
      email,
      password,
      callbackUrl,
    });
  }

  return (
    <div className="min-h-screen bg-[#f4f2fdf0] relative overflow-hidden font-sans">
      {/* Background Blurs */}
      <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#e0d6ff] to-[#f0ebff] blur-[120px] mix-blend-multiply pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-[#d8ccff] to-[#f3f0ff] blur-[100px] mix-blend-multiply pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-[#f8f5ff] blur-[80px] pointer-events-none" />

      {/* ==================== DESKTOP: Two-Column Layout ==================== */}
      <div className="hidden lg:flex min-h-screen items-center justify-center px-8 py-12">
        <div className="relative w-full max-w-[1060px] flex rounded-[2.5rem] bg-white/70 backdrop-blur-2xl shadow-[0_8px_40px_rgba(124,92,250,0.06)] border border-white/80 overflow-hidden">

          {/* Left Panel - Brand */}
          <div className="w-1/2 flex flex-col justify-between p-14 bg-gradient-to-br from-[#7c5cfa]/[0.06] to-transparent relative overflow-hidden">
            {/* Illustration as subtle background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.12]">
              <Image
                src="/images/login-illustration.png"
                alt=""
                width={600}
                height={500}
                className="w-[85%] h-auto object-contain"
                priority
              />
            </div>

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
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/70 shadow-sm w-fit pr-8">
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
          </div>

          {/* Right Panel - Form */}
          <div className="w-1/2 p-16 bg-white/90 flex flex-col justify-center relative">
            <div className="max-w-[380px] w-full mx-auto">
              <div className="mb-10">
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

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      checked={rememberMe}
                      className="h-4 w-4 rounded border-[#d4cff0] accent-[#7c5cfa]"
                      onChange={(e) => setRememberMe(e.target.checked)}
                      type="checkbox"
                    />
                    <span className="text-[13px] text-[#645e76]">记住我</span>
                  </label>
                </div>

                <button
                  className="group relative flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#9580ff] to-[#7c5cfa] px-6 text-[16px] font-semibold text-white shadow-lg shadow-[#7c5cfa]/25 transition-all hover:shadow-[#7c5cfa]/35 hover:-translate-y-[1px] disabled:opacity-70 disabled:hover:translate-y-0"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "登录中…" : "登录"}
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

      {/* ==================== MOBILE: Clean Form Layout ==================== */}
      <div className="lg:hidden flex min-h-screen items-center justify-center bg-[#f4f2fdf0] px-5 py-8 relative overflow-hidden">
        {/* Subtle background blurs */}
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#e8e0ff] to-[#f3eeff] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-[#ddd6ff] to-[#f0ebff] blur-[90px] pointer-events-none" />

        <div className="relative w-full max-w-[400px]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#7c5cfa] to-[#5b3eb8] text-white shadow-lg shadow-[#7c5cfa]/25">
              <span className="text-lg font-bold">提</span>
            </div>
            <div>
              <div className="text-[20px] font-bold text-[#1a1625] tracking-tight">提分教练</div>
              <div className="text-[11px] font-medium tracking-widest text-[#7c5cfa]/60 uppercase mt-0.5">CET-6 · IELTS</div>
            </div>
          </div>

          {/* Title */}
          <div className="mb-7">
            <h2 className="text-[22px] font-bold text-[#1a1625] tracking-tight leading-snug">欢迎回来 👋</h2>
            <p className="mt-1.5 text-[13px] text-[#8b85a3]">登录你的账号，继续学习之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4.5">
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-[13px] text-red-600 flex items-center gap-2">
                <span className="flex-shrink-0 text-sm">⚠️</span>
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#1a1625]">邮箱</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#a19bad] transition-colors group-focus-within:text-[#7c5cfa]" />
                <input
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-[#e4e0ef] bg-white pl-11 pr-4 text-[14px] text-[#1a1625] outline-none transition-all placeholder:text-[#c4bdd8] focus:border-[#7c5cfa] focus:ring-3 focus:ring-[#7c5cfa]/10 hover:border-[#d4cff0]"
                  placeholder="admin@cetelts.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-semibold text-[#1a1625]">密码</label>
                <Link href="#" className="text-[12px] font-medium text-[#7c5cfa] hover:text-[#5b3eb8] transition-colors">
                  忘记密码？
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#a19bad] transition-colors group-focus-within:text-[#7c5cfa]" />
                <input
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-[#e4e0ef] bg-white pl-11 pr-11 text-[14px] text-[#1a1625] outline-none transition-all placeholder:text-[#c4bdd8] focus:border-[#7c5cfa] focus:ring-3 focus:ring-[#7c5cfa]/10 hover:border-[#d4cff0]"
                  placeholder="请输入密码"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a19bad] p-1 transition-colors hover:text-[#7c5cfa]"
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                checked={rememberMe}
                className="h-[17px] w-[17px] rounded-[5px] border-[#d4cff0] accent-[#7c5cfa]"
                onChange={(e) => setRememberMe(e.target.checked)}
                type="checkbox"
              />
              <span className="text-[13px] text-[#645e76]">记住我</span>
            </label>

            {/* Login Button */}
            <button
              className="group flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9580ff] to-[#7c5cfa] px-6 text-[15px] font-semibold text-white shadow-lg shadow-[#7c5cfa]/25 transition-all hover:shadow-[#7c5cfa]/35 active:scale-[0.98] disabled:opacity-70"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "登录中…" : "登录"}
              {!isLoading && <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-[#ede8f7]" />
            <span className="text-[12px] text-[#b5aed1] whitespace-nowrap">或使用其他方式登录</span>
            <div className="flex-1 h-px bg-[#ede8f7]" />
          </div>

          {/* WeChat Login */}
          <button
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#e4e0ef] bg-white text-[14px] font-medium text-[#4a4558] transition-all hover:bg-[#faf8ff] hover:border-[#d4cff0] active:scale-[0.98]"
            type="button"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#07C160">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.32.32 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.139.045c.134 0 .24-.111.24-.245 0-.06-.023-.118-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zM14.03 13.254c.535 0 .969.44.969.982a.976.976 0 01-.97.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.97.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z"/>
            </svg>
            微信登录
          </button>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <span className="text-[13px] text-[#8b85a3]">还没有账号？</span>{" "}
            <Link className="text-[13px] font-semibold text-[#7c5cfa] transition-colors hover:text-[#5b3eb8]" href="/sign-up">
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}