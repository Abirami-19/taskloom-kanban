import { getAnalyticsPayload } from "@/lib/data";
import { AnalyticsClient } from "@/components/app/analytics-client";

export default async function AnalyticsPage() {
  const payload = await getAnalyticsPayload();
  return <AnalyticsClient payload={payload} />;
}
