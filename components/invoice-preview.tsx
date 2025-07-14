"use client"

import type { Invoice } from "@/types/invoice"
import { Card, CardContent } from "@/components/ui/card"
import { Download, PrinterIcon as Print } from "lucide-react"
import { jsPDF } from "jspdf"

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

  const loadImage = (
    url: string,
  ): Promise<{ img: HTMLImageElement; width: number; height: number; format: string } | null> => {
    return new Promise((resolve) => {
      if (!url) {
        return resolve(null)
      }
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = url

      img.onload = () => {
        const originalWidthPx = img.naturalWidth
        const originalHeightPx = img.naturalHeight

        const maxPixelWidth = 300
        const maxPixelHeight = 150

        let targetWidthPx = originalWidthPx
        let targetHeightPx = originalHeightPx

        if (originalWidthPx > maxPixelWidth) {
          targetWidthPx = maxPixelWidth
          targetHeightPx = (originalHeightPx * maxPixelWidth) / originalWidthPx
        }

        if (targetHeightPx > maxPixelHeight) {
          targetHeightPx = maxPixelHeight
          targetWidthPx = (originalWidthPx * maxPixelHeight) / originalHeightPx
        }

        const canvas = document.createElement("canvas")
        canvas.width = targetWidthPx
        canvas.height = targetHeightPx
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidthPx, targetHeightPx)
        }

        const resizedDataUrl = canvas.toDataURL("image/png")

        const maxLogoWidthMm = 30
        const maxLogoHeightMm = 15

        let imgPdfWidth = maxLogoWidthMm
        let imgPdfHeight = (targetHeightPx * maxLogoWidthMm) / targetWidthPx

        if (imgPdfHeight > maxLogoHeightMm) {
          imgPdfHeight = maxLogoHeightMm
          imgPdfWidth = (targetWidthPx * maxLogoHeightMm) / targetHeightPx
        }

        const formatMatch = resizedDataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,/)
        const format = formatMatch ? formatMatch[1].toUpperCase() : "PNG"

        const resizedImg = new Image()
        resizedImg.src = resizedDataUrl
        resizedImg.onload = () => {
          resolve({ img: resizedImg, width: imgPdfWidth, height: imgPdfHeight, format })
        }
        resizedImg.onerror = (e) => {
          console.error("Error al cargar la imagen redimensionada:", e)
          resolve(null)
        }
      }
      img.onerror = (e) => {
        console.error("Error al cargar la imagen del logo original:", e)
        resolve(null)
      }
    })
  }

  const generateInvoicePdf = async () => {
    const doc = new jsPDF("p", "mm", "a4")
    const margin = 15
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const usableWidth = pageWidth - margin * 2
    let y = margin

    // Load the logo image first
    const logoData = await loadImage(invoice.logoUrl || "")

    // --- Helper Functions for PDF ---
    const addPageHeader = () => {
      if (logoData && logoData.img) {
        doc.addImage(
          logoData.img,
          logoData.format,
          pageWidth - margin - logoData.width,
          margin,
          logoData.width,
          logoData.height,
        )
      }

      doc.setFontSize(22)
      doc.setFont("helvetica", "bold")
      doc.text(invoice.title.toUpperCase(), margin, y + 5)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Nº: ${invoice.id}`, margin, y + 12)
      doc.text(`Fecha: ${new Date(invoice.date).toLocaleDateString("es-ES")}`, margin, y + 17)
      if (invoice.dueDate) {
        doc.text(`Vencimiento: ${new Date(invoice.dueDate).toLocaleDateString("es-ES")}`, margin, y + 22)
      }
      y += 30
    }

    const addPageFooter = (pageNumber: number, totalPages: number) => {
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth / 2, pageHeight - margin / 2, { align: "center" })
    }

    const tableHeadersConfig = [
      { title: invoice.tableHeaders.description, width: usableWidth * 0.45 },
      { title: invoice.tableHeaders.hours, width: usableWidth * 0.2 }, // Increased width
      { title: invoice.tableHeaders.rate, width: usableWidth * 0.2 }, // Increased width
      { title: "Total", width: usableWidth * 0.15 }, // Reduced width
    ]

    const drawTableHeader = () => {
      let currentX = margin
      doc.setFillColor(230, 230, 230)
      doc.rect(margin, y, usableWidth, 8, "F")
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0)
      tableHeadersConfig.forEach((header, i) => {
        let align: "left" | "center" | "right" = "left"
        if (i > 0) align = "right"
        doc.text(header.title, currentX + (i > 0 ? header.width - 2 : 2), y + 6, { align })
        currentX += header.width
      })
      y += 10
    }

    // --- PDF Content Generation ---
    addPageHeader()

    // --- Client Info ---
    const fromX = margin
    const toX = pageWidth / 2 + margin / 2
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("De:", fromX, y)
    doc.text("Para:", toX, y)

    doc.setFont("helvetica", "normal")
    const fromDetails = [invoice.from.name, invoice.from.address, invoice.from.email, invoice.from.phone].filter(
      Boolean,
    )
    const toDetails = [invoice.to.name, invoice.to.address, invoice.to.email, invoice.to.phone].filter(Boolean)
    doc.text(fromDetails, fromX, y + 5)
    doc.text(toDetails, toX, y + 5)
    y += Math.max(fromDetails.length, toDetails.length) * 5 + 10

    // --- Items Table ---
    drawTableHeader()

    doc.setFont("helvetica", "normal")
    invoice.items.forEach((item) => {
      const descriptionLines = doc.splitTextToSize(item.description, tableHeadersConfig[0].width - 4)
      const rowHeight = Math.max(descriptionLines.length * 5, 10)

      if (y + rowHeight > pageHeight - margin - 40) {
        // Check if footer will fit
        doc.addPage()
        y = margin
        addPageHeader()
        drawTableHeader()
      }

      const currentX = margin
      doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight)

      doc.text(descriptionLines, currentX + 2, y + 5)
      doc.text(item.hours.toString(), currentX + tableHeadersConfig[0].width + tableHeadersConfig[1].width - 2, y + 5, {
        align: "right",
      })
      doc.text(
        `${currencySymbol} ${Number(item.rate).toFixed(2)}`,
        currentX + tableHeadersConfig[0].width + tableHeadersConfig[1].width + tableHeadersConfig[2].width - 2,
        y + 5,
        { align: "right" },
      )
      doc.text(`${currencySymbol} ${(item.hours * item.rate).toFixed(2)}`, currentX + usableWidth - 2, y + 5, {
        align: "right",
      })
      y += rowHeight
    })

    // --- Totals and Footer ---
    const totals = [
      { label: "Subtotal:", value: calculateSubtotal() },
      invoice.taxRate > 0 && { label: `Impuesto (${invoice.taxRate}%):`, value: calculateTax() },
      invoice.discountRate > 0 && {
        label: `Descuento (${invoice.discountRate}%):`,
        value: -calculateDiscount(),
        color: [200, 0, 0],
      },
      invoice.shippingAmount > 0 && { label: "Envío:", value: invoice.shippingAmount },
    ].filter(Boolean) as { label: string; value: number; color?: number[] }[]

    const totalHeight =
      Math.max(
        (invoice.notes?.split("\n").length || 0) * 4,
        (invoice.terms?.split("\n").length || 0) * 4,
        (totals.length + 3) * 6,
      ) + 20

    if (y + totalHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      addPageHeader()
    } else {
      y = pageHeight - margin - totalHeight
    }

    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    const notesX = margin
    const totalsX = pageWidth / 2
    const totalsValueX = pageWidth - margin

    // Notes and Terms
    doc.setFont("helvetica", "bold")
    if (invoice.notes) {
      doc.text("Notas:", notesX, y)
      doc.setFont("helvetica", "normal")
      doc.text(doc.splitTextToSize(invoice.notes, totalsX - margin - 5), notesX, y + 5)
    }
    if (invoice.terms) {
      const termsY = y + (invoice.notes ? (doc.splitTextToSize(invoice.notes, totalsX - margin - 5).length + 2) * 5 : 0)
      doc.setFont("helvetica", "bold")
      doc.text("Términos:", notesX, termsY)
      doc.setFont("helvetica", "normal")
      doc.text(doc.splitTextToSize(invoice.terms, totalsX - margin - 5), notesX, termsY + 5)
    }

    // Totals calculation
    let totalsY = y
    doc.setFont("helvetica", "normal")
    totals.forEach((total) => {
      if (total.color) doc.setTextColor(total.color[0], total.color[1], total.color[2])
      doc.text(total.label, totalsX, totalsY, { align: "left" })
      doc.text(`${currencySymbol} ${total.value.toFixed(2)}`, totalsValueX, totalsY, { align: "right" })
      doc.setTextColor(0)
      totalsY += 6
    })

    doc.setLineWidth(0.5)
    doc.line(totalsX, totalsY, totalsValueX, totalsY)
    totalsY += 6

    doc.setFont("helvetica", "bold")
    doc.text("Total:", totalsX, totalsY, { align: "left" })
    doc.text(`${currencySymbol} ${calculateTotal().toFixed(2)}`, totalsValueX, totalsY, { align: "right" })

    if (invoice.paidAmount > 0) {
      totalsY += 8
      doc.setFont("helvetica", "normal")
      doc.text("Pagado:", totalsX, totalsY, { align: "left" })
      doc.text(`${currencySymbol} ${invoice.paidAmount.toFixed(2)}`, totalsValueX, totalsY, { align: "right" })
      totalsY += 6
      doc.setFont("helvetica", "bold")
      doc.text("Saldo:", totalsX, totalsY, { align: "left" })
      doc.text(`${currencySymbol} ${calculateBalance().toFixed(2)}`, totalsValueX, totalsY, { align: "right" })
    }

    // --- Page Numbers ---
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addPageFooter(i, totalPages)
    }

    return doc
  }

  const handlePrint = async () => {
    const doc = await generateInvoicePdf()
    const pdfUrl = doc.output("bloburl")
    window.open(pdfUrl, "_blank")
  }

  const handleDownload = async () => {
    const doc = await generateInvoicePdf()
    doc.save(`${invoice.title}_${invoice.id}.pdf`)
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
