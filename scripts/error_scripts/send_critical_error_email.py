# send_critical_error_email.py

import os
import sys
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import ssl
from datetime import datetime
import pytz


load_dotenv()


def get_current_date_in_vancouver_timezone():
    vancouver_timezone = pytz.timezone('America/Vancouver')
    current_time = datetime.now(vancouver_timezone)
    return current_time.strftime('%Y-%m-%d %H:%M:%S %Z')


def set_custom_message(error_source):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    error_log_path = os.path.join(current_dir, 'error-log.txt')
    with open(error_log_path, 'r') as log_file:
        error_log_contents = log_file.read()
    if error_source == "Backup":
        return f"The Production Planner automated database backup has failed.\n\nError Log:\n{error_log_contents}."
    elif error_source == "Application":
        return f"The Production Planner application has failed to run - please make sure you are logged in. \n\nError Log:\n{error_log_contents}"
    elif error_source == "Scheduled":
        return f"The Production Planner scheduled_task_executor has stopped unexepectedly.\n\nError Log:\n{error_log_contents}"
    elif error_source == "Code":
        return f"The Production Planner scheduled_task_executor has stopped due to a code error.\n\nError Log:\n{error_log_contents}"
    else:
        return f"An unknown error has occurred with the Production Planner backup and/or Application run process.\n\nError Log:\n{error_log_contents}"


def send_email(custom_message):
    context = ssl.create_default_context()
    port = int(os.getenv('ERROR_ALERT_EMAIL_SMTP_PORT'))
    smtp_server = os.getenv('ERROR_ALERT_EMAIL_SMTP_SERVER')
    sender_email = os.getenv('ERROR_ALERT_FROM_EMAIL')
    receiver_email = os.getenv('ERROR_ALERT_TO_EMAIL')
    password = os.getenv('ERROR_ALERT_EMAIL_PASSWORD')
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = 'Production Planner - Error Alert' 
    msg.attach(MIMEText(custom_message, 'plain'))
    try:
        with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
            server.login(sender_email, password)
            result = server.sendmail(sender_email, receiver_email, msg.as_string())
            if result:
                print(f"Failed to send email to: {result}")
                sys.exit(1)
            else:
                sys.exit(0)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)  


if __name__ == "__main__":
    if len(sys.argv) > 1:
        error_source = sys.argv[1]
    else:
        error_source = "Unknown"
    custom_message = set_custom_message(error_source)
    send_email(custom_message)