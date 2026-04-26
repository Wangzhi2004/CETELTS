"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

import { Brand } from "@/components/shared/brand";

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

    if (result === undefined) {
      return;
    }

    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(124,92,250,0.10),transparent_28%),linear-gradient(180deg,#f8f4ff_0%,#ffffff_48%,#faf7ff_100%)] px-5 py-12">
      <div className="flex w-full max-w-[420px] flex-col items-center">
        <Brand />

        <div className="mt-6 flex flex-col items-center gap-1.5">
          <h1 className="text-[22px] font-bold tracking-tight text-[#1a1625]">
            登录提分教练
          </h1>
          <p className="text-sm text-[#7a7590]">
            输入邮箱和密码进入你的学习工作台
          </p>
        </div>

        <form className="mt-9 w-full space-y-6 rounded-3xl bg-white px-8 pb-8 pt-7 shadow-[0_16px_60px_rgba(120,90,240,0.09)]" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-sm text-[#dc2626]">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-[#37364d]">邮箱</label>
            <input
              autoComplete="email"
              className="h-[46px] w-full rounded-xl border border-[#e4e0ef] bg-[#fbfaff] px-4 text-[15px] text-[#1a1625] outline-none transition placeholder:text-[#b0abc0] focus:border-[#8b6ce7] focus:bg-white"
              placeholder="admin@cetelts.com"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-[#37364d]">密码</label>
            <div className="relative">
              <input
                autoComplete="current-password"
                className="h-[46px] w-full rounded-xl border border-[#e4e0ef] bg-[#fbfaff] px-4 pr-11 text-[15px] text-[#1a1625] outline-none transition placeholder:text-[#b0abc0] focus:border-[#8b6ce7] focus:bg-white"
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
            className="flex h-[50px] w-full cursor-pointer items-center justify-between rounded-xl bg-gradient-to-r from-[#8b6ce7] to-[#7c5cfa] px-6 text-[15px] font-semibold text-white shadow-[0_6px_24px_rgba(124,92,250,0.30)] transition-all hover:from-[#7b5bd6] hover:to-[#6d52e8] hover:shadow-[0_8px_30px_rgba(124,92,250,0.38)] disabled:opacity-70"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "登录中…" : "登录"}
            {!isLoading && <ArrowRight className="h-[18px] w-[18px]" />}
          </button>

          <div className="pt-1 text-center text-sm text-[#7a7590]">
            还没有账户？{" "}
            <Link className="font-semibold text-[#7c5cfa] hover:text-[#6d53ea]" href="/sign-up">
              立即注册
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}