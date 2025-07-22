"use client";

import { Badge } from "@/components/ui/badge";

export const columns = [
  {
    accessorKey: "header",
    header: "Header",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const variant = status === "Done" ? "default" : "outline";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "target",
    header: "Target",
  },
  {
    accessorKey: "limit",
    header: "Limit",
  },
  {
    accessorKey: "reviewer",
    header: "Reviewer",
  },
];
