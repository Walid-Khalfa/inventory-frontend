"use client";

import ColumnFilter from "@/components/ColumnFilter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical } from "@tabler/icons-react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useState } from "react";

export const getColumns = (filters, handleFilterChange, onEdit, onDelete) => {
  const ImageCell = ({ row }) => {
    const [open, setOpen] = useState(false);
    const imageUrl =
      process.env.NEXT_PUBLIC_STRAPI_URL + row.original.image.url;

    return (
      <div className="h-12 w-12 overflow-hidden">
        {row.original.image && (
          <>
            <Button onClick={() => setOpen(true)} variant="ghost" size="icon">
              <Image
                src={
                  process.env.NEXT_PUBLIC_STRAPI_URL +
                  (row.original.image.formats?.thumbnail?.url ||
                    row.original.image.url)
                }
                alt={row.original.name}
                width={50}
                height={50}
                className=""
              />
            </Button>
            <Lightbox
              open={open}
              close={() => setOpen(false)}
              slides={[{ src: imageUrl, alt: row.original.name }]}
            />
          </>
        )}
      </div>
    );
  };

  return [
    {
      accessorKey: "image",
      header: "Image",
      cell: ImageCell,
    },
    {
      accessorKey: "barcode",
      header: () => (
        <ColumnFilter
          label="Barcode"
          placeholder="Filter barcode..."
          value={filters.barcode || ""}
          onChange={(val) => handleFilterChange("barcode", val)}
        />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "name",
      header: () => (
        <ColumnFilter
          label="Name"
          placeholder="Filter name..."
          value={filters.name || ""}
          onChange={(val) => handleFilterChange("name", val)}
        />
      ),
      cell: (info) => info.getValue(),
    },
    { accessorKey: "category.name", header: "Category" },
    { accessorKey: "price", header: "Price" },
    { accessorKey: "stock", header: "Stock" },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={() => {
                onEdit(row.original);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                onDelete(row.original);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
};
