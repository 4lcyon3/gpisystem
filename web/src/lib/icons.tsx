import {
  Settings,
  Target,
  ListTodo,
  Calendar,
  DollarSign,
  Wallet,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  FileBarChart,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Settings,
  Target,
  ListTodo,
  Calendar,
  DollarSign,
  Wallet,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  FileBarChart,
  LayoutDashboard,
};

export function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || Settings;
}