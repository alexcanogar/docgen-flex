"use client"

import { useState } from "react"
import { InvoiceForm } from "@/components/invoice-form"
import { InvoicePreview } from "@/components/invoice-preview"
import type { Invoice } from "@/types/invoice"

const initialInvoice: Invoice = {
  id: "001",
  title: "FACTURA",
  date: "2025-01-15",
  dueDate: "",
  purchaseOrder: "",
  paymentTerms: "",
  currency: "EUR",
  from: {
    name: "",
    company: "",
    address: "",
    email: "",
    phone: "",
  },
  to: {
    name: "",
    company: "",
    address: "",
    email: "",
    phone: "",
  },
  items: [
    {
      id: "1",
      description: 'Producto ejemplo 01"',
      hours: 2,
      rate: 35.42,
    },
    {
      id: "2",
      description: "Segundo producto ejemplo 02",
      hours: 5,
      rate: 17.44,
    },
  ],
  tableHeaders: {
    description: "Producto",
    hours: "Cantidad",
    rate: "Precio Unitario",
  },
  notes: "",
  terms: "",
  taxRate: 0,
  discountRate: 0,
  shippingAmount: 0,
  paidAmount: 0,
  logoUrl: "",
}

export default function HomePage() {
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

  const handleNextOrDownload = () => {
    if (activeTab === "edit") {
      setActiveTab("preview")
    } else {
      // Trigger download from preview
      const event = new CustomEvent("downloadInvoice")
      window.dispatchEvent(event)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generador de Documentos</h1>
          <p className="text-gray-600">Crea facturas, recibos y presupuestos de manera fácil e intuitiva</p>
        </div>

        {activeTab === "edit" ? (
          <InvoiceForm invoice={invoice} onChange={setInvoice} activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : (
          <InvoicePreview invoice={invoice} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <div className="mt-8 flex justify-end">
          {activeTab === "edit" && (
            <button
              onClick={handleNextOrDownload}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-lg"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
