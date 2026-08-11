import os
import resend


def send_password_reset_otp(email: str, otp: str):
    resend.api_key = os.getenv("RESEND_API_KEY")

    sender = os.getenv(
        "MAIL_FROM",
        "FraudShield <onboarding@resend.dev>"
    )

    resend.Emails.send({
        "from": sender,
        "to": [email],
        "subject": "FraudShield Password Reset Code",
        "html": f"""
            <h2>FraudShield Password Reset</h2>

            <p>Your password reset code is:</p>

            <h1>{otp}</h1>

            <p>This code will expire in 15 minutes.</p>

            <p>
                If you did not request a password reset,
                you can safely ignore this email.
            </p>
        """
    })