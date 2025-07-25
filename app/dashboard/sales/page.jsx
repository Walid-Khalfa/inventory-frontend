"use client";

import { getColumns } from "./features/columns";
import { DataTable } from "@/components/data-table";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import axiosInternal from "@/lib/axios-internal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // Correct import for useRouter
import axiosInstance from "@/lib/axios"; // Added this import for handleDelete

const Page = () => {
  // Call useRouter hook once at the top level of the component
  const router = useRouter(); // <--- FIX: Declare router here

  const [filters, setFilters] = React.useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  // Assuming these are defined elsewhere or need to be initialized:
  const [selectedItem, setSelectedItem] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  // Placeholder for handleFilterChange, define its actual logic if needed
  const [handleFilterChange, setHandleFilterChange] = useState(() => () => {});


  const fetchData = () => {
    setLoading(true);
    axiosInternal
      .get(`/api/sale-transactions`)
      .then((response) => {
        setSales(response.data.data);
      })
      .catch((error) => {
        toast.error("Failed to fetch sales records.");
        console.log("Failed to fetch sales:", error);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageSizeChange = (value) => {
    setPageSize(Number(value));
    setPage(1);
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.customer_name}"?`)) return;

    try {
      await axiosInstance.delete(`/api/sales/${item.id}`);
      await fetchData();
      toast.success("Sale deleted successfully");
    } catch (error) {
      console.log("Delete failed: ", error);
      toast.error("Failed to delete sales record");
    }
  };

  const columns = getColumns(
    filters,
    handleFilterChange,
    (item) => {
      setSelectedItem(item);
      setSheetOpen(true);
    },
    handleDelete
  );

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Sales</CardTitle>
          <CardDescription>
            <span>List of sales</span>
          </CardDescription>

          <CardAction>
            {/* FIX: Use the 'router' instance obtained from the hook */}
            <Button onClick={() => router.push("/dashboard/sales/new")}>
              Add a new invoice
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <DataTable columns={columns} data={sales} loading={loading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
