# Connect enquiries to a Google Sheet in your shared Drive

Every contact-form submission is saved in the MySQL database. It is also copied into a Google Sheet that you can open from the shared Drive, and that the admin panel reads back under **Contacts → View Google Sheet**.

## 1. Create the spreadsheet

1. In Google Drive, open your **shared drive** (or a shared folder) and create a new **Google Sheets** file, for example *Datanomics – Website Enquiries*.
2. Copy its address from the browser. You'll use it as `SHEETS_VIEW_URL`.

## 2. Add the script

1. In the spreadsheet, open **Extensions → Apps Script**.
2. Delete the sample code, paste everything from `Code.gs`, and save.
3. Create a long random secret. On the server, run:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. Paste that value into the `SECRET` line at the top of the script, then save.

## 3. Deploy as a web app

1. Click **Deploy → New deployment**. Next to "Select type", click the gear icon and choose **Web app**.
2. Set **Execute as** to *Me* and **Who has access** to *Anyone*. The secret keeps it private: requests without it are refused.
3. Click **Deploy**, approve the permissions, and copy the **Web app URL**. It ends in `/exec`.

## 4. Tell the website

Add these lines to the server's `.env` file, then restart the site:

```
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/XXXXXXXX/exec
SHEETS_SECRET=the-same-secret-as-in-the-script
SHEETS_VIEW_URL=https://docs.google.com/spreadsheets/d/XXXXXXXX/edit
```

## 5. Check it works

1. Send a test message from the website's Contact page.
2. A new row should appear in the **Enquiries** tab within a few seconds.
3. In the admin panel, open **Contacts**. The enquiry shows **Sheet: Saved**, and **View Google Sheet** lists the rows.

If an enquiry shows **Pending**, hover over it to see the error, fix the setting, and click **Sync to Google Sheet**. Earlier enquiries that never reached the sheet are sent as well, and nothing is duplicated.

**Changed the script later?** Use **Deploy → Manage deployments → Edit → Version: New version** so the URL stays the same.

**Want an .xlsx file?** In the admin panel, click **Download Excel** on the Contacts page. Or, in Google Sheets, choose **File → Download → Microsoft Excel (.xlsx)**.
