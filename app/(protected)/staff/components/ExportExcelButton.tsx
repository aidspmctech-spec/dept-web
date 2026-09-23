'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExportExcelButtonProps {
  data?: Record<string, any>[];
  filename: string;
  sheetName?: string;
  fetchUrl?: string;
  disabled?: boolean;
}

export default function ExportExcelButton({
  data,
  filename,
  sheetName = 'Sheet1',
  fetchUrl,
  disabled,
}: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let exportData = data;

      if (fetchUrl) {
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error('Failed to fetch export data');
        exportData = await res.json();
      }

      if (!exportData || exportData.length === 0) {
        alert('No data available to export');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // For static data, we can still disable the button if it's empty.
  // For fetchUrl, we can't know if it's empty until we fetch,
  // unless we have a hint from the parent.
  if (data && data.length === 0 && !fetchUrl) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
      >
        No Data to Export
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || disabled}
      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
    >
      {isExporting ? 'Exporting...' : 'Download Excel'}
    </button>
  );
}
