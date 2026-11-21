import type { Metadata } from "next";
import { DashboardOverview } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Tổng quan — Hope Library Dashboard",
  description: "Bảng điều khiển tổng quan tình hình hoạt động thư viện Hope Library.",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
