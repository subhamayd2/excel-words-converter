"use client";

import { ExcelConverter } from "@/components/excel-converter";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Excel Amount to Words Converter
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload an Excel file and convert numeric amounts to words
          </p>
        </div>
        <ExcelConverter />
      </div>
      <Toaster />
    </div>
  );
}
