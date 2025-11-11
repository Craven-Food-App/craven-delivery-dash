"""
Utility script for reading data from a Google Sheet.

This does NOT replace the existing executive document flow (which still uses
Resend). It is a standalone helper that you can run manually or schedule.

Prerequisites
-------------
1. Create/Use a Google Cloud project and enable the Google Sheets API.
2. Create a service account and download the JSON key file.
3. Save the key alongside this script (default name: service_account_credentials.json).
4. Share the target spreadsheet with the service-account email.
5. Install dependencies:
     pip install google-auth google-auth-oauthlib google-api-python-client

Usage
-----
    python scripts/sync_google_sheet.py

Fill in SPREADSHEET_ID / RANGE_NAME below before running.
"""

import os
from typing import List, Optional

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"
RANGE_NAME = "Sheet1!A1:D"
CREDENTIALS_FILE = "service_account_credentials.json"


# ---------------------------------------------------------------------------
# Google Sheets helpers
# ---------------------------------------------------------------------------

def get_google_sheets_service():
    """
    Set up authentication and return the Google Sheets API service object.
    """
    print(f"Attempting to load credentials from: {CREDENTIALS_FILE}")

    if not os.path.exists(CREDENTIALS_FILE):
        print("\n--- ERROR: CREDENTIALS FILE MISSING ---")
        print("Create a Google Service Account, enable the Sheets API,")
        print("download its JSON key, and rename it to "
              f"'{CREDENTIALS_FILE}' next to this script.\n")
        return None

    try:
        creds = Credentials.from_service_account_file(
            CREDENTIALS_FILE,
            scopes=SCOPES,
        )
        service = build("sheets", "v4", credentials=creds)
        print("Authentication successful. Sheets service object created.")
        return service
    except Exception as exc:  # noqa: broad-except
        print(f"An error occurred during authentication or service building: {exc}")
        return None


def read_data_from_sheet(
    service,
    spreadsheet_id: str,
    range_name: str,
) -> Optional[List[List[str]]]:
    """
    Read data from the specified range and return it as a list of rows.
    """
    if not service:
        print("Cannot read data: Google Sheets service is not available.")
        return None

    try:
        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=spreadsheet_id, range=range_name)
            .execute()
        )
        values = result.get("values", [])

        if not values:
            print("No data found in the specified range.")
            return []

        print(f'\n--- Data from Range "{range_name}" ---')
        for row in values:
            print(row)

        print(f"\nSuccessfully read {len(values)} rows of data.")
        return values
    except HttpError as http_err:
        print(f"HTTP error while reading the sheet: {http_err}")
        return None
    except Exception as exc:  # noqa: broad-except
        print(f"An error occurred while reading the sheet: {exc}")
        return None


# ---------------------------------------------------------------------------
# Main execution
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    sheets_service = get_google_sheets_service()

    if sheets_service:
        sheet_data = read_data_from_sheet(sheets_service, SPREADSHEET_ID, RANGE_NAME)

        if sheet_data:
            print("\nNext steps: process this data or write updates back to the sheet.")
            # Example:
            # print(f"Total records processed: {len(sheet_data)}")
    else:
        print("\nSetup failed. Please verify credentials and configuration.")


