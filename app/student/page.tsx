import { AppShell } from "@/src/components/layout/AppShell";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";

export default function StudentPage() {
  return (
    <AppShell>
      <PageHeader title="Student Dashboard" description="Student learning workflows will appear here as backend academic endpoints become available." />
      <Card>
        <p className="text-[#d4d4d4]">Student-specific academic APIs are not part of the current backend contract, so this area is intentionally left as a placeholder until those resources are available.</p>
      </Card>
    </AppShell>
  );
}
