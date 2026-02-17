"""Winner notification service - Send emails when auctions end"""
import resend
from config import db, logger, RESEND_API_KEY, SENDER_EMAIL

# Initialize Resend
resend.api_key = RESEND_API_KEY

async def send_partner_voucher_sold_notification(product_data: dict, winner_name: str, final_price: float):
    """Send email to partner when a real customer (not bot) wins their voucher"""
    try:
        partner_id = product_data.get("partner_id")
        if not partner_id:
            return False
        
        # Get partner data
        partner = await db.partner_accounts.find_one({"id": partner_id}, {"_id": 0})
        if not partner:
            partner = await db.restaurant_accounts.find_one({"id": partner_id}, {"_id": 0})
        
        if not partner or not partner.get("email"):
            logger.warning(f"Cannot send partner notification - partner {partner_id} not found")
            return False
        
        partner_email = partner["email"]
        partner_name = partner.get("business_name", partner.get("restaurant_name", "Partner"))
        commission_rate = partner.get("commission_rate", 10)
        
        product_name = product_data.get("name", "Gutschein")
        product_value = product_data.get("value", product_data.get("retail_price", 0))
        
        # Calculate partner payout (after commission)
        partner_payout = final_price * (1 - commission_rate / 100)
        
        subject = f"🎉 Ihr Gutschein wurde verkauft: {product_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
                .info-card {{ background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .payout-box {{ background: #10B981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Verkauf!</h1>
                    <p>Hallo {partner_name}!</p>
                </div>
                
                <div class="content">
                    <p>Gute Nachrichten! Ein Kunde hat Ihren Gutschein bei einer BidBlitz-Auktion gewonnen:</p>
                    
                    <div class="info-card">
                        <h3 style="margin: 0 0 15px 0;">{product_name}</h3>
                        <table width="100%" style="font-size: 14px;">
                            <tr>
                                <td style="padding: 5px 0; color: #666;">Gutscheinwert:</td>
                                <td style="padding: 5px 0; text-align: right; font-weight: bold;">€ {product_value:.2f}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; color: #666;">Verkaufspreis:</td>
                                <td style="padding: 5px 0; text-align: right; font-weight: bold;">€ {final_price:.2f}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; color: #666;">Provision ({commission_rate}%):</td>
                                <td style="padding: 5px 0; text-align: right; color: #EF4444;">- € {(final_price * commission_rate / 100):.2f}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="payout-box">
                        <p style="margin: 0; font-size: 14px;">Ihre Gutschrift</p>
                        <h2 style="margin: 5px 0; font-size: 28px;">€ {partner_payout:.2f}</h2>
                        <p style="margin: 0; font-size: 12px; opacity: 0.9;">wird Ihrem Konto gutgeschrieben</p>
                    </div>
                    
                    <p style="text-align: center; margin-top: 20px;">
                        <strong>Gewinner:</strong> {winner_name}
                    </p>
                    
                    <p style="text-align: center; color: #666; font-size: 14px;">
                        Der Betrag wird Ihrem ausstehenden Guthaben hinzugefügt.<br>
                        Besuchen Sie Ihr Partner-Portal für Details.
                    </p>
                </div>
                
                <div class="footer">
                    <p>BidBlitz Partner Portal</p>
                    <p>Diese E-Mail wurde automatisch generiert.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Send email via Resend
        response = resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": partner_email,
            "subject": subject,
            "html": html_content
        })
        
        logger.info(f"✉️ Partner voucher sold notification sent to {partner_email} for {product_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending partner voucher notification: {e}")
        return False

async def send_winner_email(winner_id: str, auction_data: dict, product_data: dict):
    """Send email to auction winner with payment instructions"""
    try:
        # Get winner data
        winner = await db.users.find_one({"id": winner_id}, {"_id": 0})
        if not winner or not winner.get("email"):
            logger.warning(f"Cannot send winner email - user {winner_id} not found or no email")
            return False
        
        winner_email = winner["email"]
        winner_name = winner.get("name", "Gewinner")
        
        product_name = product_data.get("name", "Produkt")
        final_price = auction_data.get("current_price", auction_data.get("final_price", 0.01))
        retail_price = product_data.get("retail_price", 0)
        auction_id = auction_data.get("id", "")
        product_image = product_data.get("image_url", "")
        
        # Calculate savings
        savings = retail_price - final_price if retail_price > final_price else 0
        savings_percent = round((savings / retail_price) * 100) if retail_price > 0 else 0
        
        # Determine if it's a free auction (gift card)
        is_free_auction = auction_data.get("is_free_auction", False)
        
        # Email content
        subject = f"🎉 Herzlichen Glückwunsch! Sie haben gewonnen: {product_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #06B6D4, #0891B2); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
                .product-card {{ background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .price-box {{ background: #10B981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }}
                .savings {{ background: #FBBF24; color: #1F2937; padding: 10px; border-radius: 8px; text-align: center; }}
                .cta-button {{ display: inline-block; background: #06B6D4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .warning {{ background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏆 GEWONNEN!</h1>
                    <p>Herzlichen Glückwunsch, {winner_name}!</p>
                </div>
                
                <div class="content">
                    <div class="product-card">
                        <table width="100%">
                            <tr>
                                <td width="120">
                                    <img src="{product_image}" alt="{product_name}" style="max-width: 100px; border-radius: 8px;">
                                </td>
                                <td style="padding-left: 15px;">
                                    <h2 style="margin: 0 0 10px 0;">{product_name}</h2>
                                    <p style="margin: 5px 0; color: #666;">UVP: <s>€ {retail_price:,.2f}</s></p>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="price-box">
                        <p style="margin: 0; font-size: 14px;">Ihr Endpreis</p>
                        <h2 style="margin: 5px 0; font-size: 32px;">€ {final_price:.2f}</h2>
                    </div>
                    
                    <div class="savings">
                        <strong>🎉 Sie sparen € {savings:,.2f} ({savings_percent}%)</strong>
                    </div>
                    
                    {"<div class='warning'><strong>📋 Hinweis Gratis-Auktion:</strong><br>Diese Auktion war kostenlos zu bieten. Sie müssen nur den Endpreis von € " + f"{final_price:.2f}" + " für den Gutschein bezahlen.</div>" if is_free_auction else ""}
                    
                    <h3>📦 Nächste Schritte:</h3>
                    <ol>
                        <li>Klicken Sie auf den Button unten oder gehen Sie zu Ihrem Dashboard</li>
                        <li>Bezahlen Sie den Endpreis von <strong>€ {final_price:.2f}</strong></li>
                        <li>Nach Zahlung wird Ihr Produkt versandt</li>
                    </ol>
                    
                    <p style="text-align: center;">
                        <a href="https://bidblitz.ae/dashboard" class="cta-button">
                            💳 Jetzt bezahlen & abholen
                        </a>
                    </p>
                    
                    <div class="warning">
                        <strong>⏰ Wichtig:</strong> Bitte bezahlen Sie innerhalb von 7 Tagen, 
                        sonst verfällt Ihr Gewinn und wird einem anderen Bieter angeboten.
                    </div>
                </div>
                
                <div class="footer">
                    <p>bidblitz.ae FZCO | Dubai Silicon Oasis, DDP Building A1</p>
                    <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Send email via Resend
        response = resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": winner_email,
            "subject": subject,
            "html": html_content
        })
        
        logger.info(f"✉️ Winner email sent to {winner_email} for {product_name}")
        
        # Log notification in database
        await db.notifications.insert_one({
            "user_id": winner_id,
            "type": "auction_won",
            "title": f"🎉 Gewonnen: {product_name}",
            "message": f"Sie haben {product_name} für € {final_price:.2f} gewonnen! Bitte bezahlen Sie, um Ihren Gewinn zu erhalten.",
            "auction_id": auction_id,
            "read": False,
            "created_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
        })
        
        return True
        
    except Exception as e:
        logger.error(f"Error sending winner email: {e}")
        return False
