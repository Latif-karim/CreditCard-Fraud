import { monitoringHref, transactionDetailHref } from "@/lib/transaction-links";
import type { FraudNotification } from "@/lib/types";
import type { AppRole } from "@/lib/roles";

/** Resolve where an in-app notification should navigate. */
export function notificationHref(
  notification: Pick<FraudNotification, "transaction_id" | "category">,
  role: AppRole | null
): string {
  if (notification.transaction_id != null) {
    if (role === "analyst" || role === "admin") {
      return monitoringHref({ tx: notification.transaction_id });
    }
    return transactionDetailHref(notification.transaction_id);
  }
  if (role === "analyst" || role === "admin") {
    return "/dashboard/alerts";
  }
  return "/dashboard#alert-feed";
}
