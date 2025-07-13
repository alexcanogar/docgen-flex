export interface InvoiceItem {
  id: string
  description: string
  hours: number
  rate: number
}

export interface Contact {
  name: string
  company: string
  address: string
  email: string
  phone: string
}

export interface TableHeaders {
  description: string
  hours: string
  rate: string
}

export interface Invoice {
  id: string
  title: string
  date: string
  dueDate: string
  purchaseOrder: string
  paymentTerms: string
  currency: "EUR" | "USD"
  from: Contact
  to: Contact
  items: InvoiceItem[]
  tableHeaders: TableHeaders
  notes: string
  terms: string
  taxRate: number
  discountRate: number
  shippingAmount: number
  paidAmount: number
  logoUrl?: string
}
