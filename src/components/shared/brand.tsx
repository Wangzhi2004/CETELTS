import { LogoMark } from "@/components/shared/logo-mark";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div>
        <p className="text-[15px] font-[800] tracking-tight text-[#1b1d24]">CET & IELTS</p>
      </div>
    </div>
  );
}
