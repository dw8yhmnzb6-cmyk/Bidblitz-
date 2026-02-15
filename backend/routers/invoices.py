"""Invoice router - PDF invoice generation"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional
import uuid
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def generate_invoice_pdf(invoice_data: dict) -> io.BytesIO:
    """Generate a PDF invoice"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='InvoiceTitle',
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1a5f7a')
    ))
    styles.add(ParagraphStyle(
        name='CompanyName',
        fontSize=18,
        spaceAfter=5,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#FFD700')
    ))
    styles.add(ParagraphStyle(
        name='SectionHeader',
        fontSize=12,
        spaceAfter=10,
        spaceBefore=20,
        textColor=colors.HexColor('#333333'),
        fontName='Helvetica-Bold'
    ))
    
    elements = []
    
    # Header
    elements.append(Paragraph("⚡ BidBlitz", styles['CompanyName']))
    elements.append(Paragraph("Penny Auction Platform", styles['Normal']))
    elements.append(Spacer(1, 10*mm))
    
    # Invoice Title
    elements.append(Paragraph(f"RECHNUNG", styles['InvoiceTitle']))
    
    # Invoice Info
    invoice_info = [
        ["Rechnungsnummer:", invoice_data.get('invoice_number', 'N/A')],
        ["Datum:", invoice_data.get('date', datetime.now().strftime('%d.%m.%Y'))],
        ["Zahlungsmethode:", invoice_data.get('payment_method', 'N/A')],
        ["Status:", invoice_data.get('status', 'Bezahlt')]
    ]
    
    info_table = Table(invoice_info, colWidths=[50*mm, 80*mm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 10*mm))
    
    # Customer Info
    elements.append(Paragraph("Rechnungsadresse", styles['SectionHeader']))
    customer_info = f"""
    {invoice_data.get('customer_name', 'Kunde')}<br/>
    {invoice_data.get('customer_email', '')}<br/>
    """
    elements.append(Paragraph(customer_info, styles['Normal']))
    elements.append(Spacer(1, 10*mm))
    
    # Items Table
    elements.append(Paragraph("Positionen", styles['SectionHeader']))
    
    items_data = [["Beschreibung", "Menge", "Einzelpreis", "Gesamt"]]
    for item in invoice_data.get('items', []):
        items_data.append([
            item.get('description', ''),
            str(item.get('quantity', 1)),
            f"€{item.get('unit_price', 0):.2f}",
            f"€{item.get('total', 0):.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[80*mm, 25*mm, 30*mm, 30*mm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5f7a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 5*mm))
    
    # Totals
    subtotal = invoice_data.get('subtotal', 0)
    tax = invoice_data.get('tax', 0)
    total = invoice_data.get('total', 0)
    
    totals_data = [
        ["", "", "Zwischensumme:", f"€{subtotal:.2f}"],
        ["", "", "MwSt. (19%):", f"€{tax:.2f}"],
        ["", "", "Gesamtbetrag:", f"€{total:.2f}"]
    ]
    
    totals_table = Table(totals_data, colWidths=[80*mm, 25*mm, 30*mm, 30*mm])
    totals_table.setStyle(TableStyle([
        ('FONTNAME', (2, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('LINEABOVE', (2, -1), (-1, -1), 1, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 15*mm))
    
    # Footer
    footer_text = """
    Vielen Dank für Ihren Einkauf bei BidBlitz!<br/><br/>
    Bei Fragen wenden Sie sich bitte an: support@bidblitz.ae<br/>
    BidBlitz GmbH • Musterstraße 123 • 12345 Musterstadt<br/>
    USt-IdNr.: DE123456789
    """
    elements.append(Paragraph(footer_text, styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


@router.get("/{transaction_id}")
async def get_invoice(transaction_id: str, user: dict = Depends(get_current_user)):
    """Get invoice for a transaction"""
    # Find the transaction
    transaction = await db.payment_transactions.find_one({
        "id": transaction_id,
        "user_id": user["id"],
        "status": "paid"
    }, {"_id": 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaktion nicht gefunden")
    
    # Generate invoice number
    invoice_number = f"INV-{transaction_id[:8].upper()}"
    
    # Prepare invoice data
    invoice_data = {
        "invoice_number": invoice_number,
        "date": transaction.get("created_at", "")[:10] if transaction.get("created_at") else datetime.now().strftime('%Y-%m-%d'),
        "payment_method": transaction.get("payment_method", "Kreditkarte").title(),
        "status": "Bezahlt",
        "customer_name": user.get("name", "Kunde"),
        "customer_email": user.get("email", ""),
        "items": [
            {
                "description": f"Gebotspaket - {transaction.get('bids', 0)} Gebote",
                "quantity": 1,
                "unit_price": transaction.get("amount", 0),
                "total": transaction.get("amount", 0)
            }
        ],
        "subtotal": round(transaction.get("amount", 0) / 1.19, 2),
        "tax": round(transaction.get("amount", 0) - (transaction.get("amount", 0) / 1.19), 2),
        "total": transaction.get("amount", 0)
    }
    
    # Generate PDF
    pdf_buffer = generate_invoice_pdf(invoice_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=rechnung_{invoice_number}.pdf"
        }
    )


@router.get("/{transaction_id}/data")
async def get_invoice_data(transaction_id: str, user: dict = Depends(get_current_user)):
    """Get invoice data without PDF"""
    transaction = await db.payment_transactions.find_one({
        "id": transaction_id,
        "user_id": user["id"],
        "status": "paid"
    }, {"_id": 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaktion nicht gefunden")
    
    return {
        "invoice_number": f"INV-{transaction_id[:8].upper()}",
        "date": transaction.get("created_at", "")[:10],
        "amount": transaction.get("amount", 0),
        "bids": transaction.get("bids", 0),
        "payment_method": transaction.get("payment_method", ""),
        "status": "paid"
    }


@router.post("/auction-win/{auction_id}")
async def generate_win_invoice(auction_id: str, user: dict = Depends(get_current_user)):
    """Generate invoice for auction win"""
    auction = await db.auctions.find_one({
        "id": auction_id,
        "winner_id": user["id"]
    }, {"_id": 0})
    
    if not auction:
        raise HTTPException(status_code=404, detail="Gewonnene Auktion nicht gefunden")
    
    # Get product
    product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0})
    
    invoice_number = f"WIN-{auction_id[:8].upper()}"
    final_price = auction.get("final_price") or auction.get("current_price", 0)
    
    invoice_data = {
        "invoice_number": invoice_number,
        "date": auction.get("ended_at", "")[:10] if auction.get("ended_at") else datetime.now().strftime('%Y-%m-%d'),
        "payment_method": "Auktionsgewinn",
        "status": "Zu bezahlen",
        "customer_name": user.get("name", "Kunde"),
        "customer_email": user.get("email", ""),
        "items": [
            {
                "description": product.get("name", "Produkt") if product else "Auktionsgewinn",
                "quantity": 1,
                "unit_price": final_price,
                "total": final_price
            },
            {
                "description": "Versandkosten",
                "quantity": 1,
                "unit_price": 4.99,
                "total": 4.99
            }
        ],
        "subtotal": round((final_price + 4.99) / 1.19, 2),
        "tax": round((final_price + 4.99) - ((final_price + 4.99) / 1.19), 2),
        "total": round(final_price + 4.99, 2)
    }
    
    pdf_buffer = generate_invoice_pdf(invoice_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=rechnung_{invoice_number}.pdf"
        }
    )


@router.get("/user/all")
async def get_user_invoices(user: dict = Depends(get_current_user)):
    """Get all invoices for current user"""
    # Get all paid transactions
    transactions = await db.payment_transactions.find({
        "user_id": user["id"],
        "status": "paid"
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    invoices = []
    for t in transactions:
        invoices.append({
            "id": t["id"],
            "invoice_number": f"INV-{t['id'][:8].upper()}",
            "type": "bid_purchase",
            "date": t.get("created_at", "")[:10],
            "amount": t.get("amount", 0),
            "description": f"{t.get('bids', 0)} Gebote"
        })
    
    # Get won auctions
    won_auctions = user.get("won_auctions", [])
    for auction_id in won_auctions:
        auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
        if auction:
            product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0})
            invoices.append({
                "id": auction_id,
                "invoice_number": f"WIN-{auction_id[:8].upper()}",
                "type": "auction_win",
                "date": auction.get("ended_at", "")[:10] if auction.get("ended_at") else "",
                "amount": (auction.get("final_price") or auction.get("current_price", 0)) + 4.99,
                "description": product.get("name", "Auktionsgewinn") if product else "Auktionsgewinn"
            })
    
    # Sort by date
    invoices.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    return {"invoices": invoices}


@router.get("/auction-win/{auction_id}")
async def download_auction_win_invoice(auction_id: str, user: dict = Depends(get_current_user)):
    """Download PDF invoice for a won auction"""
    # Get payment record
    payment = await db.auction_payments.find_one({
        "auction_id": auction_id,
        "user_id": user["id"],
        "status": "paid"
    }, {"_id": 0})
    
    if not payment:
        # Try to get from auction directly
        auction = await db.auctions.find_one({
            "id": auction_id,
            "winner_id": user["id"],
            "payment_status": "paid"
        }, {"_id": 0})
        
        if not auction:
            raise HTTPException(status_code=404, detail="Keine bezahlte Rechnung gefunden")
        
        # Get product
        product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0})
        
        final_price = auction.get("final_price") or auction.get("current_price", 0)
        payment = {
            "product_name": product.get("name") if product else "Auktionsgewinn",
            "final_price": final_price,
            "shipping_cost": 4.99,
            "total_amount": final_price + 4.99,
            "paid_at": auction.get("paid_at"),
            "shipping_address": None
        }
    
    # Prepare invoice data
    invoice_number = f"WIN-{auction_id[:8].upper()}"
    
    invoice_data = {
        "invoice_number": invoice_number,
        "date": payment.get("paid_at", "")[:10] if payment.get("paid_at") else datetime.now().strftime("%Y-%m-%d"),
        "customer": {
            "name": user.get("username", "Kunde"),
            "email": user.get("email", ""),
            "address": ""
        },
        "company": {
            "name": "BidBlitz GmbH",
            "address": "Musterstraße 123, 10115 Berlin, Deutschland",
            "email": "support@bidblitz.ae",
            "phone": "+49 30 123456789",
            "tax_id": "DE123456789"
        },
        "items": [
            {
                "description": payment.get("product_name", "Auktionsgewinn"),
                "quantity": 1,
                "unit_price": payment.get("final_price", 0),
                "total": payment.get("final_price", 0)
            },
            {
                "description": "Versandkosten",
                "quantity": 1,
                "unit_price": payment.get("shipping_cost", 4.99),
                "total": payment.get("shipping_cost", 4.99)
            }
        ],
        "subtotal": payment.get("final_price", 0) + payment.get("shipping_cost", 0),
        "tax_rate": 19,
        "tax_amount": (payment.get("total_amount", 0)) * 0.19 / 1.19,
        "total": payment.get("total_amount", 0),
        "payment_method": "Stripe",
        "notes": "Vielen Dank für Ihren Auktionsgewinn bei BidBlitz!"
    }
    
    # Add shipping address if available
    if payment.get("shipping_address"):
        addr = payment["shipping_address"]
        invoice_data["customer"]["address"] = f"{addr.get('street', '')}, {addr.get('postal_code', '')} {addr.get('city', '')}, {addr.get('country', '')}"
    
    # Generate PDF
    pdf_buffer = generate_invoice_pdf(invoice_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=rechnung-{auction_id[:8]}.pdf"
        }
    )

