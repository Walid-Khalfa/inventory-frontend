"use client";
import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";
import {
  Form,
  FormControl,
  // CORRECTION 1: Fixed the typo from 'Form-Field' to 'FormField' (already done in this file)
  FormField,
  // CORRECTION 2: Added missing 'FormItem' import (already present in this version)
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  // CORRECTION 6: Fixed error message keys (already done in this file)
  customer_phone: z.string().min(1, "Customer phone is required"),
  customer_email: z.string().min(1, "Customer email is required"),
  date: z.coerce.date(),
  notes: z.string().optional(),
  products: z.array(
    z.object({
      productId: z.string().min(1),
      name: z.string().min(1),
      quantity: z.coerce.number().min(1),
      price: z.coerce.number().min(1),
      stock: z.coerce.number(),
    })
  ),
});

const DISCOUNT_RATE = 0.1; // 10% discount
const TAX_RATE = 0.08; // 8% tax

export default function NewInvoicePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimeout = useRef(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      invoice_number: "",
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      products: [],
      date: new Date(),
      notes: "",
    },
  });

  const watchedProducts = useWatch({
    control: form.control,
    name: "products",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  function formatDateTimeLocal(date) {
    const pad = (n) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        setLoading(true);
        // Note: The URL encoding fix mentioned in the initial prompt seems to be applied here already.
        const res = await axiosInstance.get(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products?filters%5Bname%5D%5B%24containsi%5D=${searchTerm}&pagination[pageSize]=25`
        );
        const products = res.data.data.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          stock: item.stock,
        }));
        setSearchResults(products);
      } catch (error) {
        console.error("Search failed", error);
        toast.error("Failed to search products.");
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [searchTerm]);

  const handleSelectProduct = (product) => {
    const productExists = form
      .getValues("products")
      .find((p) => p.productId === product.id.toString());
    if (productExists) {
      toast.error("Product already added");
    } else {
      append({
        productId: product.id.toString(),
        name: product.name,
        quantity: 1,
        price: Number(product.price),
        stock: product.stock,
      });
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  const calculateAmount = (quantity, price) => {
    return quantity * price;
  };

  // CORRECTION 4: Improved calculation logic using watchedProducts
  useEffect(() => {
    let newSubtotal = 0;
    // Use watchedProducts for calculations to ensure re-runs on changes
    watchedProducts.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      newSubtotal += calculateAmount(quantity, price);
    });

    const newDiscountAmount = newSubtotal * DISCOUNT_RATE;
    const taxableAmount = newSubtotal - newDiscountAmount;
    const newTaxAmount = taxableAmount * TAX_RATE;
    const newTotal = taxableAmount + newTaxAmount;

    setSubtotal(newSubtotal);
    setDiscountAmount(newDiscountAmount);
    setTaxAmount(newTaxAmount);
    setTotal(newTotal);
  }, [watchedProducts]); // Depend on watchedProducts for calculation effect

  async function onSubmit(data) {
  if (data.products.length === 0) {
    toast.error("At least one product is required.");
    return;
  }

  try {
    setSaving(true);

    // Recalculer les totaux directement à partir des données du formulaire pour plus de précision.
    // Cela évite les problèmes potentiels liés à l'état asynchrone.
    let calculatedSubtotal = 0;
    data.products.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      calculatedSubtotal += quantity * price;
    });
    const calculatedDiscount = calculatedSubtotal * DISCOUNT_RATE;
    const taxableAmount = calculatedSubtotal - calculatedDiscount;
    const calculatedTax = taxableAmount * TAX_RATE;
    const calculatedTotal = taxableAmount + calculatedTax;

    const salePayload = {
      customer_name: data.customer_name,
      invoice_number: data.invoice_number,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      date: data.date.toISOString(),
      notes: data.notes,
      products: data.products.map((item) => ({
        product: Number(item.productId),   // Ensure relation ID is a number for Strapi
        quantity: Number(item.quantity), // Ensure quantity is a number
        price: Number(item.price),       // Ensure price is a number
      })),
      subtotal: calculatedSubtotal,
      discount_amount: calculatedDiscount,
      tax_amount: calculatedTax,
      total: calculatedTotal,
    };

    const requestBody = {
      data: salePayload,
    };

    // Use the native `fetch` API to ensure this request targets your Next.js backend,
    // not the Strapi backend that might be configured in `axiosInstance`.
    const response = await fetch('/api/sale-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // The global Axios interceptor won't catch this, so we show a toast here.
      toast.error(errorData.message || 'Failed to create the invoice.');
      // By throwing an error, we prevent the success toast and redirect from running.
      throw new Error(errorData.message || 'Failed to create invoice');
    }

    toast.success("Invoice created successfully!");
    router.push("/dashboard/sales");
  } catch (error) {
    console.error("Transaction submission failed. Full error:", error.response ? error.response.data : error);
  } finally {
    setSaving(false);
  }
}
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full p-4 space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link href="/dashboard/sales">
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
                <span className="sr-only">Back</span>
              </Link>
              Create new invoice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label className="mb-4 text-lg text-primary">Invoice details</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  // CORRECTION 3: Added missing FormItem wrapper (already done)
                  <FormItem>
                    <FormLabel>Invoice number</FormLabel>
                    <FormControl>
                      <Input placeholder="Invoice number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  // CORRECTION 3: Added missing FormItem wrapper (already done)
                  <FormItem>
                    <FormLabel>Date & time</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Date & time"
                        type="datetime-local"
                        {...field}
                        className="w-fit"
                        value={
                          field.value
                            ? formatDateTimeLocal(new Date(field.value))
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  // CORRECTION 3: Added missing FormItem wrapper (already done)
                  <FormItem>
                    <FormLabel>Customer name</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  // CORRECTION 3: Added missing FormItem wrapper (already done)
                  <FormItem>
                    <FormLabel>Customer email</FormLabel>
                    <FormControl>
                      {/* CORRECTION 9: Added type="email" (already done) */}
                      <Input placeholder="Customer email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customer_phone"
                render={({ field }) => (
                  // CORRECTION 3: Added missing FormItem wrapper (already done)
                  <FormItem>
                    <FormLabel>Customer phone</FormLabel>
                    <FormControl>
                      {/* CORRECTION 9: Added type="tel" (already done) */}
                      <Input placeholder="Customer phone" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator />
            <Label className="mb-4 text-lg text-primary">Product details</Label>
            <div>
              <Label className="mb-2">Search Products</Label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name..."
              />
              {loading && <p className="text-sm my-2">Searching...</p>}
              {searchResults.length > 0 && (
                <ScrollArea className="border rounded p-2 max-h-60 mt-2">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="cursor-pointer p-2 hover:bg-muted rounded"
                      onClick={() => handleSelectProduct(product)}
                    >
                      {/* CORRECTION 10: Format price in search results (already done) */}
                      {product.name} - ${product.price.toFixed(2)} - {product.stock} in
                      stock
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
            {fields?.map((item, index) => (
              // CORRECTION 7: Use item.id for better React list key and fixed comment placement (already done)
              <div
                key={item.id}
                className="border p-3 rounded mb-2 grid grid-cols-1 md:grid-cols-5 gap-4 items-center"
              >
                <div>
                  <Label className="mb-2">Product</Label>
                  <Input value={item.name} readOnly />
                </div>
                <div>
                  <Label className="mb-2">Quantity</Label>
                  {/* CORRECTION 8: Use FormField for quantity (already done) */}
                  <FormField
                    control={form.control}
                    name={`products.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(+e.target.value)} // Ensure number type
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Label className="mb-2">Price</Label>
                  {/* CORRECTION 8: Use FormField for price (already done) */}
                  <FormField
                    control={form.control}
                    name={`products.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(+e.target.value)} // Ensure number type
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Label className="mb-2">Amount</Label>
                  <Input
                    className="text-primary"
                    // CORRECTION: Moved comment outside the value expression (already done)
                    value={(
                      (form.getValues(`products.${index}.quantity`) || 0) *
                      (form.getValues(`products.${index}.price`) || 0)
                    ).toFixed(2)} // CORRECTION 10: Format amount
                    readOnly
                  />
                </div>
                <div className="pt-6">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Separator />
            <Label className="mb-4 text-lg text-primary">Invoice summary</Label>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="col-span-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    // CORRECTION 3: Added missing FormItem wrapper (already done)
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl className="h-36">
                        <Textarea
                          placeholder="Additional notes"
                          {...field}
                          rows={10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-2 flex flex-col justify-end space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  {/* CORRECTION 10: Format subtotal (already done) */}
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  {/* CORRECTION 10: Format discount rate (already done) */}
                  <span>Discount ({(DISCOUNT_RATE * 100).toFixed(0)}%):</span>
                  {/* CORRECTION 10: Format discount amount (already done) */}
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  {/* CORRECTION 10: Format tax rate (already done) */}
                  <span>Tax ({(TAX_RATE * 100).toFixed(0)}%):</span>
                  {/* CORRECTION 10: Format tax amount (already done) */}
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  {/* CORRECTION 10: Format total (already done) */}
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex gap-2 w-full items-center">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Submit Invoice"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/sales")}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}