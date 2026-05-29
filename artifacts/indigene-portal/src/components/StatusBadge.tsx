import { Badge } from "@/components/ui/badge";

type Status = "draft" | "submitted" | "awaiting_payment" | "paid" | "under_review" | "approved" | "rejected" | "issued" | "revoked" | "active" | "suspended" | "valid" | "not_found";

export function StatusBadge({ status, className }: { status: string, className?: string }) {
  const s = status.toLowerCase() as Status;
  
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let colorClass = "";
  
  switch (s) {
    case "draft":
      variant = "secondary";
      break;
    case "submitted":
      colorClass = "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 dark:bg-blue-900 dark:text-blue-200";
      break;
    case "awaiting_payment":
      colorClass = "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 dark:bg-amber-900 dark:text-amber-200";
      break;
    case "paid":
    case "approved":
    case "issued":
    case "active":
    case "valid":
      colorClass = "bg-green-100 text-green-800 hover:bg-green-100 border-green-200 dark:bg-green-900 dark:text-green-200";
      break;
    case "under_review":
      colorClass = "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 dark:bg-purple-900 dark:text-purple-200";
      break;
    case "rejected":
    case "revoked":
    case "suspended":
    case "not_found":
      variant = "destructive";
      break;
  }
  
  return (
    <Badge variant={variant} className={`${colorClass} ${className}`}>
      {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
  );
}
