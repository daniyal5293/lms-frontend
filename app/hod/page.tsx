import { AppShell } from "@/src/components/layout/AppShell";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";

export default function HodPage() {
  return (
    <AppShell>
      <PageHeader title="HOD Dashboard" description="Department leadership tools are available when the relevant backend endpoints are added." />
      <Card>
        <p className="text-[#d4d4d4]">This dashboard provides the role-based shell and is intentionally limited until the college leadership APIs are implemented by the backend.</p>
      </Card>
    </AppShell>
  );
}
