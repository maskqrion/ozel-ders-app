import TopHeader from "@/components/layout/TopHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <TopHeader />
      <main className="p-4">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
