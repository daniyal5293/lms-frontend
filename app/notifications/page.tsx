"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { useNotificationCenter } from "@/src/components/providers/NotificationCenterProvider";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { GroupedOptions } from "@/src/components/ui/GroupedOptions";
import { Input } from "@/src/components/ui/Input";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { SearchableMultiSelect } from "@/src/components/ui/SearchableMultiSelect";
import { Select } from "@/src/components/ui/Select";
import { ApiError } from "@/src/lib/api/client";
import {
  getNotificationTargets,
  listSectionStudentsForNotification,
  listSentNotifications,
  retryNotification,
  sendNotification,
  type NotificationAudience,
  type NotificationPriority,
  type NotificationScope,
  type NotificationStatus,
  type NotificationTargetOption,
  type NotificationTargets,
  type SentNotification,
} from "@/src/lib/api/notifications.api";
import { cn, formatDateTime, formatRelativeTime, formatSectionText, isUserInRole } from "@/src/lib/utils";

type Tab = "inbox" | "send" | "sent";

const statusTone: Record<NotificationStatus, "warning" | "info" | "success" | "danger"> = {
  Queued: "warning",
  Processing: "info",
  Processed: "success",
  Failed: "danger",
};

const sectionClass = (option: NotificationTargetOption) => `Class ${option.label.split(" - ")[0] || "—"}`;
const sectionLabel = (option: NotificationTargetOption) => formatSectionText(option.label);

function scopeLabel(audience: NotificationAudience, scope: NotificationScope, targets: NotificationTargets) {
  if (scope === "Section") return "Students in one section";
  if (scope === "Selected") return audience === "Students" ? "Selected students" : audience === "HODs" ? "Selected HODs" : "Selected teachers";
  if (audience === "HODs") return "All HODs";
  if (audience === "Teachers") return targets.department ? `All teachers in ${targets.department}` : "All teachers";
  if (targets.senderRole === "Teacher") return "All students in my sections";
  return targets.department ? `All students in ${targets.department} sections` : "All students";
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const canSend = isUserInRole(user, ["Admin", "HOD", "Teacher"]);
  const [tab, setTab] = useState<Tab>("inbox");

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "inbox", label: "Inbox" },
    ...(canSend ? [{ id: "send" as const, label: "Send" }, { id: "sent" as const, label: "Sent" }] : []),
  ];

  return (
    <ProtectedRoute allowedRoles={["Admin", "HOD", "Teacher", "Student"]}>
      <AppShell>
        <PageHeader title="Notifications" description="Messages from your institution, delivered in real time." />

        <div className="mb-5 flex gap-2 border-b border-black/10">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition",
                tab === item.id ? "theme-border-primary theme-text" : "border-transparent theme-text-muted hover:theme-text",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "inbox" ? <InboxTab /> : null}
        {tab === "send" && canSend ? <SendTab onSent={() => setTab("sent")} /> : null}
        {tab === "sent" && canSend ? <SentTab /> : null}
      </AppShell>
    </ProtectedRoute>
  );
}

function InboxTab() {
  const { items, unreadCount, hasMore, loading, markRead, markAllRead, loadMore } = useNotificationCenter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const visible = unreadOnly ? items.filter((item) => !item.isRead) : items;

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button variant={unreadOnly ? "ghost" : "secondary"} onClick={() => setUnreadOnly(false)}>All</Button>
          <Button variant={unreadOnly ? "secondary" : "ghost"} onClick={() => setUnreadOnly(true)}>Unread ({unreadCount})</Button>
        </div>
        <Button variant="ghost" disabled={unreadCount === 0} onClick={() => void markAllRead()}>Mark all as read</Button>
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm theme-text-muted">
          {loading ? "Loading notifications..." : unreadOnly ? "You have no unread notifications." : "You have no notifications yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => (
            <li
              key={item.id}
              className={cn("rounded-xl border border-black/10 p-4", !item.isRead && "theme-bg-primary-tint")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!item.isRead ? <span className="h-2 w-2 rounded-full theme-bg-primary" aria-label="Unread" /> : null}
                    <h3 className={cn("text-sm theme-text", !item.isRead && "font-semibold")}>{item.title}</h3>
                    {item.priority !== "Normal" ? <Badge tone={item.priority === "Urgent" ? "danger" : "warning"}>{item.priority}</Badge> : null}
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-sm theme-text-soft">{item.message}</p>
                  <p className="mt-2 text-xs theme-text-muted">
                    {item.senderName} · {item.senderRole} · <span title={formatDateTime(item.createdAt)}>{formatRelativeTime(item.createdAt)}</span>
                  </p>
                </div>
                {!item.isRead ? (
                  <button type="button" onClick={() => void markRead(item.id)} className="text-xs theme-text-primary underline underline-offset-4">
                    Mark as read
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" loading={loading} onClick={() => void loadMore()}>Load older notifications</Button>
        </div>
      ) : null}
    </Card>
  );
}

function SendTab({ onSent }: { onSent: () => void }) {
  const { notify } = useNotifications();
  const [targets, setTargets] = useState<NotificationTargets | null>(null);
  const [audience, setAudience] = useState<NotificationAudience | "">("");
  const [scope, setScope] = useState<NotificationScope | "">("");
  const [sectionId, setSectionId] = useState("");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [sectionStudents, setSectionStudents] = useState<NotificationTargetOption[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<NotificationPriority>("Normal");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getNotificationTargets()
      .then((data) => {
        setTargets(data);
        setAudience(data.audiences[0]?.audience ?? "");
        setScope(data.audiences[0]?.scopes[0] ?? "");
      })
      .catch((error) => notify("error", "Unavailable", error instanceof ApiError ? error.message : "Unable to load recipients."));
  }, [notify]);

  const scopes = targets?.audiences.find((item) => item.audience === audience)?.scopes ?? [];
  const needsSection = scope === "Section" || (scope === "Selected" && audience === "Students");

  useEffect(() => {
    if (!(scope === "Selected" && audience === "Students" && sectionId)) return;
    listSectionStudentsForNotification(sectionId)
      .then(setSectionStudents)
      .catch(() => setSectionStudents([]));
  }, [audience, scope, sectionId]);

  const recipientOptions = useMemo(() => {
    const source = audience === "HODs" ? targets?.hods : audience === "Teachers" ? targets?.teachers : sectionStudents;
    return (source ?? []).map((option) => ({
      value: option.id,
      label: audience === "Students" || !option.detail ? option.label : `${option.label} — ${option.detail}`,
    }));
  }, [audience, sectionStudents, targets]);

  const changeAudience = (value: NotificationAudience) => {
    setAudience(value);
    setScope(targets?.audiences.find((item) => item.audience === value)?.scopes[0] ?? "");
    setRecipientIds([]);
  };

  const valid =
    Boolean(audience && scope && title.trim() && message.trim()) &&
    (!needsSection || Boolean(sectionId)) &&
    (scope !== "Selected" || recipientIds.length > 0);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || !audience || !scope) return;
    setSubmitting(true);
    try {
      const result = await sendNotification({
        title: title.trim(),
        message: message.trim(),
        priority,
        audience,
        scope,
        sectionId: needsSection ? sectionId : undefined,
        recipientIds: scope === "Selected" ? recipientIds : undefined,
      });
      notify("success", "Notification queued", `It will be delivered to ${result.recipientCount} ${result.recipientCount === 1 ? "person" : "people"}.`);
      setTitle("");
      setMessage("");
      setRecipientIds([]);
      onSent();
    } catch (error) {
      notify("error", "Not sent", error instanceof ApiError ? error.message : "Unable to send the notification.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!targets) return <Card><p className="py-8 text-sm theme-text-muted">Loading recipients...</p></Card>;

  return (
    <Card>
      <form className="space-y-5" onSubmit={submit} noValidate>
        <div className="grid gap-4 md:grid-cols-3">
          <Select label="Send to" value={audience} onChange={(event) => changeAudience(event.target.value as NotificationAudience)}>
            {targets.audiences.map((item) => <option key={item.audience} value={item.audience}>{item.audience}</option>)}
          </Select>
          <Select label="Who" value={scope} onChange={(event) => { setScope(event.target.value as NotificationScope); setRecipientIds([]); }}>
            {audience ? scopes.map((item) => <option key={item} value={item}>{scopeLabel(audience, item, targets)}</option>) : null}
          </Select>
          <Select label="Priority" value={priority} onChange={(event) => setPriority(event.target.value as NotificationPriority)}>
            <option value="Normal">Normal</option>
            <option value="Important">Important</option>
            <option value="Urgent">Urgent</option>
          </Select>
        </div>

        {needsSection ? (
          <Select label="Section" value={sectionId} onChange={(event) => { setSectionId(event.target.value); setRecipientIds([]); }}>
            <option value="">Select a section</option>
            <GroupedOptions items={targets.sections} groupOf={sectionClass} valueOf={(option) => option.id} labelOf={sectionLabel} />
          </Select>
        ) : null}

        {scope === "Selected" && (audience !== "Students" || sectionId) ? (
          <SearchableMultiSelect
            label={`Recipients (${recipientIds.length} selected)`}
            options={recipientOptions}
            value={recipientIds}
            onChange={setRecipientIds}
            placeholder="Search by name"
          />
        ) : null}

        <Input label="Title" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Physics quiz moved to Friday" />
        <label className="block w-full text-sm theme-text" htmlFor="notification-message">
          <span className="mb-2 block theme-text-soft">Message</span>
          <textarea
            id="notification-message"
            value={message}
            maxLength={4000}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            className="w-full rounded-xl border border-black/10 theme-bg-input px-3 py-2.5 theme-text placeholder:theme-text-muted focus:theme-border-primary focus:outline-none"
          />
        </label>

        <div className="flex justify-end">
          <Button type="submit" loading={submitting} disabled={!valid}>{submitting ? "Sending..." : "Send notification"}</Button>
        </div>
      </form>
    </Card>
  );
}

function SentTab() {
  const { notify } = useNotifications();
  const [sent, setSent] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setSent(await listSentNotifications());
    } catch (error) {
      notify("error", "Unavailable", error instanceof ApiError ? error.message : "Unable to load sent notifications.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Poll while anything is still being processed so the status settles without a manual refresh
  const inFlight = sent.some((item) => item.status === "Queued" || item.status === "Processing");
  useEffect(() => {
    if (!inFlight) return;
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
  }, [inFlight, load]);

  const retry = async (item: SentNotification) => {
    try {
      await retryNotification(item.id);
      notify("success", "Retry queued", `"${item.title}" will be delivered again.`);
      void load();
    } catch (error) {
      notify("error", "Retry failed", error instanceof ApiError ? error.message : "Unable to retry.");
    }
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs theme-text-muted">
          Pushed: sent to the person&apos;s open sessions. Confirmed: their browser acknowledged it. People who were offline see it next time they sign in.
        </p>
        <Button variant="ghost" onClick={() => void load()}>Refresh</Button>
      </div>

      {loading ? (
        <p className="py-8 text-sm theme-text-muted">Loading...</p>
      ) : sent.length === 0 ? (
        <p className="py-8 text-center text-sm theme-text-muted">You have not sent any notifications yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm theme-text">
            <thead className="border-b border-black/10">
              <tr>
                <th className="px-3 py-3 font-medium theme-text-muted">Notification</th>
                <th className="px-3 py-3 font-medium theme-text-muted">Audience</th>
                <th className="px-3 py-3 font-medium theme-text-muted">Status</th>
                <th className="px-3 py-3 font-medium theme-text-muted">Delivery</th>
                <th className="px-3 py-3 font-medium theme-text-muted">Sent</th>
                <th className="px-3 py-3 font-medium theme-text-muted" />
              </tr>
            </thead>
            <tbody>
              {sent.map((item) => (
                <tr key={item.id} className="border-b border-black/5 align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs theme-text-muted">by {item.senderName} ({item.senderRole})</div>
                  </td>
                  <td className="px-3 py-3 theme-text-soft">
                    {item.audience}
                    <div className="text-xs theme-text-muted">
                      {item.scope === "All" ? "Everyone eligible" : item.scope === "Section" ? formatSectionText(item.section) : `${item.recipientCount} selected`}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={statusTone[item.status]}>{item.status}</Badge>
                    {item.status !== "Processed" && item.lastError ? <div className="mt-1 max-w-48 text-xs text-red-400">{item.lastError}</div> : null}
                    {item.status === "Queued" && item.nextAttemptAt ? <div className="mt-1 text-xs theme-text-muted">Next retry {formatDateTime(item.nextAttemptAt)}</div> : null}
                  </td>
                  <td className="px-3 py-3 text-xs theme-text-soft whitespace-nowrap">
                    <div>Pushed {item.attempted + item.acknowledged} / {item.recipientCount}</div>
                    <div>Confirmed {item.acknowledged} · Read {item.readCount}</div>
                    {item.failed > 0 ? <div className="text-red-400">Failed {item.failed}</div> : null}
                  </td>
                  <td className="px-3 py-3 text-xs theme-text-muted whitespace-nowrap">{formatDateTime(item.createdAt)}</td>
                  <td className="px-3 py-3">
                    {item.status === "Failed" ? (
                      <button type="button" onClick={() => void retry(item)} className="text-xs theme-text-primary underline underline-offset-4">Retry</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
