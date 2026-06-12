// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(user?: { first_name?: string; last_name?: string; username?: string }): string {
  if (!user) return '?';
  const { first_name, last_name, username } = user;
  if (first_name && last_name) {
    return `${first_name[0]}${last_name[0]}`.toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return 'U';
}