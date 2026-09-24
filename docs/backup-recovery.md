# Backup & Recovery Plan: AIDS Student Portal

Since the system relies on a Google Spreadsheet as its primary database, the backup and recovery strategy is focused on the Google ecosystem.

## 💾 Backup Strategies

### 1. Manual Backup (Immediate)
The simplest way to create a snapshot of the current database:
- Open the `AIDS_Student_Portal_DB` spreadsheet.
- Go to **File** $\rightarrow$ **Make a copy**.
- Name it `AIDS_DB_Backup_[YYYY-MM-DD]`.

### 2. Automated Backups (Recommended)
To avoid manual errors, use a simple Google Apps Script trigger to backup the database daily.
**Implementation**:
Create a new `.gs` file in your backend project:
```javascript
function dailyBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const folder = DriveApp.getFolderById('YOUR_BACKUP_FOLDER_ID'); 
  const fileName = 'AIDS_Backup_' + Utils.now();
  
  // Create a copy of the spreadsheet in the backup folder
  DriveApp.getFileById(ss.getId()).makeCopy(fileName, folder);
  console.log('Backup completed: ' + fileName);
}
```
- Set a **Time-driven trigger** (Triggers $\rightarrow$ Add Trigger) to run `dailyBackup` every 24 hours.

---

## 🛠️ Recovery Procedures

### Scenario 1: Accidental Data Deletion (Recent)
If a row was accidentally deleted or overwritten:
1. Open the Spreadsheet.
2. Go to **File** $\rightarrow$ **Version history** $\rightarrow$ **See version history**.
3. Select the version from before the error occurred.
4. Click **Restore this version**.

### Scenario 2: Total Database Corruption/Loss
If the entire spreadsheet is deleted or corrupted:
1. Locate the most recent backup file in your Backup Folder.
2. **Make a copy** of that backup and rename it to `AIDS_Student_Portal_DB`.
3. Copy the **new Spreadsheet ID**.
4. Update the `SPREADSHEET_ID` in `Config.gs` in the Apps Script editor.
5. Re-deploy the Web App (Deploy $\rightarrow$ Manage Deployments $\rightarrow$ Edit $\rightarrow$ New Version $\rightarrow$ Deploy).

### Scenario 3: Backend Code Loss
If the Apps Script code is lost or corrupted:
1. Copy the updated files from the `/backend` directory of the project repository.
2. Paste them back into the GAS editor.
3. Ensure `Config.gs` contains the correct Spreadsheet ID.
4. Re-deploy as a Web App.

---

## ⚠️ Critical Warnings
- **Privacy**: Never share the Backup folder or the Spreadsheet with anyone except the authorized Admin.
- **Consistency**: Always perform a backup before running a large-scale update or a new `initializeDatabase()` call.
