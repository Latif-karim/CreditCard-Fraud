"use client";

import { Suspense } from "react";

import { TableSkeleton } from "@/components/skeletons";

import { MonitoringContent } from "./monitoring-content";

export default function MonitoringPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={9} />}>
      <MonitoringContent />
    </Suspense>
  );
}
