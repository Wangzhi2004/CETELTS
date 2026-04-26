import {
  BookOpenText,
  ClipboardList,
  FileChartColumnIncreasing,
  FileText,
  Headphones,
  LayoutDashboard,
  ListTodo,
  PenSquare,
  ScrollText,
  Settings,
  Target,
} from "lucide-react";

export const studentNavigation = [
  { href: "dashboard", label: "提分中心", icon: LayoutDashboard },
  { href: "reading", label: "阅读训练", icon: BookOpenText },
  { href: "listening", label: "听力训练", icon: Headphones },
  { href: "vocab", label: "词汇复习", icon: ScrollText },
  { href: "writing", label: "写作训练", icon: PenSquare },
  { href: "mock", label: "模考冲刺", icon: ClipboardList },
  { href: "mistakes", label: "错因归档", icon: Target },
  { href: "reports", label: "学习报告", icon: FileChartColumnIncreasing },
  { href: "/settings", label: "设置", icon: Settings, absolute: true },
];

export const adminNavigation = [
  { href: "/admin/documents", label: "源文档管理", icon: FileText },
  { href: "/admin/parsing-jobs", label: "解析任务", icon: ListTodo },
  { href: "/admin/question-bank", label: "题库发布", icon: BookOpenText },
];
