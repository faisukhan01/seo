"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { History, Loader2, RefreshCw, SearchX } from "lucide-react";
import type { AuditHistoryPoint, AuditRecordSummary } from "@/lib/seo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { relativeTime, scoreBadgeClass } from "./helpers";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number | string; payload?: { grade?: string; fullDate?: string } }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{point?.fullDate ?? label}</p>
      <p className="mt-0.5 text-muted-foreground">
        Score <span className="font-semibold text-foreground">{payload[0]?.value}</span>
        {point?.grade ? ` · grade ${point.grade}` : ""}
      </p>
    </div>
  );
}

export function HistoryTab({
  audits,
  loading,
  loadingAuditId,
  selectedDomain,
  history,
  onSelect,
  onRefresh,
}: {
  audits: AuditRecordSummary[];
  loading: boolean;
  loadingAuditId: string | null;
  selectedDomain: string | null;
  history: AuditHistoryPoint[];
  onSelect: (id: string) => void;
  onRefresh: () => void;
}) {
  const chartData = useMemo(
    () =>
      history.map((h) => ({
        date: new Date(h.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        fullDate: new Date(h.createdAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        score: h.overallScore,
        grade: h.grade,
      })),
    [history],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Recent audits</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="min-h-9 gap-2"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {loading && audits.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Loading audits…
        </div>
      ) : audits.length === 0 ? (
        <Card className="py-14">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted">
              <SearchX className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">No audits yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Run your first audit from the Audit tab — every run is stored here
              so you can track scores over time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Domain</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead className="min-w-[100px]">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((a) => (
                <TableRow
                  key={a.id}
                  onClick={() => onSelect(a.id)}
                  className="min-h-11 cursor-pointer"
                  aria-label={`Load audit for ${a.domain}`}
                >
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium">
                      {loadingAuditId === a.id ? (
                        <Loader2 className="size-3.5 animate-spin text-emerald-500" />
                      ) : null}
                      {a.domain}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("tabular-nums", scoreBadgeClass(a.overallScore))}
                    >
                      {a.overallScore}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{a.grade}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 text-xs tabular-nums">
                      <span className="text-red-600 dark:text-red-400">{a.criticalCount}C</span>
                      <span className="text-amber-600 dark:text-amber-400">{a.warningCount}W</span>
                      <span className="text-muted-foreground">{a.infoCount}I</span>
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">{a.pagesAudited}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {relativeTime(a.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <History className="size-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold">
              Overall score over time
              {selectedDomain ? (
                <span className="ml-1 font-normal text-muted-foreground">
                  — {selectedDomain}
                </span>
              ) : null}
            </h3>
          </div>
          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Select an audit from the table above (or run a new one) to see the
              score history for its domain.
            </p>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="currentColor"
                    opacity={0.6}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="currentColor"
                    opacity={0.6}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#10b981", strokeOpacity: 0.3 }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#scoreAreaFill)"
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
