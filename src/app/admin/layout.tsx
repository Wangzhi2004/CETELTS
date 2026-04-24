import { AdminShell } from "@/components/shared/admin-shell";
import { AdminStateProvider } from "@/state/admin-state";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminStateProvider>
      <AdminShell>{children}</AdminShell>
    </AdminStateProvider>
  );
}
