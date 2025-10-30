import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const bifFormatter = new Intl.NumberFormat('en-BI', {
  style: 'currency',
  currency: 'BIF',
});