"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, UserPlus } from "lucide-react";

import { registerUser } from "@/app/actions/auth";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredExam, setPreferredExam] = useState<"cet6" | "ielts">("cet6");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次密码不一致");
      return;
    }

    startTransition(async () => {
      const result = await registerUser({ name, email, password, preferredExam });
      if (result.error) {
        setError(result.error);
        return;
      }

      await signIn("credentials", {
        email,
        password,
        redirectTo: "/",
      });
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(124,92,250,0.12),transparent_22%),linear-gradient(180deg,#faf7ff_0%,#ffffff_52%,#faf7ff_100%)] px-4 dark:bg-[radial-gradient(circle_at_top_right,rgba(149,128,255,0.06),transparent_22%),linear-gradient(180deg,#0f0e17_0%,#15131f_52%,#0f0e17_100%)]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Brand />
          <h1 className="text-2xl font-black tracking-tight text-[#1d1730] dark:text-[#edeef1]">
            创建账户
          </h1>
          <p className="text-sm text-[#627089] dark:text-[#8b91a3]">
            注册后即可开始你的 AI 提分训练
          </p>
        </div>

        <form
          className="space-y-4 rounded-3xl border border-[#ebe3fb] bg-white p-8 shadow-[0_12px_40px_rgba(124,92,250,0.08)] dark:border-[#2a2739] dark:bg-[#181722] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626] dark:border-[#991b1b] dark:bg-[rgba(220,38,38,0.1)] dark:text-[#f87171]">
              {error}
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#344054] dark:text-[#c5c8d4]">昵称</span>
            <Input
              autoComplete="name"
              placeholder="你的名字"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#344054] dark:text-[#c5c8d4]">邮箱</span>
            <Input
              autoComplete="email"
              placeholder="your@email.com"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#344054] dark:text-[#c5c8d4]">密码</span>
            <div className="relative">
              <Input
                autoComplete="new-password"
                placeholder="至少 6 位"
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b91a3] hover:text-[#6d53ea]"
                onClick={() => setShowPassword((v) => !v)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#344054] dark:text-[#c5c8d4]">确认密码</span>
            <Input
              autoComplete="new-password"
              placeholder="再次输入密码"
              required
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#344054] dark:text-[#c5c8d4]">备考类型</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  preferredExam === "cet6"
                    ? "border-[#7c5cfa] bg-[#f4edff] text-[#6d53ea] dark:border-[#9580ff] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]"
                    : "border-[#ece7f8] bg-white text-[#647089] hover:bg-[#faf7ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3]"
                }`}
                onClick={() => setPreferredExam("cet6")}
                type="button"
              >
                CET-6 六级
              </button>
              <button
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  preferredExam === "ielts"
                    ? "border-[#7c5cfa] bg-[#f4edff] text-[#6d53ea] dark:border-[#9580ff] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]"
                    : "border-[#ece7f8] bg-white text-[#647089] hover:bg-[#faf7ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3]"
                }`}
                onClick={() => setPreferredExam("ielts")}
                type="button"
              >
                IELTS 雅思
              </button>
            </div>
          </label>

          <Button className="h-12 w-full justify-between text-base" disabled={isPending} type="submit">
            {isPending ? "注册中…" : "注册并开始"}
            <UserPlus className="h-5 w-5" />
          </Button>

          <div className="flex items-center justify-center gap-1 text-sm text-[#627089] dark:text-[#8b91a3]">
            已有账户？
            <Link className="font-semibold text-[#6d53ea] hover:text-[#5b3fd4] dark:text-[#9580ff]" href="/sign-in">
              去登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}