"use client"

import type { Invoice, InvoiceItem } from "@/types/invoice"
import { Card, CardContent } from "@/components/ui/card"
import { Download, PrinterIcon as Print } from "lucide-react"
import { useRef } from "react"

interface InvoicePreviewProps {
  invoice: Invoice
  activeTab: "edit" | "preview"
  setActiveTab: (tab: "edit" | "preview") => void
}

export function InvoicePreview({ invoice, activeTab, setActiveTab }: InvoicePreviewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

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

  const handlePrint = () => {
    // Crear una nueva ventana para imprimir con el mismo formato que el PDF
    const printWindow = window.open("", "_blank", "width=794,height=1123")
    if (!printWindow) {
      alert("Por favor, permite las ventanas emergentes para imprimir")
      return
    }

    // Usar el mismo HTML que se genera para el PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${invoice.title} ${invoice.id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 1.5cm;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          background: white;
          width: 21cm;
          min-height: 29.7cm;
          margin: 0 auto;
          padding: 1.5cm;
          position: relative;
        }
        
        .page-container {
          min-height: calc(29.7cm - 3cm);
          display: flex;
          flex-direction: column;
        }
        
        .content {
          flex: 1;
        }
        
        .footer {
          margin-top: auto;
          padding-top: 1.5cm;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        
        .header h1 {
          font-size: 1.875rem;
          font-weight: bold;
          color: #111827;
          margin-bottom: 0.5rem;
        }
        
        .invoice-info {
          color: #6b7280;
        }
        
        .invoice-info p {
          margin-bottom: 0.25rem;
        }
        
        .invoice-number {
          font-size: 1.125rem !important;
          font-weight: bold;
          color: #111827 !important;
        }
        
        .logo-container {
          width: 8rem;
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .logo-container img {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain;
        }
        
        .contacts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .contact h3 {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }
        
        .contact p {
          margin-bottom: 0.25rem;
          color: #374151;
        }
        
        .contact .company-name {
          font-weight: 500;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2rem;
        }
        
        .items-table thead tr {
          background: #1e293b;
          color: white;
        }
        
        .items-table th {
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
        }
        
        .items-table th:first-child {
          border-top-left-radius: 0.375rem;
          border-bottom-left-radius: 0.375rem;
        }
        
        .items-table th:last-child {
          border-top-right-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          text-align: right;
        }
        
        .items-table th:nth-child(2),
        .items-table th:nth-child(3) {
          text-align: center;
        }
        
        .items-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #eee;
        }
        
        .items-table td:nth-child(2),
        .items-table td:nth-child(3) {
          text-align: center;
        }
        
        .items-table td:last-child {
          text-align: right;
          font-weight: 500;
        }
        
        .empty-row {
          text-align: center;
          color: #9ca3af;
          font-style: italic;
          padding: 2rem !important;
        }
        
        .footer-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
        }
        
        .notes-section h4 {
          font-weight: 500;
          color: #111827;
          margin-bottom: 0.5rem;
        }
        
        .notes-section p {
          color: #374151;
          white-space: pre-line;
          font-size: 11px;
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        
        .totals-section {
          text-align: right;
        }
        
        .totals-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .totals-table td {
          padding: 0.25rem 0;
        }
        
        .totals-table .label {
          text-align: right;
          padding-right: 1rem;
          color: #6b7280;
        }
        
        .totals-table .amount {
          text-align: right;
          font-weight: 500;
          color: #111827;
          width: 6rem;
        }
        
        .totals-table .total-row {
          border-top: 1px solid #111827;
          font-size: 1.125rem;
          font-weight: bold;
        }
        
        .totals-table .total-row td {
          padding-top: 0.5rem;
          color: #111827;
        }
        
        .discount-row {
          color: #059669 !important;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .page-container {
            page-break-inside: avoid;
          }
          
          .footer {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <div class="content">
          <!-- Header -->
          <div class="header">
            <div>
              <h1>${invoice.title}</h1>
              <div class="invoice-info">
                <p class="invoice-number">#${invoice.id}</p>
                <p>Fecha: ${invoice.date ? new Date(invoice.date).toLocaleDateString("es-ES") : "No especificada"}</p>
                ${invoice.dueDate ? `<p>Vencimiento: ${new Date(invoice.dueDate).toLocaleDateString("es-ES")}</p>` : ""}
              </div>
            </div>
            <div>
              ${
                invoice.logoUrl
                  ? `
                <div class="logo-container">
                  <img src="${invoice.logoUrl}" alt="Logo de la empresa" />
                </div>
              `
                  : ""
              }
            </div>
          </div>

          <!-- Contacts -->
          <div class="contacts">
            <div class="contact">
              <h3>De:</h3>
              <div>
                ${invoice.from.name ? `<p class="company-name">${invoice.from.name}</p>` : ""}
                ${invoice.from.address ? `<p>${invoice.from.address.replace(/\n/g, "<br>")}</p>` : ""}
                ${invoice.from.email ? `<p>${invoice.from.email}</p>` : ""}
                ${invoice.from.phone ? `<p>${invoice.from.phone}</p>` : ""}
              </div>
            </div>
            <div class="contact">
              <h3>Para:</h3>
              <div>
                ${invoice.to.name ? `<p class="company-name">${invoice.to.name}</p>` : ""}
                ${invoice.to.address ? `<p>${invoice.to.address.replace(/\n/g, "<br>")}</p>` : ""}
                ${invoice.to.email ? `<p>${invoice.to.email}</p>` : ""}
                ${invoice.to.phone ? `<p>${invoice.to.phone}</p>` : ""}
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>${invoice.tableHeaders.description}</th>
                <th>${invoice.tableHeaders.hours}</th>
                <th>${invoice.tableHeaders.rate}</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .filter((item) => item.description.trim() !== "")
                .map(
                  (item) => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.hours}</td>
                    <td>${currencySymbol} ${(Number(item.rate) || 0).toFixed(2)}</td>
                    <td>${currencySymbol} ${((Number(item.hours) || 0) * (Number(item.rate) || 0)).toFixed(2)}</td>
                  </tr>
                `,
                )
                .join("")}
              ${
                invoice.items.filter((item) => item.description.trim() !== "").length === 0
                  ? '<tr><td colspan="4" class="empty-row">No hay artículos añadidos</td></tr>'
                  : ""
              }
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-content">
            <!-- Notes and Terms -->
            <div class="notes-section">
              ${
                invoice.notes?.trim()
                  ? `
                <div>
                  <h4>Notas:</h4>
                  <p>${invoice.notes}</p>
                </div>`
                  : ""
              }
              ${
                invoice.terms?.trim()
                  ? `
                <div>
                  <h4>Términos y Condiciones:</h4>
                  <p>${invoice.terms}</p>
                </div>`
                  : ""
              }
            </div>

            <!-- Totals -->
            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td class="label">Subtotal:</td>
                  <td class="amount">${currencySymbol} ${calculateSubtotal().toFixed(2)}</td>
                </tr>
                ${
                  invoice.taxRate > 0
                    ? `
                  <tr>
                    <td class="label">Impuesto (${invoice.taxRate}%):</td>
                    <td class="amount">${currencySymbol} ${calculateTax().toFixed(2)}</td>
                  </tr>`
                    : ""
                }
                ${
                  invoice.discountRate > 0
                    ? `
                    <tr class="discount-row">
                      <td class="label">Descuento (${invoice.discountRate}%):</td>
                      <td class="amount">-${currencySymbol} ${calculateDiscount().toFixed(2)}</td>
                    </tr>`
                    : ""
                }
                ${
                  invoice.shippingAmount > 0
                    ? `
                    <tr>
                      <td class="label">Envío:</td>
                      <td class="amount">${currencySymbol} ${invoice.shippingAmount.toFixed(2)}</td>
                  </tr>`
                    : ""
                }
                <tr class="total-row">
                  <td class="label">Total:</td>
                  <td class="amount">${currencySymbol} ${calculateTotal().toFixed(2)}</td>
                </tr>
                ${
                  invoice.paidAmount > 0
                    ? `
                    <tr>
                      <td class="label">Cantidad Pagada:</td>
                      <td class="amount">${currencySymbol} ${invoice.paidAmount.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                      <td class="label">Saldo Adeudado:</td>
                      <td class="amount">${currencySymbol} ${calculateBalance().toFixed(2)}</td>
                    </tr>`
                    : ""
                }
              </table>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

    // Escribir el contenido en la nueva ventana
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Esperar a que se cargue el contenido y luego imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        // Cerrar la ventana después de imprimir
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }, 500)
    }
  }

  const handleDownload = () => {
    // Crear una nueva ventana para el PDF
    const printWindow = window.open("", "_blank", "width=794,height=1123")
    if (!printWindow) {
      alert("Por favor, permite las ventanas emergentes para descargar el PDF")
      return
    }

    // Generar el HTML completo para el PDF con formato A4
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${invoice.title} ${invoice.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
            width: 21cm;
            min-height: 29.7cm;
            margin: 0 auto;
            padding: 1.5cm;
            position: relative;
          }
          
          .page-container {
            min-height: calc(29.7cm - 3cm);
            display: flex;
            flex-direction: column;
          }
          
          .content {
            flex: 1;
          }
          
          .footer {
            margin-top: auto;
            padding-top: 1.5cm;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
          }
          
          .header h1 {
            font-size: 1.875rem;
            font-weight: bold;
            color: #111827;
            margin-bottom: 0.5rem;
          }
          
          .invoice-info {
            color: #6b7280;
          }
          
          .invoice-info p {
            margin-bottom: 0.25rem;
          }
          
          .invoice-number {
            font-size: 1.125rem !important;
            font-weight: bold;
            color: #111827 !important;
          }
          
          .logo-container {
            width: 8rem;
            height: 4rem;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .logo-container img {
            max-height: 100%;
            max-width: 100%;
            object-fit: contain;
          }
          
          .contacts {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
          }
          
          .contact h3 {
            font-weight: 600;
            color: #111827;
            margin-bottom: 0.5rem;
          }
          
          .contact p {
            margin-bottom: 0.25rem;
            color: #374151;
          }
          
          .contact .company-name {
            font-weight: 500;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
          }
          
          .items-table thead tr {
            background: #1e293b;
            color: white;
          }
          
          .items-table th {
            padding: 0.75rem;
            text-align: left;
            font-weight: 600;
          }
          
          .items-table th:first-child {
            border-top-left-radius: 0.375rem;
            border-bottom-left-radius: 0.375rem;
          }
          
          .items-table th:last-child {
            border-top-right-radius: 0.375rem;
            border-bottom-right-radius: 0.375rem;
            text-align: right;
          }
          
          .items-table th:nth-child(2),
          .items-table th:nth-child(3) {
            text-align: center;
          }
          
          .items-table td {
            padding: 0.75rem;
            border-bottom: 1px solid #eee;
          }
          
          .items-table td:nth-child(2),
          .items-table td:nth-child(3) {
            text-align: center;
          }
          
          .items-table td:last-child {
            text-align: right;
            font-weight: 500;
          }
          
          .empty-row {
            text-align: center;
            color: #9ca3af;
            font-style: italic;
            padding: 2rem !important;
          }
          
          .footer-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            border-top: 1px solid #e5e7eb;
            padding-top: 1rem;
          }
          
          .notes-section h4 {
            font-weight: 500;
            color: #111827;
            margin-bottom: 0.5rem;
          }
          
          .notes-section p {
            color: #374151;
            white-space: pre-line;
            font-size: 11px;
            line-height: 1.5;
            margin-bottom: 1rem;
          }
          
          .totals-section {
            text-align: right;
          }
          
          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .totals-table td {
            padding: 0.25rem 0;
          }
          
          .totals-table .label {
            text-align: right;
            padding-right: 1rem;
            color: #6b7280;
          }
          
          .totals-table .amount {
            text-align: right;
            font-weight: 500;
            color: #111827;
            width: 6rem;
          }
          
          .totals-table .total-row {
            border-top: 1px solid #111827;
            font-size: 1.125rem;
            font-weight: bold;
          }
          
          .totals-table .total-row td {
            padding-top: 0.5rem;
            color: #111827;
          }
          
          .discount-row {
            color: #059669 !important;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .page-container {
              page-break-inside: avoid;
            }
            
            .footer {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="content">
            <!-- Header -->
            <div class="header">
              <div>
                <h1>${invoice.title}</h1>
                <div class="invoice-info">
                  <p class="invoice-number">#${invoice.id}</p>
                  <p>Fecha: ${invoice.date ? new Date(invoice.date).toLocaleDateString("es-ES") : "No especificada"}</p>
                  ${invoice.dueDate ? `<p>Vencimiento: ${new Date(invoice.dueDate).toLocaleDateString("es-ES")}</p>` : ""}
                </div>
              </div>
              <div>
                ${
                  invoice.logoUrl
                    ? `
                  <div class="logo-container">
                    <img src="${invoice.logoUrl}" alt="Logo de la empresa" />
                  </div>
                `
                    : ""
                }
              </div>
            </div>

            <!-- Contacts -->
            <div class="contacts">
              <div class="contact">
                <h3>De:</h3>
                <div>
                  ${invoice.from.name ? `<p class="company-name">${invoice.from.name}</p>` : ""}
                  ${invoice.from.address ? `<p>${invoice.from.address.replace(/\n/g, "<br>")}</p>` : ""}
                  ${invoice.from.email ? `<p>${invoice.from.email}</p>` : ""}
                  ${invoice.from.phone ? `<p>${invoice.from.phone}</p>` : ""}
                </div>
              </div>
              <div class="contact">
                <h3>Para:</h3>
                <div>
                  ${invoice.to.name ? `<p class="company-name">${invoice.to.name}</p>` : ""}
                  ${invoice.to.address ? `<p>${invoice.to.address.replace(/\n/g, "<br>")}</p>` : ""}
                  ${invoice.to.email ? `<p>${invoice.to.email}</p>` : ""}
                  ${invoice.to.phone ? `<p>${invoice.to.phone}</p>` : ""}
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>${invoice.tableHeaders.description}</th>
                  <th>${invoice.tableHeaders.hours}</th>
                  <th>${invoice.tableHeaders.rate}</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items
                  .filter((item) => item.description.trim() !== "")
                  .map(
                    (item) => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.hours}</td>
                      <td>${currencySymbol} ${(Number(item.rate) || 0).toFixed(2)}</td>
                      <td>${currencySymbol} ${((Number(item.hours) || 0) * (Number(item.rate) || 0)).toFixed(2)}</td>
                    </tr>
                  `,
                  )
                  .join("")}
              ${
                invoice.items.filter((item) => item.description.trim() !== "").length === 0
                  ? '<tr><td colspan="4" class="empty-row">No hay artículos añadidos</td></tr>'
                  : ""
              }
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-content">
            <!-- Notes and Terms -->
            <div class="notes-section">
              ${
                invoice.notes?.trim()
                  ? `
                <div>
                  <h4>Notas:</h4>
                  <p>${invoice.notes}</p>
                </div>`
                  : ""
              }
              ${
                invoice.terms?.trim()
                  ? `
                <div>
                  <h4>Términos y Condiciones:</h4>
                  <p>${invoice.terms}</p>
                </div>`
                  : ""
              }
            </div>

            <!-- Totals -->
            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td class="label">Subtotal:</td>
                  <td class="amount">${currencySymbol} ${calculateSubtotal().toFixed(2)}</td>
                </tr>
                ${
                  invoice.taxRate > 0
                    ? `
                    <tr>
                      <td class="label">Impuesto (${invoice.taxRate}%):</td>
                      <td class="amount">${currencySymbol} ${calculateTax().toFixed(2)}</td>
                    </tr>`
                    : ""
                }
                ${
                  invoice.discountRate > 0
                    ? `
                    <tr class="discount-row">
                      <td class="label">Descuento (${invoice.discountRate}%):</td>
                      <td class="amount">-${currencySymbol} ${calculateDiscount().toFixed(2)}</td>
                    </tr>`
                    : ""
                }
                ${
                  invoice.shippingAmount > 0
                    ? `
                    <tr>
                      <td class="label">Envío:</td>
                      <td class="amount">${currencySymbol} ${invoice.shippingAmount.toFixed(2)}</td>
                  </tr>`
                    : ""
                }
                <tr class="total-row">
                  <td class="label">Total:</td>
                  <td class="amount">${currencySymbol} ${calculateTotal().toFixed(2)}</td>
                </tr>
                ${
                  invoice.paidAmount > 0
                    ? `
                    <tr>
                      <td class="label">Cantidad Pagada:</td>
                      <td class="amount">${currencySymbol} ${invoice.paidAmount.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                      <td class="label">Saldo Adeudado:</td>
                      <td class="amount">${currencySymbol} ${calculateBalance().toFixed(2)}</td>
                    </tr>`
                    : ""
                }
              </table>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `

    // Escribir el contenido en la nueva ventana
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Esperar a que se cargue el contenido y luego imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        // Cerrar la ventana después de un breve retraso
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 500)
    }
  }

  const chunk = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size))

  const isFromFilled = invoice.from.name || invoice.from.address || invoice.from.email || invoice.from.phone
  const isToFilled = invoice.to.name || invoice.to.address || invoice.to.email || invoice.to.phone

  // --- Lógica de Paginación ---
  const ITEMS_PER_PAGE_FIRST = 15 // Ajusta este valor según el diseño
  const ITEMS_PER_PAGE_SUBSEQUENT = 25 // Más espacio en páginas siguientes sin cabecera

  const items = invoice.items.filter((item) => item.description.trim() !== "")
  let pages: InvoiceItem[][] = []

  if (items.length <= ITEMS_PER_PAGE_FIRST) {
    pages.push(items)
  } else {
    const firstPageItems = items.slice(0, ITEMS_PER_PAGE_FIRST)
    pages.push(firstPageItems)

    const remainingItems = items.slice(ITEMS_PER_PAGE_FIRST)
    const remainingPages = chunk(remainingItems, ITEMS_PER_PAGE_SUBSEQUENT)
    pages = pages.concat(remainingPages)
  }
  // --- Fin de la Lógica de Paginación ---

  // Agregar estilos de animación
  const styles = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }
    
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
  `

  // Insertar estilos en el head si no existen
  if (typeof document !== "undefined" && !document.getElementById("liquid-glass-styles")) {
    const styleSheet = document.createElement("style")
    styleSheet.id = "liquid-glass-styles"
    styleSheet.textContent = styles
    document.head.appendChild(styleSheet)
  }

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

          <div className="relative z-10 flex justify-between items-center print:hidden">
            <div className="flex space-x-3">
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

      {/* Document Container with Liquid Glass Effect */}
      <div className="relative">
        {/* Floating glass container */}
        <div className="relative overflow-hidden">
          <div className="relative z-10 print:shadow-none print:border-none border-transparent shadow-none rounded-none bg-transparent space-y-8">
            {pages.map((pageItems, pageIndex) => (
              <div
                key={pageIndex}
                className="transform transition-all duration-700 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20"
                style={{
                  animationDelay: `${pageIndex * 100}ms`,
                  animation: "fadeInUp 0.8s ease-out forwards",
                }}
              >
                <Card className="print:shadow-none print:border-none border-none rounded-3xl shadow-none bg-transparent overflow-hidden">
                  <CardContent
                    className="p-0 bg-white shadow-2xl shadow-black/20 mx-auto relative rounded-2xl"
                    style={{
                      width: "210mm",
                      minHeight: "297mm",
                      maxWidth: "100%",
                      aspectRatio: "210/297",
                    }}
                  >
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30 pointer-events-none" />

                    <div className="relative z-10 p-[1.5cm] h-full flex flex-col">
                      <div className="flex-1">
                        {/* Header (solo en la primera página) */}
                        {pageIndex === 0 && (
                          <>
                            <div className="flex justify-between items-start mb-8">
                              <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{invoice.title}</h1>
                                <div className="text-gray-600">
                                  {invoice.id && <p className="text-lg">#{invoice.id}</p>}
                                  <p>
                                    Fecha:{" "}
                                    {invoice.date
                                      ? new Date(invoice.date).toLocaleDateString("es-ES")
                                      : "No especificada"}
                                  </p>
                                  {invoice.dueDate && (
                                    <p>Vencimiento: {new Date(invoice.dueDate).toLocaleDateString("es-ES")}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                {invoice.logoUrl ? (
                                  <img
                                    src={invoice.logoUrl || "/placeholder.svg"}
                                    alt="Logo de la empresa"
                                    className="max-h-16 max-w-32 object-contain"
                                  />
                                ) : null}
                              </div>
                            </div>

                            {/* From/To (solo en la primera página) */}
                            {(isFromFilled || isToFilled) && (
                              <div className="grid grid-cols-2 gap-8 mb-8">
                                {isFromFilled && (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">De:</h3>
                                    <div className="text-gray-700 text-sm">
                                      {invoice.from.name && <p className="font-medium">{invoice.from.name}</p>}
                                      {invoice.from.address && (
                                        <p className="whitespace-pre-line">{invoice.from.address}</p>
                                      )}
                                      {invoice.from.email && <p>{invoice.from.email}</p>}
                                      {invoice.from.phone && <p>{invoice.from.phone}</p>}
                                    </div>
                                  </div>
                                )}
                                {isToFilled && (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Para:</h3>
                                    <div className="text-gray-700 text-sm">
                                      {invoice.to.name && <p className="font-medium">{invoice.to.name}</p>}
                                      {invoice.to.address && (
                                        <p className="whitespace-pre-line">{invoice.to.address}</p>
                                      )}
                                      {invoice.to.email && <p>{invoice.to.email}</p>}
                                      {invoice.to.phone && <p>{invoice.to.phone}</p>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* Items Table */}
                        <div className="mb-8">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-800 text-white">
                                <th className="text-left p-3 rounded-l-md w-1/2">{invoice.tableHeaders.description}</th>
                                <th className="text-center p-3">{invoice.tableHeaders.hours}</th>
                                <th className="text-center p-3">{invoice.tableHeaders.rate}</th>
                                <th className="text-right p-3 rounded-r-md">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageItems.map((item) => (
                                <tr key={item.id} className="border-b">
                                  <td className="p-3">{item.description}</td>
                                  <td className="p-3 text-center">{item.hours}</td>
                                  <td className="p-3 text-center">
                                    {currencySymbol} {(Number(item.rate) || 0).toFixed(2)}
                                  </td>
                                  <td className="p-3 text-right font-medium">
                                    {currencySymbol} {((Number(item.hours) || 0) * (Number(item.rate) || 0)).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              {items.length === 0 && pageIndex === 0 && (
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

                      {/* Footer (solo en la última página) */}
                      {pageIndex === pages.length - 1 && ( // Apply padding to the footer div itself
                        <div className="mt-auto border-t border-gray-200 pt-6 pb-[1.5cm]">
                          <div className="grid grid-cols-2 gap-8">
                            {/* Notes and Terms */}
                            <div className="space-y-6 text-sm">
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
                            <div className="text-right text-sm">
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
                                <div className="flex justify-between text-lg font-semibold">
                                  <span>Total:</span>
                                  <span>
                                    {currencySymbol} {calculateTotal().toFixed(2)}
                                  </span>
                                </div>
                                {invoice.paidAmount > 0 && (
                                  <>
                                    <div className="flex justify-between">
                                      <span>Cantidad Pagada:</span>
                                      <span className="font-medium">
                                        {currencySymbol} {invoice.paidAmount.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-semibold">
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
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
