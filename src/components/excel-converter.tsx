"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet } from "lucide-react";

export function ExcelConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
          selectedFile.type === "application/vnd.ms-excel" ||
          selectedFile.name.endsWith('.xlsx') || 
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setDownloadUrl(null);
        toast.success("File selected successfully!");
      } else {
        toast.error("Please select a valid Excel file (.xlsx or .xls)");
        event.target.value = "";
      }
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const processFile = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error("Failed to process file");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      toast.success("File processed successfully! You can now download the converted file.");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process file. Please try again.");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const downloadFile = () => {
    if (downloadUrl) {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `converted_${file?.name || "file.xlsx"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("File downloaded successfully!");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Excel Converter
          </CardTitle>
          <CardDescription>
            Upload your Excel file to convert numeric amounts to words
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select Excel File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <Button
                onClick={handleUpload}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
              {file && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {file.name}
                </span>
              )}
            </div>
          </div>

          {/* Process Button */}
          <Button
            onClick={processFile}
            disabled={!file || processing}
            className="w-full"
            size="lg"
          >
            {processing ? "Processing..." : "Convert Amounts to Words"}
          </Button>

          {/* Progress Bar */}
          {processing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing file...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Download Section */}
          {downloadUrl && (
            <div className="space-y-2">
              <Label>Download Converted File</Label>
              <Button
                onClick={downloadFile}
                className="w-full flex items-center gap-2"
                variant="default"
              >
                <Download className="h-4 w-4" />
                Download Converted Excel File
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How it works:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Upload an Excel file containing numeric amounts</li>
              <li>• The app will convert all numeric values to words (Indian format)</li>
              <li>• Download the new Excel file with both original amounts and words</li>
              <li>• Supports .xlsx and .xls file formats</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
