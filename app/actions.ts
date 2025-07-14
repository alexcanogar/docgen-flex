"use server"

import { jsPDF } from "jspdf"
import type { Invoice } from "@/types/invoice"

// This function is now part of the server action
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

export async function generateInvoicePdfAction(invoice: Invoice): Promise<string> {
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
  const fromDetails = [invoice.from.name, invoice.from.address, invoice.from.email, invoice.from.phone].filter(Boolean)
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
      `${invoice.currency === "EUR" ? "€" : "$"} ${Number(item.rate).toFixed(2)}`,
      currentX + tableHeadersConfig[0].width + tableHeadersConfig[1].width + tableHeadersConfig[2].width - 2,
      y + 5,
      { align: "right" },
    )
    doc.text(
      `${invoice.currency === "EUR" ? "€" : "$"} ${(item.hours * item.rate).toFixed(2)}`,
      currentX + usableWidth - 2,
      y + 5,
      {
        align: "right",
      },
    )
    y += rowHeight
  })

  // --- Totals and Footer ---
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

  return doc.output("datauristring")
}
