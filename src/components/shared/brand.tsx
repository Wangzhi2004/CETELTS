import { LogoMark } from "@/components/shared/logo-mark";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div>
        <p className="text-[15px] font-[800] tracking-tight text-[#1b1d24] dark:text-[#edeef1]">
          提分教练
        </p>
        <p className="text-[10px] font-medium tracking-[0.12em] text-[#8b91a3]">
          CET-6 · IELTS
        </p>
      </div>
    </div>
  );
}
