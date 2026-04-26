"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ArrowRight, Mail, Lock, BarChart3, BookOpen, TrendingUp } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(124,92,250,0.10),transparent_30%),linear-gradient(180deg,#f8f4ff_0%,#ffffff_48%,#faf7ff_100%)] px-6 py-12">
      <div className="flex w-full max-w-[960px] gap-16">
        {/* Left Panel */}
        <div className="hidden flex-1 flex-col lg:flex">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5cfa] to-[#6d53ea] shadow-[0_4px_14px_rgba(124,92,250,0.25)]">
              <span className="text-lg font-black text-white">提</span>
            </div>
            <div>
              <div className="text-lg font-bold text-[#1a1625]">提分教练</div>
              <div className="text-xs font-medium tracking-wide text-[#8b85a3]">CET-6 · IELTS</div>
            </div>
          </div>

          <h2 className="mt-10 text-4xl font-bold leading-tight text-[#1a1625]">
            欢迎回来
          </h2>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-[#7a7590]">
            输入邮箱和密码进入你的学习工作台
          </p>

          <ul className="mt-10 space-y-5">
            {[
              { icon: BarChart3, title: "科学提分路径", desc: "智能规划，高效备考" },
              { icon: BookOpen, title: "真题题库练习", desc: "覆盖题型，精准训练" },
              { icon: TrendingUp, title: "学习进度追踪", desc: "数据可视，进步看得见" },
            ].map((item) => (
              <li key={item.title} className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ede8fb]">
                  <item.icon className="h-[18px] w-[18px] text-[#7c5cfa]" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-[#1a1625]">{item.title}</div>
                  <div className="mt-0.5 text-[13px] text-[#8b85a3]">{item.desc}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* Decorative illustration area */}
          <div className="mt-auto pt-10">
            <div className="relative h-[180px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#efeaff] via-[#f5effe] to-transparent opacity-80">
              <div className="absolute inset-0 flex items-end justify-center gap-4 pb-6">
                <div className="h-20 w-28 rounded-xl bg-gradient-to-br from-[#d4c7ff] to-[#c4b3ff] rotate-[-6deg] shadow-lg" />
                <div className="h-24 w-32 rounded-xl bg-gradient-to-br from-[#c4b3ff] to-[#b8a5ff] rotate-[3deg] shadow-lg translate-y-[-8px]" />
                <div className="h-16 w-20 rounded-full bg-gradient-to-br from-[#e0d4ff] to-[#d4c7ff] rotate-[8deg] shadow-md translate-y-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form Card */}
        <div className="w-full max-w-[400px] shrink-0">
          <div className="rounded-3xl bg-white px-9 pb-9 pt-8 shadow-[0_20px_70px_rgba(120,90,240,0.10)]">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-[#1a1625]">登录提分教练</h1>
              <p className="mt-1.5 text-sm text-[#8b85a3]">输入邮箱和密码进入你的学习工作台</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-sm text-[#dc2626]">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-[#37364d]">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#b0abc0]" />
                  <input
                    autoComplete="email"
                    className="h-[48px] w-full rounded-xl border border-[#e4e0ef] bg-[#faf8ff] pl-11 pr-4 text-[15px] text-[#1a1625] outline-none transition placeholder:text-[#c4bfd4] focus:border-[#8b6ce7] focus:bg-white"
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
                <label className="block text-[13px] font-semibold text-[#37364d]">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#b0abc0]" />
                  <input
                    autoComplete="current-password"
                    className="h-[48px] w-full rounded-xl border border-[#e4e0ef] bg-[#faf8ff] pl-11 pr-11 text-[15px] text-[#1a1625] outline-none transition placeholder:text-[#c4bfd4] focus:border-[#8b6ce7] focus:bg-white"
                    placeholder="至少 6 位"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0abc0] transition hover:text-[#7c5cfa]"
                    onClick={() => setShowPassword((v) => !v)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              <button
                className="flex h-[50px] w-full cursor-pointer items-center justify-between rounded-xl bg-gradient-to-r from-[#8b6ce7] to-[#7c5cfa] px-6 text-[15px] font-semibold text-white shadow-[0_6px_26px_rgba(124,92,250,0.32)] transition-all hover:from-[#7b5bd6] hover:to-[#6d52e8] hover:shadow-[0_8px_32px_rgba(124,92,250,0.40)] disabled:opacity-70"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? "登录中…" : "登录"}
                {!isLoading && <ArrowRight className="h-[18px] w-[18px]" />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-[#8b85a3]">还没有账户？</span>{" "}
              <Link className="text-sm font-semibold text-[#7c5cfa] hover:text-[#6d53ea]" href="/sign-up">
                立即注册
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}