import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatToCustomDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getUTCFullYear();

  // Return US format (MM/DD/YYYY)
  return `${month}/${day}/${year}`; 
  
  // Or return UK/European format (DD/MM/YYYY):
  // return `${day}/${month}/${year}`;
};

