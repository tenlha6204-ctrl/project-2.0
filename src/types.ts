import { LucideIcon } from "lucide-react";

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface MetricCardProps {
  label: string;
  value: number; // 0-10
  color: string;
}

export interface Step {
  id: string;
  title: string;
}
