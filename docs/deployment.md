# Deployment Guide: AIDS Student Portal

This guide provides step-by-step instructions to deploy the AIDS Student Management & Development Portal using the zero-cost architecture.

## 🛠️ Prerequisites
- A Google Account (for Google Sheets and Apps Script).
- A GitHub account (for hosting the static frontend).

---

## Step 1: Database Setup (Google Sheets)
1. Create a new **Google Spreadsheet**.
2. Name it `AIDS_Student_Portal_DB`.
3. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/[THIS_IS_THE_ID]/edit`
4. Keep this ID ready for the backend configuration.

## Step 2: Backend Deployment (Google Apps Script)
1. In your spreadsheet, go to **Extensions** $\rightarrow$ **Apps Script**.
2. **Create the Files**: Create the following `.gs` files in the editor and paste the corresponding code from the `/backend` directory:
   - `Config.gs`
   - `Utils.gs`
   - `Auth.gs`
   - `Code.gs`
   - `Students.gs`
   - `Fees.gs`
   - `Payments.gs`
   - `Hostel.gs`
   - `Transport.gs`
   - `Academics.gs`
   - `Achievements.gs`
   - `Certifications.gs`
   - `Reports.gs`
   - `Audit.gs`
   - `Validator.gs`
   - `SessionManager.gs`
   - `Setup.gs`
3. **Configure**: In `Config.gs`, replace `YOUR_SPREADSHEET_ID_HERE` with the ID you copied in Step 1.
4. **Initialize Database**:
   - In the toolbar, select the function `initializeDatabase` and click **Run**.
   - This creates all required worksheets and headers.
5. **Seed Demo Data**:
   - Select the function `seedDemoData` and click **Run**.
   - This populates the system with a test student and staff member.
6. **Deploy as Web App**:
   - Click **Deploy** $\rightarrow$ **New Deployment**.
   - Select type: **Web App**.
   - Description: `AIDS Portal API v1.0`.
   - Execute as: **Me** (This is critical; it allows the API to access the private sheet).
   - Who has access: **Anyone**.
   - Click **Deploy**.
7. **Copy the Web App URL**: Copy the provided URL (ends in `/exec`).

## Step 3: Frontend Deployment
1. **Configure API**:
   - Open `frontend/js/api.js`.
   - Replace `YOUR_GAS_WEB_APP_URL_HERE` with the Web App URL from Step 2.
2. **Host the Frontend**:
   - **Option A (GitHub Pages - Recommended)**:
     - Create a new GitHub repository.
     - Upload the entire `frontend/` folder content to the root.
     - Go to **Settings** $\rightarrow$ **Pages** $\rightarrow$ Set branch to `main` $\rightarrow$ Save.
   - **Option B (Local/Simple)**: Open `frontend/index.html` directly in a browser.

---

## 🚦 Final Verification Checklist
- [ ] Can I reach the login page?
- [ ] Can I log in as a student (`23AD101` / `AIDS-DEMO-123`)?
- [ ] Can I view my profile and fees?
- [ ] Can I log in as staff (`STF-001` / `STAFF-DEMO-456`)?
- [ ] Can I verify a pending achievement?
- [ ] Does the Admin dashboard show correct statistics?


https://script.google.com/macros/s/AKfycbwZkrC1mPV1pWu3Fw45TzOAo6hyin84aBfHSb2lab2kAB-etxecuX4lL_YtGJAh9dPX/exec

AKfycbwZkrC1mPV1pWu3Fw45TzOAo6hyin84aBfHSb2lab2kAB-etxecuX4lL_YtGJAh9dPX


staff are supervisers , 
- they are allowed to view and download the data of all students which they by filering and apllying sortings,... 
- staff are allowed to create or delete students from that (totally we have classes let us take like in batch wise, 2023, 2024, 2025, in each batch there are 2 sections (A and B)) - these are the fields that staff need to fill when creating student
- we need 2 options to create students 
1. user manual way  , by they can click on add student and select these many fields like batch , section , and all other detials , 
2. just like upload data of excel sheet , we retrive data from and and creates students and generates unique keys for each and return as excel sheet
students..
- each students are allowed to update their fees detials , achivements , cerificates, (only if that is new record)
- first time staff a create a list and provide them the keys , now for the first time users we need to ask essential things like wheather daysscholar or using hostel
if they are daysscholar then what transport mode they use?
2 options:
1. college bus
2. outbus

here is how the fees stucture follows
- for college bus students - tution fee + college bus fee(transport fee)
- for outbus students - only tyuition fee
- for hostel students - tution fee + hostel fee
for need seperate seperate fee maintaince, like 
total fee , paid fee , pending fee for each fee 
like for tution fee it should be seperate and for hostel feee this should maintained seperare
and one more thing , if they fill detials , like eg
im days scholar and using outbus
so my only  fee is tution fee , and my fee is 45,000 and i paid 10000 so , when i enter this , it should atuomatically updated like i have only tytion fee , my total fee is 45000 , i paid 10000 and balance is 35000 , it should always shown as history and mode of payment - options are : cash , online , DD 

now we need to remove all the websites , and create only one staff account only , 
name STAFF and id as AIDS-STAFF
 

 AKfycbwZkrC1mPV1pWu3Fw45TzOAo6hyin84aBfHSb2lab2kAB-etxecuX4lL_YtGJAh9dPX

 https://script.google.com/macros/s/AKfycbwZkrC1mPV1pWu3Fw45TzOAo6hyin84aBfHSb2lab2kAB-etxecuX4lL_YtGJAh9dPX/exec

 https://script.google.com/macros/library/d/1tmYjntBnE7f4gh0qyvBdWoc2asN68K9NIxOmAsJKsfJxdeYAtiGi30vo/2

 