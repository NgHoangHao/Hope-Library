export interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface BookShowcaseItem {
  id: string;
  title: string;
  author: string;
  subtitle?: string;
  theme: "light" | "dark";
  coverColor: string;
  accentColor?: string;
  rotateDeg?: number;
}
