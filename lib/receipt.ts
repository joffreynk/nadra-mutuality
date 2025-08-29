// /lib/receipt.ts
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'

/**
 * Types
 */
export type ReceiptMember = {
  id?: string
  memberCode?: string
  name: string
  coveragePercent?: number | null
}

export type ReceiptItem = {
  treatmentName: string
  quantity: number
  unitPrice: number | string // accept Prisma Decimal strings or numbers
}

export type ReceiptOrg = {
  name?: string
  address?: string
  phone?: string
  email?: string
}

export type ReceiptTotals = {
  totalAmount: number
  insurerShare: number
  memberShare: number
}

/**
 * Helpers
 */
function toNumber(n: number | string | null | undefined): number {
  if (n === null || n === undefined) return 0
  if (typeof n === 'number') return n
  const parsed = parseFloat(String(n))
  return Number.isFinite(parsed) ? parsed : 0
}

function money(n: number) {
  // change locale/currency as needed
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

/**
 * Layout constants for A4 portrait
 */
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 40

const Y_START = PAGE_HEIGHT - MARGIN
const HEADER_BAND_HEIGHT = 48
const FOOTER_HEIGHT = 60
const ROW_HEIGHT = 18
const TABLE_TOP_GAP = 12

/**
 * Draw header on a page (organization name + title)
 */
function drawHeader(page: PDFPage, font: PDFFont, fontBold: PDFFont, org: ReceiptOrg, pageNumber?: number) {
  // header band
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_BAND_HEIGHT,
    width: PAGE_WIDTH,
    height: HEADER_BAND_HEIGHT,
    color: rgb(0.08, 0.45, 0.85),
  })

  const leftX = MARGIN
  const rightX = PAGE_WIDTH - MARGIN

  page.drawText(org.name ?? 'Hospital Insurance', {
    x: leftX,
    y: PAGE_HEIGHT - HEADER_BAND_HEIGHT + 14,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  page.drawText('TREATMENT RECEIPT', {
    x: rightX - 160,
    y: PAGE_HEIGHT - HEADER_BAND_HEIGHT + 16,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  if (pageNumber !== undefined) {
    page.drawText(`Page ${pageNumber}`, {
      x: rightX - 60,
      y: MARGIN / 2,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6),
    })
  }
}

/**
 * Draw member and meta information block
 */
function drawMetaBlock(page: PDFPage, font: PDFFont, fontBold: PDFFont, member: ReceiptMember, meta: { receiptDate?: string; treatmentId?: string; createdBy?: string }, yTop: number) {
  const leftX = MARGIN
  const rightX = PAGE_WIDTH / 2 + 10
  let y = yTop

  const kv = (x: number, ky: number, key: string, val: string) => {
    page.drawText(key + ':', { x, y: ky, size: 9, font: fontBold, color: rgb(0.15, 0.15, 0.15) })
    page.drawText(val, { x: x + 110, y: ky, size: 9, font, color: rgb(0.12, 0.12, 0.12) })
  }

  kv(leftX, y, 'Member Name', member.name ?? '—')
  y -= 14
  kv(leftX, y, 'Member Code', member.memberCode ?? '—')
  y -= 14
  kv(leftX, y, 'Coverage', `${member.coveragePercent ?? 0}%`)

  let ry = yTop
  kv(rightX, ry, 'Receipt Date', meta.receiptDate ?? '—')
  ry -= 14
  kv(rightX, ry, 'Treatment ID', meta.treatmentId ?? '—')
  ry -= 14
  kv(rightX, ry, 'Created By', meta.createdBy ?? '—')

  // return new Y (lowest)
  return Math.min(y, ry) - 12
}

/**
 * Draw table header
 */
function drawTableHeader(page: PDFPage, font: PDFFont, fontBold: PDFFont, y: number) {
  const nameX = MARGIN
  const qtyX = PAGE_WIDTH - MARGIN - 200
  const unitX = PAGE_WIDTH - MARGIN - 110
  const amountX = PAGE_WIDTH - MARGIN - 10

  page.drawText('Service / Treatment', { x: nameX, y, size: 9, font: fontBold })
  page.drawText('Qty', { x: qtyX, y, size: 9, font: fontBold })
  page.drawText('Unit Price', { x: unitX, y, size: 9, font: fontBold })
  page.drawText('Amount', { x: amountX - 40, y, size: 9, font: fontBold })
}

/**
 * Draw totals block
 */
function drawTotals(page: PDFPage, font: PDFFont, fontBold: PDFFont, totals: ReceiptTotals, y: number) {
  const boxX = PAGE_WIDTH - MARGIN - 260
  const boxW = 260
  const lineH = 16
  let by = y

  const row = (label: string, value: number) => {
    page.drawText(label, { x: boxX + 10, y: by, size: 10, font: fontBold })
    page.drawText(money(value), { x: boxX + boxW - 110, y: by, size: 10, font })
    by -= lineH
  }

  row('Subtotal', totals.totalAmount)
  row('Insurer Share', totals.insurerShare)
  row('Member Share', totals.memberShare)

  return by - 8
}

/**
 * PUBLIC: generateTreatmentReceiptPDF
 * Returns Uint8Array of PDF bytes
 */
export async function generateTreatmentReceiptPDF(params: {
  organization?: ReceiptOrg
  member: ReceiptMember
  items: ReceiptItem[]
  totals: ReceiptTotals
  createdAt?: Date
  createdBy?: string
  treatmentId?: string
}): Promise<Uint8Array> {
  const { organization = {}, member, items, totals, createdAt = new Date(), createdBy, treatmentId } = params

  // create doc and fonts
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // pagination helpers
  function newPage(pageNumber?: number) {
    const p = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    drawHeader(p, font, fontBold, organization, pageNumber)
    return p
  }

  let page = newPage(1)
  let pageNumber = 1

  // Start y after header
  let y = PAGE_HEIGHT - HEADER_BAND_HEIGHT - 20

  // Meta block
  y = drawMetaBlock(page, font, fontBold, member, { receiptDate: createdAt.toISOString().slice(0, 10), treatmentId, createdBy }, y)

  // table header
  drawTableHeader(page, font, fontBold, y)
  y -= ROW_HEIGHT

  // Table columns
  const nameX = MARGIN
  const qtyX = PAGE_WIDTH - MARGIN - 200
  const unitX = PAGE_WIDTH - MARGIN - 110
  const amountX = PAGE_WIDTH - MARGIN - 10

  // bottom usable y
  const bottomY = MARGIN + FOOTER_HEIGHT

  for (const it of items) {
    // ensure numeric values
    const qty = Math.max(1, Math.floor(toNumber(it.quantity)))
    const unit = toNumber(it.unitPrice)
    const amount = Math.round((qty * unit) * 100) / 100

    // if not enough space, create a new page
    if (y < bottomY) {
      pageNumber += 1
      page = newPage(pageNumber)
      // reset y under header
      y = PAGE_HEIGHT - HEADER_BAND_HEIGHT - 28
      // redraw table header on new page
      drawTableHeader(page, font, fontBold, y)
      y -= ROW_HEIGHT
    }

    // Draw the row
    const name = it.treatmentName || ''
    // wrap long names naively: if too long, truncate — for a robust wrap you can measure text and break lines
    const truncated = name.length > 80 ? name.slice(0, 77) + '...' : name

    page.drawText(truncated, { x: nameX, y, size: 9, font })
    page.drawText(String(qty), { x: qtyX, y, size: 9, font })
    page.drawText(money(unit), { x: unitX, y, size: 9, font })
    page.drawText(money(amount), { x: amountX - 40, y, size: 9, font })

    y -= ROW_HEIGHT
  }

  // leave a little gap then draw totals
  y -= 8
  drawTotals(page, font, fontBold, totals, y)

  // footer note (on last page)
  const footerText = 'Thank you. Keep this receipt for your records.'
  pdfDoc.getPages().at(-1)?.drawText(footerText, {
    x: MARGIN,
    y: MARGIN + 10,
    size: 9,
    font,
    color: rgb(0.45, 0.45, 0.45),
  })

  const bytes = await pdfDoc.save()
  return bytes
}
