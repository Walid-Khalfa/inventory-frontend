"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import axiosInternal from "@/lib/axios-internal";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

export default function InvoicePrint() {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const printRef = useRef();
  const { id } = useParams();

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || id === 'undefined' || id === 'null') {
        console.error("Invalid invoice ID:", id);
        setError("Invalid invoice ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const res = await axiosInternal.get(`/api/sales/${id}`);
        setInvoice(res.data.data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch invoice:", error);
        setError(error.response?.status === 404 ? "Invoice not found" : "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    
    if (id && id !== 'undefined' && id !== 'null') {
      fetchInvoice();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-300 p-8">
        Loading invoice...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeftIcon /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeftIcon /> Back to Invoices
        </Button>
        <Button onClick={handlePrint} className="mb-4">
          Print Invoice
        </Button>
      </div>

      <div
        ref={printRef}
        className="bg-white text-black dark:bg-gray-900 dark:text-white p-8 rounded shadow max-w-3xl mx-auto
                   print:block print:p-0 print:shadow-none print:max-w-full print:rounded-none print:bg-white print:text-black"
      >
        <h1 className="text-2xl font-bold mb-4">
          Invoice #{invoice.invoice_number}
        </h1>
        <p>
          <strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}
        </p>
        <p>
          <strong>Customer:</strong> {invoice.customer_name}
        </p>
        <p>
          <strong>Email:</strong> {invoice.customer_email}
        </p>
        <p>
          <strong>Phone:</strong> {invoice.customer_phone}
        </p>

        <hr className="my-4 border-gray-300 dark:border-gray-700" />

        <table className="w-full border border-gray-300 dark:border-gray-700 mb-4">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">
                Product
              </th>
              <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">
                Price
              </th>
              <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">
                Quantity
              </th>
              <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.products.map((item, index) => {
              return (
                <tr key={index}>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    <div className="flex items-center gap-2">
                      <span>Product ID: {item.product}</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="text-right">
          <p>
            <strong>Subtotal:</strong> ${invoice.subtotal.toFixed(2)}
          </p>
          <p>
            <strong>Discount:</strong> -${invoice.discount_amount.toFixed(2)}
          </p>
          <p>
            <strong>Tax:</strong> +${invoice.tax_amount.toFixed(2)}
          </p>
          <p className="text-xl font-bold mt-2">
            <strong>Total:</strong> ${invoice.total.toFixed(2)}
          </p>
        </div>

        {invoice.notes && (
          <div className="mt-4">
            <p>
              <strong>Notes:</strong>
            </p>
            <p className="italic">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
