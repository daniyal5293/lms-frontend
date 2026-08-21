import { AppShell } from "@/src/components/layout/AppShell";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";

export default function TeacherPage() {
  return (
    <AppShell>
      <PageHeader title="Teacher Dashboard" description="Teacher workflows and academic access are available here." />
      <Card>
        <p className="text-[#d4d4d4]">Teacher features are ready for the backend API when the related academic endpoints become available.</p>
      </Card>
    </AppShell>
  );
}
