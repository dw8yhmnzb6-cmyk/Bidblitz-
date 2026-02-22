"""
Email Service using Resend
Handles all transactional emails for BidBlitz
"""

import os
import asyncio
import logging
import resend
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "info@bidblitz.ae")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://bidblitz.ae")


async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """Send an email using Resend API"""
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"✉️ Email sent to {to_email}: {subject}")
        return {"success": True, "email_id": email.get("id")}
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_verification_email(to_email: str, user_name: str, verification_token: str) -> dict:
    """Send email verification link to new user"""
    verification_url = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 28px;">⚡ BidBlitz</h1>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #f59e0b; margin: 0 0 20px 0; font-size: 24px;">
                                    Willkommen bei BidBlitz, {user_name}! 🎉
                                </h2>
                                
                                <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                    Vielen Dank für Ihre Registrierung! Bitte bestätigen Sie Ihre E-Mail-Adresse, 
                                    um Ihr Konto zu aktivieren und alle Funktionen nutzen zu können.
                                </p>
                                
                                <!-- Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="{verification_url}" 
                                               style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                                                      color: white; text-decoration: none; padding: 16px 40px; 
                                                      border-radius: 8px; font-size: 18px; font-weight: bold;">
                                                ✉️ E-Mail bestätigen
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
                                    Oder kopieren Sie diesen Link in Ihren Browser:<br>
                                    <a href="{verification_url}" style="color: #f59e0b; word-break: break-all;">
                                        {verification_url}
                                    </a>
                                </p>
                                
                                <p style="color: #64748b; font-size: 14px; margin: 25px 0 0 0;">
                                    ⏰ Dieser Link ist 24 Stunden gültig.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #0f172a; padding: 25px 30px; text-align: center;">
                                <p style="color: #64748b; font-size: 12px; margin: 0;">
                                    © 2026 BidBlitz. Alle Rechte vorbehalten.<br>
                                    Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return await send_email(to_email, "✉️ Bitte bestätigen Sie Ihre E-Mail-Adresse - BidBlitz", html_content)


async def send_welcome_email(to_email: str, user_name: str) -> dict:
    """Send welcome email after successful verification"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 28px;">⚡ BidBlitz</h1>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #22c55e; margin: 0 0 20px 0; font-size: 24px;">
                                    ✅ E-Mail erfolgreich bestätigt!
                                </h2>
                                
                                <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 25px 0;">
                                    Hallo {user_name},
                                </p>
                                
                                <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                    Herzlichen Glückwunsch! Ihr BidBlitz-Konto ist jetzt vollständig aktiviert. 
                                    Sie können nun alle Funktionen unserer Plattform nutzen.
                                </p>
                                
                                <!-- Features -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 15px; background-color: #0f172a; border-radius: 8px; margin-bottom: 10px;">
                                            <p style="color: #f59e0b; font-size: 16px; margin: 0;">
                                                🎯 <strong>10 Willkommens-Gebote</strong> - Starten Sie sofort mit Bieten!
                                            </p>
                                        </td>
                                    </tr>
                                    <tr><td style="height: 10px;"></td></tr>
                                    <tr>
                                        <td style="padding: 15px; background-color: #0f172a; border-radius: 8px;">
                                            <p style="color: #f59e0b; font-size: 16px; margin: 0;">
                                                💰 <strong>Exklusive Angebote</strong> - Sparen Sie bis zu 90%!
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding: 25px 0;">
                                            <a href="{FRONTEND_URL}/login" 
                                               style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); 
                                                      color: white; text-decoration: none; padding: 16px 40px; 
                                                      border-radius: 8px; font-size: 18px; font-weight: bold;">
                                                🚀 Jetzt einloggen
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #0f172a; padding: 25px 30px; text-align: center;">
                                <p style="color: #64748b; font-size: 12px; margin: 0;">
                                    © 2026 BidBlitz. Alle Rechte vorbehalten.<br>
                                    Bei Fragen kontaktieren Sie uns unter info@bidblitz.ae
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return await send_email(to_email, "🎉 Willkommen bei BidBlitz - Ihr Konto ist aktiviert!", html_content)


async def send_kyc_approved_email(to_email: str, user_name: str) -> dict:
    """Send email when KYC verification is approved"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 28px;">✅ Verifizierung bestätigt!</h1>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 25px 0;">
                                    Hallo {user_name},
                                </p>
                                
                                <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                    Großartige Neuigkeiten! Ihre Identitätsverifizierung wurde erfolgreich abgeschlossen. 
                                    Sie haben jetzt vollen Zugang zu allen BidBlitz-Funktionen.
                                </p>
                                
                                <!-- Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="{FRONTEND_URL}/dashboard" 
                                               style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                                                      color: white; text-decoration: none; padding: 16px 40px; 
                                                      border-radius: 8px; font-size: 18px; font-weight: bold;">
                                                🚀 Zum Dashboard
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #0f172a; padding: 25px 30px; text-align: center;">
                                <p style="color: #64748b; font-size: 12px; margin: 0;">
                                    © 2026 BidBlitz. Alle Rechte vorbehalten.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return await send_email(to_email, "✅ Ihre BidBlitz-Verifizierung wurde bestätigt!", html_content)


async def send_kyc_rejected_email(to_email: str, user_name: str, reason: str) -> dict:
    """Send email when KYC verification is rejected"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Verifizierung nicht erfolgreich</h1>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 25px 0;">
                                    Hallo {user_name},
                                </p>
                                
                                <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                    Leider konnte Ihre Identitätsverifizierung nicht bestätigt werden.
                                </p>
                                
                                <div style="background-color: #0f172a; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 20px 0;">
                                    <p style="color: #f87171; font-size: 14px; margin: 0 0 5px 0; font-weight: bold;">Grund:</p>
                                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">{reason}</p>
                                </div>
                                
                                <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                                    Bitte laden Sie neue Dokumente hoch, um den Prozess erneut zu starten.
                                </p>
                                
                                <!-- Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="{FRONTEND_URL}/kyc-verification" 
                                               style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                                                      color: white; text-decoration: none; padding: 16px 40px; 
                                                      border-radius: 8px; font-size: 18px; font-weight: bold;">
                                                📄 Neue Dokumente hochladen
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #0f172a; padding: 25px 30px; text-align: center;">
                                <p style="color: #64748b; font-size: 12px; margin: 0;">
                                    © 2026 BidBlitz. Bei Fragen kontaktieren Sie uns unter info@bidblitz.ae
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return await send_email(to_email, "⚠️ Ihre BidBlitz-Verifizierung benötigt Ihre Aufmerksamkeit", html_content)
