"use client";

import { cn, formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  variant?: "green" | "yellow" | "red" | "blue";
  className?: string;
}

const variantStyles = {
  green: {
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    trendColor: "text-green-600",
  },
  yellow: {
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    trendColor: "text-yellow-600",
  },
  red: {
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    trendColor: "text-red-600",
  },
  blue: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    trendColor: "text-blue-600",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendType = "neutral",
  variant = "green",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn("p-6 transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl p-3", styles.iconBg)}>
          <Icon className={cn("h-6 w-6", styles.iconColor)} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trendType === "up" && "bg-green-50 text-green-600",
              trendType === "down" && "bg-red-50 text-red-600",
              trendType === "neutral" && "bg-gray-50 text-gray-600"
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold mt-1">
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
      </div>
    </Card>
  );
}
