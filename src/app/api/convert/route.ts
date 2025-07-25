/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { ToWords } from "to-words";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the file buffer
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });

    // Get the first worksheet
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Initialize ToWords with Indian locale
    const toWords = new ToWords({
      localeCode: "en-IN",
      converterOptions: {
        currency: true,
      },
    });

    // Process the data - convert numeric values to words
    const processedData = jsonData.map((row: any) => {
      const processedRow: any = {};

      // Copy original data and add converted versions
      Object.entries(row).forEach(([key, value]) => {
        processedRow[key] = value;

        // Check if the value is a number
        if (typeof value === "number" && !isNaN(value)) {
          processedRow[`${key}_in_words`] = toWords.convert(value);
        } else if (typeof value === "string" && !isNaN(parseFloat(value)) && isFinite(parseFloat(value))) {
          // Handle string numbers
          const numValue = parseFloat(value);
          processedRow[`${key}_in_words`] = toWords.convert(numValue);
        }
      });

      return processedRow;
    });

    // If no numeric columns were found, try to process the first column as amounts
    if (processedData.length > 0 && !Object.keys(processedData[0]).some(key => key.includes("_in_words"))) {
      const firstColumnKey = Object.keys(processedData[0])[0];
      if (firstColumnKey) {
        processedData.forEach(row => {
          const value = row[firstColumnKey];
          if (typeof value === "number" && !isNaN(value)) {
            row.amount = value;
            row.amount_in_words = toWords.convert(value);
          } else if (typeof value === "string" && !isNaN(parseFloat(value)) && isFinite(parseFloat(value))) {
            const numValue = parseFloat(value);
            row.amount = numValue;
            row.amount_in_words = toWords.convert(numValue);
          }
        });
      }
    }

    // Create a new workbook with the processed data
    const newWorksheet = XLSX.utils.json_to_sheet(processedData);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Converted Data");

    // Generate buffer
    const outputBuffer = XLSX.write(newWorkbook, { type: "buffer", bookType: "xlsx" });

    // Return the file
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="converted_${file.name}"`,
      },
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
