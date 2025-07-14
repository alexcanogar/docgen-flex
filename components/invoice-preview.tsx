"use client"

import type { Invoice } from "@/types/invoice"
import { Card, CardContent } from "@/components/ui/card"
import { Download, PrinterIcon as Print } from "lucide-react"
import { generateInvoicePdfAction } from "@/app/actions"

interface InvoicePreviewProps {
  invoice: Invoice
  activeTab: "edit" | "preview"
  setActiveTab: (tab: "edit" | "preview") => void
}

export function InvoicePreview({ invoice, activeTab, setActiveTab }: InvoicePreviewProps) {
  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => {
      return sum + (Number(item.hours) || 0) * (Number(item.rate) || 0)
    }, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * ((Number(invoice.taxRate) || 0) / 100)
  }

  const calculateDiscount = () => {
    return calculateSubtotal() * ((Number(invoice.discountRate) || 0) / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscount() + (Number(invoice.shippingAmount) || 0)
  }

  const calculateBalance = () => {
    return calculateTotal() - (Number(invoice.paidAmount) || 0)
  }

  const currencySymbol = invoice.currency === "EUR" ? "€" : invoice.currency === "USD" ? "$" : "£"

  const handlePrint = async () => {
    const pdfDataUri = await generateInvoicePdfAction(invoice)
    window.open(pdfDataUri, "_blank")
  }

  const handleDownload = async () => {
    const pdfDataUri = await generateInvoicePdfAction(invoice)
    const link = document.createElement("a")
    link.href = pdfDataUri
    link.download = `${invoice.title}_${invoice.id}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isFromFilled = invoice.from.name || invoice.from.address || invoice.from.email || invoice.from.phone
  const isToFilled = invoice.to.name || invoice.to.address || invoice.to.email || invoice.to.phone
  const items = invoice.items.filter((item) => item.description.trim() !== "")

  return (
    <div className="w-full max-w-7xl mx-auto relative">
      {/* Liquid Glass Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,154,158,0.1),transparent_50%)] pointer-events-none" />

      {/* Floating Glass Panel for Controls */}
      <div className="mb-8 relative">
        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl p-6 shadow-2xl shadow-black/10 relative overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center print:hidden w-full gap-4">
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <button
                onClick={handlePrint}
                className="group relative overflow-hidden backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-2xl px-6 py-3 transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center space-x-2 text-gray-700 group-hover:text-gray-900">
                  <Print className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Imprimir</span>
                </div>
              </button>

              <button
                onClick={handleDownload}
                className="group relative overflow-hidden backdrop-blur-md bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 hover:border-emerald-500/40 rounded-2xl px-6 py-3 transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center space-x-2 text-emerald-700 group-hover:text-emerald-800">
                  <Download className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Descargar PDF</span>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 w-full sm:w-auto backdrop-blur-md bg-white/10 border border-white/20 p-1.5 rounded-2xl">
              <button
                onClick={() => setActiveTab("edit")}
                className={`relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out ${
                  activeTab === "edit"
                    ? "bg-white/80 text-gray-900 shadow-lg shadow-black/10 scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/20"
                }`}
              >
                {activeTab === "edit" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl" />
                )}
                <span className="relative">Editar Documento</span>
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out ${
                  activeTab === "preview"
                    ? "bg-white/80 text-gray-900 shadow-lg shadow-black/10 scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/20"
                }`}
              >
                {activeTab === "preview" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl" />
                )}
                <span className="relative">Vista Previa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div className="relative">
        <Card className="print:shadow-none print:border-none bg-transparent lg:shadow-2xl rounded-none lg:rounded-2xl lg:w-[210mm] lg:mx-auto invoice-preview">
          <CardContent className="bg-white p-4 sm:p-8 lg:p-[1.5cm] min-h-[297mm] lg:min-h-[297mm] flex flex-col">
            {/* Contenido principal */}
            <div className="flex-1">
              {/* Header */}
              <div className="flex flex-col gap-4 sm:flex-row justify-between items-start mb-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{invoice.title}</h1>
                  <div className="text-sm text-gray-600 space-y-1">
                    {invoice.id && <p className="text-base sm:text-lg">#{invoice.id}</p>}
                    <p>
                      Fecha: {invoice.date ? new Date(invoice.date).toLocaleDateString("es-ES") : "No especificada"}
                    </p>
                    {invoice.dueDate && <p>Vencimiento: {new Date(invoice.dueDate).toLocaleDateString("es-ES")}</p>}
                  </div>
                </div>
                <div className="sm:text-right">
                  {invoice.logoUrl && (
                    <img
                      src={invoice.logoUrl || "/placeholder.svg"}
                      alt="Logo de la empresa"
                      className="max-h-16 max-w-32 object-contain"
                    />
                  )}
                </div>
              </div>

              {/* From/To */}
              {(isFromFilled || isToFilled) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
                  {isFromFilled && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">De:</h3>
                      <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                        {invoice.from.name && <p className="font-medium">{invoice.from.name}</p>}
                        {invoice.from.address && <p className="whitespace-pre-line">{invoice.from.address}</p>}
                        {invoice.from.email && <p>{invoice.from.email}</p>}
                        {invoice.from.phone && <p>{invoice.from.phone}</p>}
                      </div>
                    </div>
                  )}
                  {isToFilled && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Para:</h3>
                      <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                        {invoice.to.name && <p className="font-medium">{invoice.to.name}</p>}
                        {invoice.to.address && <p className="whitespace-pre-line">{invoice.to.address}</p>}
                        {invoice.to.email && <p>{invoice.to.email}</p>}
                        {invoice.to.phone && <p>{invoice.to.phone}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              <div className="mb-8 overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="text-left p-2 sm:p-3 rounded-l-md w-1/2">{invoice.tableHeaders.description}</th>
                      <th className="text-center p-2 sm:p-3">{invoice.tableHeaders.hours}</th>
                      <th className="text-center p-2 sm:p-3">{invoice.tableHeaders.rate}</th>
                      <th className="text-right p-2 sm:p-3 rounded-r-md">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2 sm:p-3">{item.description}</td>
                        <td className="p-2 sm:p-3 text-center">{item.hours}</td>
                        <td className="p-2 sm:p-3 text-center">
                          {currencySymbol} {(Number(item.rate) || 0).toFixed(2)}
                        </td>
                        <td className="p-2 sm:p-3 text-right font-medium">
                          {currencySymbol} {((Number(item.hours) || 0) * (Number(item.rate) || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                          No hay artículos añadidos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer - ahora fuera del contenido principal */}
            <div className="mt-auto border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Notes and Terms */}
                <div className="space-y-6 text-xs sm:text-sm">
                  {invoice.notes?.trim() && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Notas:</h4>
                      <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms?.trim() && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Términos y Condiciones:</h4>
                      <p className="text-gray-700 whitespace-pre-line">{invoice.terms}</p>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="text-right text-xs sm:text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        {currencySymbol} {calculateSubtotal().toFixed(2)}
                      </span>
                    </div>
                    {invoice.taxRate > 0 && (
                      <div className="flex justify-between">
                        <span>Impuesto (${invoice.taxRate}%):</span>
                        <span className="font-medium">
                          {currencySymbol} {calculateTax().toFixed(2)}
                        </span>
                      </div>
                    )}
                    {invoice.discountRate > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Descuento (${invoice.discountRate}%):</span>
                        <span className="font-medium">
                          -{currencySymbol} {calculateDiscount().toFixed(2)}
                        </span>
                      </div>
                    )}
                    {invoice.shippingAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Envío:</span>
                        <span className="font-medium">
                          {currencySymbol} {invoice.shippingAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between text-base sm:text-lg font-semibold">
                      <span>Total:</span>
                      <span>
                        {currencySymbol} {calculateTotal().toFixed(2)}
                      </span>
                    </div>
                    {invoice.paidAmount > 0 && (
                      <>
                        <div className="flex justify-between mt-2">
                          <span>Cantidad Pagada:</span>
                          <span className="font-medium">
                            {currencySymbol} {invoice.paidAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-base sm:text-lg font-semibold">
                          <span>Saldo Adeudado:</span>
                          <span>
                            {currencySymbol} {calculateBalance().toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
