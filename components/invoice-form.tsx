"use client"

import type React from "react"
import { Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Invoice, InvoiceItem } from "@/types/invoice"

interface InvoiceFormProps {
  invoice: Invoice
  onChange: (invoice: Invoice) => void
  activeTab: "edit" | "preview"
  setActiveTab: (tab: "edit" | "preview") => void
}

export function InvoiceForm({ invoice, onChange, activeTab, setActiveTab }: InvoiceFormProps) {
  const updateInvoice = (updates: Partial<Invoice>) => {
    onChange({ ...invoice, ...updates })
  }

  const updateFrom = (updates: Partial<Invoice["from"]>) => {
    onChange({ ...invoice, from: { ...invoice.from, ...updates } })
  }

  const updateTo = (updates: Partial<Invoice["to"]>) => {
    onChange({ ...invoice, to: { ...invoice.to, ...updates } })
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      hours: 0,
      rate: 0,
    }
    updateInvoice({ items: [...invoice.items, newItem] })
  }

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    const updatedItems = invoice.items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    updateInvoice({ items: updatedItems })
  }

  const removeItem = (id: string) => {
    const updatedItems = invoice.items.filter((item) => item.id !== id)
    updateInvoice({ items: updatedItems })
  }

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

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        updateInvoice({ logoUrl: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto relative">
      {/* Liquid Glass Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,154,158,0.1),transparent_50%)] pointer-events-none" />

      {/* Floating Glass Panel for Header Controls */}
      <div className="mb-8 relative">
        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl p-6 shadow-2xl shadow-black/10 relative overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-1">
                <Select
                  value={invoice.currency}
                  onValueChange={(value) => updateInvoice({ currency: value as Invoice["currency"] })}
                >
                  <SelectTrigger className="bg-transparent border-0 text-gray-700 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-1 backdrop-blur-md bg-white/10 border border-white/20 p-1.5 rounded-2xl">
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

      {/* Main Content Container with Liquid Glass Effect */}
      <div className="relative">
        {/* Floating glass container */}
        <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-black/10 relative overflow-hidden">
          {/* Multiple glass reflection layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-pink-500/10 to-transparent rounded-full blur-2xl" />

          <div className="relative z-10 space-y-6">
            {/* Company Information Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Información de la empresa */}
              <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Información de la Empresa
                  </h3>
                  <div className="space-y-4">
                    <div className="backdrop-blur-sm bg-white/40 border-2 border-dashed border-white/50 rounded-xl p-6 text-center hover:border-white/60 transition-colors duration-300">
                      {invoice.logoUrl ? (
                        <img src={invoice.logoUrl || "/placeholder.svg"} alt="Logo" className="max-h-20 mx-auto mb-2" />
                      ) : (
                        <div className="text-gray-600 mb-2">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          Añade tu logotipo
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Subir imagen
                      </label>
                    </div>

                    <div>
                      <Label htmlFor="from-name" className="text-gray-700 font-medium">
                        Nombre/Empresa
                      </Label>
                      <Input
                        id="from-name"
                        value={invoice.from.name}
                        onChange={(e) => updateFrom({ name: e.target.value })}
                        placeholder="Tu nombre o empresa"
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-blue-400 focus:ring-blue-400/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="from-address" className="text-gray-700 font-medium">
                        Dirección
                      </Label>
                      <Textarea
                        id="from-address"
                        value={invoice.from.address}
                        onChange={(e) => updateFrom({ address: e.target.value })}
                        placeholder="Dirección completa"
                        rows={3}
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-blue-400 focus:ring-blue-400/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="from-email" className="text-gray-700 font-medium">
                        Email
                      </Label>
                      <Input
                        id="from-email"
                        type="email"
                        value={invoice.from.email}
                        onChange={(e) => updateFrom({ email: e.target.value })}
                        placeholder="email@ejemplo.com"
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-blue-400 focus:ring-blue-400/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="from-phone" className="text-gray-700 font-medium">
                        Teléfono
                      </Label>
                      <Input
                        id="from-phone"
                        value={invoice.from.phone}
                        onChange={(e) => updateFrom({ phone: e.target.value })}
                        placeholder="+34 123 456 789"
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-blue-400 focus:ring-blue-400/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del cliente */}
              <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Destinatario
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="to-name" className="text-gray-700 font-medium">
                        Nombre/Empresa
                      </Label>
                      <Input
                        id="to-name"
                        value={invoice.to.name}
                        onChange={(e) => updateTo({ name: e.target.value })}
                        placeholder="Nombre del cliente"
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="to-address" className="text-gray-700 font-medium">
                        Dirección
                      </Label>
                      <Textarea
                        id="to-address"
                        value={invoice.to.address}
                        onChange={(e) => updateTo({ address: e.target.value })}
                        placeholder="Dirección del cliente"
                        rows={3}
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="to-email" className="text-gray-700 font-medium">
                        Email
                      </Label>
                      <Input
                        id="to-email"
                        type="email"
                        value={invoice.to.email}
                        onChange={(e) => updateTo({ email: e.target.value })}
                        placeholder="cliente@ejemplo.com"
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="to-phone" className="text-gray-700 font-medium">
                        Teléfono
                      </Label>
                      <Input
                        id="to-phone"
                        value={invoice.to.phone}
                        onChange={(e) => updateTo({ phone: e.target.value })}
                        placeholder="+34 123 456 789"
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles de la factura */}
              <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Detalles del documento
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invoice-title" className="text-gray-700 font-medium">
                        Tipo de Documento
                      </Label>
                      <Input
                        id="invoice-title"
                        value={invoice.title}
                        onChange={(e) => updateInvoice({ title: e.target.value })}
                        placeholder="FACTURA"
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-purple-400 focus:ring-purple-400/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="invoice-id" className="text-gray-700 font-medium">
                        Número de {invoice.title}
                      </Label>
                      <div className="flex items-center mt-1">
                        <span className="text-gray-600 mr-2 font-medium">#</span>
                        <Input
                          id="invoice-id"
                          value={invoice.id}
                          onChange={(e) => updateInvoice({ id: e.target.value })}
                          placeholder="2"
                          className="backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-purple-400 focus:ring-purple-400/20"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="date" className="text-gray-700 font-medium">
                        Fecha
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={invoice.date}
                        onChange={(e) => updateInvoice({ date: e.target.value })}
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 focus:border-purple-400 focus:ring-purple-400/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="due-date" className="text-gray-700 font-medium">
                        Fecha de vencimiento
                      </Label>
                      <Input
                        id="due-date"
                        type="date"
                        value={invoice.dueDate}
                        onChange={(e) => updateInvoice({ dueDate: e.target.value })}
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 focus:border-purple-400 focus:ring-purple-400/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="payment-terms" className="text-gray-700 font-medium">
                        Condiciones de pago
                      </Label>
                      <Input
                        id="payment-terms"
                        value={invoice.paymentTerms}
                        onChange={(e) => updateInvoice({ paymentTerms: e.target.value })}
                        placeholder="Net 30"
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-purple-400 focus:ring-purple-400/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="purchase-order" className="text-gray-700 font-medium">
                        Orden de Compra
                      </Label>
                      <Input
                        id="purchase-order"
                        value={invoice.purchaseOrder}
                        onChange={(e) => updateInvoice({ purchaseOrder: e.target.value })}
                        placeholder="PO-12345"
                        className="mt-1 backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-purple-400 focus:ring-purple-400/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  Elementos
                </h3>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-800 text-white rounded-lg">
                        <th className="text-left p-3 rounded-l-md">
                          <Input
                            value={invoice.tableHeaders.description}
                            onChange={(e) =>
                              updateInvoice({
                                tableHeaders: { ...invoice.tableHeaders, description: e.target.value },
                              })
                            }
                            className="bg-transparent border-0 text-white placeholder-gray-300 focus:ring-0 focus:border-0 px-2 py-1 h-auto font-semibold"
                            placeholder="Artículo"
                          />
                        </th>
                        <th className="text-center p-3">
                          <Input
                            value={invoice.tableHeaders.hours}
                            onChange={(e) =>
                              updateInvoice({
                                tableHeaders: { ...invoice.tableHeaders, hours: e.target.value },
                              })
                            }
                            className="bg-transparent border-0 text-white placeholder-gray-300 focus:ring-0 focus:border-0 px-2 py-1 h-auto font-semibold text-left"
                            placeholder="Horas"
                          />
                        </th>
                        <th className="text-center p-3">
                          <Input
                            value={invoice.tableHeaders.rate}
                            onChange={(e) =>
                              updateInvoice({
                                tableHeaders: { ...invoice.tableHeaders, rate: e.target.value },
                              })
                            }
                            className="bg-transparent border-0 text-white placeholder-gray-300 focus:ring-0 focus:border-0 px-2 py-1 h-auto font-semibold text-left"
                            placeholder="Precio Hora"
                          />
                        </th>
                        <th className="text-center p-3 min-w-[120px]">Total</th>
                        <th className="rounded-r-md"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-1">
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, { description: e.target.value })}
                              placeholder={`Descripción del ${invoice.tableHeaders.description.toLowerCase()}`}
                              className="w-full backdrop-blur-sm bg-white/40 border-white/50 rounded-md px-3 h-10 py-2 text-gray-800 placeholder-gray-600"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <Input
                              type="number"
                              value={item.hours}
                              onChange={(e) => updateItem(item.id, { hours: Number(e.target.value) || 0 })}
                              className="w-full backdrop-blur-sm bg-white/40 border-white/50 rounded-md px-3 py-2 h-10 text-center text-gray-800"
                              min="0"
                              step="0.1"
                            />
                          </td>
                          <td className="p-1 text-left">
                            <div className="flex items-center backdrop-blur-sm bg-white/40 border-white/50 rounded-md px-3 py-2 h-10">
                              <span className="text-gray-600 mr-1">{invoice.currency === "EUR" ? "€" : "$"}</span>
                              <Input
                                type="number"
                                value={item.rate}
                                onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) || 0 })}
                                className="border-0 bg-transparent text-center w-full p-0 h-full text-gray-800"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </td>
                          <td className="p-3 text-center min-w-[120px]">
                            <span className="font-medium text-gray-800">
                              {((Number(item.hours) || 0) * (Number(item.rate) || 0)).toFixed(2)}{" "}
                              {invoice.currency === "EUR" ? "€" : "$"}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50/50"
                            >
                              ×
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  onClick={addItem}
                  variant="outline"
                  className="mt-4 backdrop-blur-sm bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir elemento
                </Button>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Notas y términos */}
              <div className="space-y-6">
                <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                      Notas
                    </h3>
                    <Textarea
                      value={invoice.notes}
                      onChange={(e) => updateInvoice({ notes: e.target.value })}
                      placeholder="Notas: cualquier información relevante que no esté ya cubierta"
                      rows={4}
                      className="backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                      Términos
                    </h3>
                    <Textarea
                      value={invoice.terms}
                      onChange={(e) => updateInvoice({ terms: e.target.value })}
                      placeholder="Términos y condiciones: cargos por pagos atrasados, métodos de pago, calendario de entrega"
                      rows={4}
                      className="backdrop-blur-sm bg-white/40 border-white/50 text-gray-800 placeholder-gray-600 focus:border-indigo-400 focus:ring-indigo-400/20"
                    />
                  </div>
                </div>
              </div>

              {/* Totales */}
              <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                    <div className="w-2 h-2 bg-rose-500 rounded-full mr-3"></div>
                    Resumen
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Subtotal</span>
                      <span className="font-medium text-gray-800">
                        {calculateSubtotal().toFixed(2)} {invoice.currency === "EUR" ? "€" : "$"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Impuesto</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={invoice.taxRate}
                          onChange={(e) => updateInvoice({ taxRate: Number(e.target.value) || 0 })}
                          className="w-16 text-center backdrop-blur-sm bg-white/40 border-white/50 text-gray-800"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <span className="text-gray-700">%</span>
                        <span className="font-medium w-20 text-right text-gray-800">
                          {calculateTax().toFixed(2)} {invoice.currency === "EUR" ? "€" : "$"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-emerald-600">+ Descuento</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={invoice.discountRate}
                          onChange={(e) => updateInvoice({ discountRate: Number(e.target.value) || 0 })}
                          className="w-16 text-center backdrop-blur-sm bg-white/40 border-white/50 text-gray-800"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <span className="text-gray-700">%</span>
                        <span className="font-medium w-20 text-right text-emerald-600">
                          -{calculateDiscount().toFixed(2)} {invoice.currency === "EUR" ? "€" : "$"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-emerald-600">+ Envío</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">{invoice.currency === "EUR" ? "€" : "$"}</span>
                        <Input
                          type="number"
                          value={invoice.shippingAmount}
                          onChange={(e) => updateInvoice({ shippingAmount: Number(e.target.value) || 0 })}
                          className="w-20 text-center backdrop-blur-sm bg-white/40 border-white/50 text-gray-800"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <hr className="border-white/30" />

                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-800">Total</span>
                      <span className="text-gray-800">
                        {calculateTotal().toFixed(2)} {invoice.currency === "EUR" ? "€" : "$"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Cantidad Pagada</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">{invoice.currency === "EUR" ? "€" : "$"}</span>
                        <Input
                          type="number"
                          value={invoice.paidAmount}
                          onChange={(e) => updateInvoice({ paidAmount: Number(e.target.value) || 0 })}
                          className="w-20 text-center backdrop-blur-sm bg-white/40 border-white/50 text-gray-800"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-800">Saldo Adeudado</span>
                      <span className="text-gray-800">
                        {calculateBalance().toFixed(2)} {invoice.currency === "EUR" ? "€" : "$"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
