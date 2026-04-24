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
} from "lucide-react";

export const studentNavigation = [
  { href: "dashboard", label: "提分中心", icon: LayoutDashboard },
  { href: "reading", label: "阅读执行", icon: BookOpenText },
  { href: "listening", label: "听力执行", icon: Headphones },
  { href: "vocab", label: "词汇执行", icon: ScrollText },
  { href: "writing", label: "写作执行", icon: PenSquare },
  { href: "mock", label: "模考执行", icon: ClipboardList },
  { href: "mistakes", label: "错因归档", icon: FileText },
  { href: "reports", label: "学习报告", icon: FileChartColumnIncreasing },
  { href: "/settings", label: "设置", icon: Settings, absolute: true },
];

export const adminNavigation = [
  { href: "/admin/documents", label: "源文档", icon: FileText },
  { href: "/admin/parsing-jobs", label: "解析任务", icon: ListTodo },
  { href: "/admin/question-bank", label: "题库发布", icon: BookOpenText },
];
