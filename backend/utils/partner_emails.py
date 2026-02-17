# Partner Email Templates
# Separate file to avoid encoding issues

async def send_partner_application_received(send_email_func, to_email, business_name, business_type):
    """Send confirmation email when partner application is received."""
    business_type_display = {
        'restaurant': 'Restaurant',
        'bar': 'Bar & Club',
        'cafe': 'Cafe',
        'gas_station': 'Tankstelle',
        'cinema': 'Kino',
        'retail': 'Einzelhandel',
        'wellness': 'Wellness & Spa',
        'fitness': 'Fitness-Studio',
        'beauty': 'Friseur & Beauty',
        'hotel': 'Hotel & Unterkunft',
        'entertainment': 'Unterhaltung',
        'supermarket': 'Supermarkt',
        'pharmacy': 'Apotheke',
        'other': 'Sonstiges'
    }.get(business_type, business_type)
    
    html = f'''<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" style="max-width:600px;margin:0 auto;background:#fff;">
<tr><td style="background:linear-gradient(135deg,#F59E0B,#D97706);padding:30px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">Bewerbung eingegangen!</h1>
</td></tr>
<tr><td style="padding:30px;">
<p style="font-size:18px;color:#333;">Hallo <strong>{business_name}</strong>,</p>
<p style="font-size:16px;color:#555;">Vielen Dank fuer Ihre Bewerbung als BidBlitz Partner!</p>
<table width="100%" style="background:#FEF3C7;border-radius:10px;margin:20px 0;">
<tr><td style="padding:15px;">
<p style="margin:0;font-size:14px;color:#92400E;">Geschaeftstyp:</p>
<p style="margin:5px 0 0;font-size:18px;color:#D97706;font-weight:bold;">{business_type_display}</p>
</td></tr></table>
<p style="font-size:14px;color:#0369A1;background:#E0F2FE;padding:15px;border-radius:10px;">
<strong>Naechste Schritte:</strong><br>
Unser Team prueft Ihre Bewerbung innerhalb von 1-2 Werktagen.
</p>
</td></tr>
<tr><td style="background:#1a1a1a;padding:20px;text-align:center;">
<p style="margin:0;color:#888;font-size:12px;">2026 BidBlitz.ae FZCO | Dubai, UAE</p>
</td></tr></table></body></html>'''
    
    return await send_email_func(
        to_email=to_email,
        subject=f"Bewerbung eingegangen - {business_name}",
        html_content=html
    )


async def send_partner_approved(send_email_func, to_email, business_name, business_type, commission_rate):
    """Send email when partner application is approved."""
    business_type_display = {
        'restaurant': 'Restaurant',
        'bar': 'Bar & Club',
        'cafe': 'Cafe',
        'gas_station': 'Tankstelle',
        'cinema': 'Kino',
        'retail': 'Einzelhandel',
        'wellness': 'Wellness & Spa',
        'fitness': 'Fitness-Studio',
        'beauty': 'Friseur & Beauty',
        'hotel': 'Hotel & Unterkunft',
        'entertainment': 'Unterhaltung',
        'supermarket': 'Supermarkt',
        'pharmacy': 'Apotheke',
        'other': 'Sonstiges'
    }.get(business_type, business_type)
    
    payout_percent = 100 - commission_rate
    
    html = f'''<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" style="max-width:600px;margin:0 auto;background:#fff;">
<tr><td style="background:linear-gradient(135deg,#10B981,#059669);padding:30px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">Willkommen als Partner!</h1>
</td></tr>
<tr><td style="padding:30px;">
<p style="font-size:18px;color:#333;">Herzlichen Glueckwunsch <strong>{business_name}</strong>!</p>
<p style="font-size:16px;color:#555;">Ihre Bewerbung wurde genehmigt!</p>
<table width="100%" style="background:#D1FAE5;border-radius:10px;margin:20px 0;">
<tr>
<td style="padding:15px;">
<p style="margin:0;font-size:14px;color:#059669;">Geschaeftstyp:</p>
<p style="margin:5px 0;font-size:18px;color:#047857;font-weight:bold;">{business_type_display}</p>
</td>
<td style="padding:15px;text-align:right;">
<p style="margin:0;font-size:14px;color:#059669;">Ihre Auszahlung:</p>
<p style="margin:5px 0;font-size:24px;color:#047857;font-weight:bold;">{payout_percent}%</p>
<p style="margin:0;font-size:12px;color:#059669;">(BidBlitz behaelt {commission_rate}%)</p>
</td>
</tr></table>
<div style="text-align:center;margin-top:30px;">
<a href="https://eatbidblitz.preview.emergentagent.com/partner-portal" 
   style="display:inline-block;background:#10B981;color:#fff;padding:18px 40px;
          text-decoration:none;border-radius:10px;font-weight:bold;font-size:18px;">
Zum Partner Portal
</a>
</div>
</td></tr>
<tr><td style="background:#1a1a1a;padding:20px;text-align:center;">
<p style="margin:0;color:#888;font-size:12px;">2026 BidBlitz.ae FZCO | Dubai, UAE</p>
</td></tr></table></body></html>'''
    
    return await send_email_func(
        to_email=to_email,
        subject=f"Willkommen bei BidBlitz - {business_name}!",
        html_content=html
    )


async def send_partner_rejected(send_email_func, to_email, business_name, reason=None):
    """Send email when partner application is rejected."""
    reason_text = reason or "Leider erfuellt Ihre Bewerbung nicht unsere aktuellen Anforderungen."
    
    html = f'''<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" style="max-width:600px;margin:0 auto;background:#fff;">
<tr><td style="background:linear-gradient(135deg,#6B7280,#4B5563);padding:30px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">Bewerbung nicht angenommen</h1>
</td></tr>
<tr><td style="padding:30px;">
<p style="font-size:18px;color:#333;">Hallo <strong>{business_name}</strong>,</p>
<p style="font-size:16px;color:#555;">Vielen Dank fuer Ihr Interesse an einer Partnerschaft mit BidBlitz.</p>
<div style="background:#FEE2E2;border-left:4px solid #EF4444;padding:15px;margin:20px 0;border-radius:0 10px 10px 0;">
<p style="margin:0;font-size:14px;color:#DC2626;"><strong>Grund:</strong><br>{reason_text}</p>
</div>
<p style="font-size:14px;color:#555;">Sie koennen sich gerne erneut bewerben.</p>
</td></tr>
<tr><td style="background:#1a1a1a;padding:20px;text-align:center;">
<p style="margin:0;color:#888;font-size:12px;">2026 BidBlitz.ae FZCO | Dubai, UAE</p>
</td></tr></table></body></html>'''
    
    return await send_email_func(
        to_email=to_email,
        subject=f"Bewerbung nicht angenommen - {business_name}",
        html_content=html
    )


async def send_partner_payout_confirmation(send_email_func, to_email, business_name, payout_amount, payout_id):
    """Send confirmation email when partner requests a payout."""
    amount_str = f"{payout_amount:.2f}"
    
    html = f'''<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" style="max-width:600px;margin:0 auto;background:#fff;">
<tr><td style="background:linear-gradient(135deg,#10B981,#059669);padding:30px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">Auszahlung beantragt</h1>
</td></tr>
<tr><td style="padding:30px;">
<p style="font-size:18px;color:#333;">Hallo <strong>{business_name}</strong>,</p>
<p style="font-size:16px;color:#555;">Ihre Auszahlungsanfrage wurde erfolgreich eingereicht!</p>
<table width="100%" style="background:#D1FAE5;border-radius:10px;margin:20px 0;">
<tr><td style="padding:20px;text-align:center;">
<p style="margin:0;font-size:14px;color:#059669;">Auszahlungsbetrag:</p>
<p style="margin:10px 0 0;font-size:36px;color:#047857;font-weight:bold;">EUR {amount_str}</p>
<p style="margin:10px 0 0;font-size:12px;color:#059669;font-family:monospace;">ID: {payout_id}</p>
</td></tr></table>
<p style="font-size:14px;color:#92400E;background:#FEF3C7;padding:15px;border-radius:10px;">
<strong>Bearbeitungszeit:</strong><br>
Auszahlungen werden innerhalb von 3-5 Werktagen ueberwiesen.
</p>
</td></tr>
<tr><td style="background:#1a1a1a;padding:20px;text-align:center;">
<p style="margin:0;color:#888;font-size:12px;">2026 BidBlitz.ae FZCO | Dubai, UAE</p>
</td></tr></table></body></html>'''
    
    return await send_email_func(
        to_email=to_email,
        subject=f"Auszahlung beantragt: EUR {amount_str}",
        html_content=html
    )
