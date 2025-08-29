import { ref } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'

export type ExportFormat = 'pdf' | 'json' | 'csv' | 'html'

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  includeMetadata?: boolean
  includeTimestamp?: boolean
}

export interface ExportData {
  searchQuery: {
    query: string
    address: string
    businessType: string
    timestamp: number
  }
  results: {
    requirements: Array<{
      title: string
      authority: string
      jurisdiction: string
      status: string
      description: string
      estimatedTime: string
      estimatedCost: string
    }>
    conflicts: Array<{
      title: string
      description: string
      severity: 'low' | 'medium' | 'high'
    }>
    recommendations: Array<{
      title: string
      description: string
      priority: number
    }>
  }
  metadata: {
    exportedAt: number
    exportedBy: string
    version: string
  }
}

/**
 * Composable for exporting search results in various formats
 * Supports PDF, JSON, CSV, and HTML exports with customizable options
 */
export function useExport() {
  const isExporting = ref(false)
  const exportProgress = ref(0)

  /**
   * Export search results to specified format
   */
  const exportResults = async (
    data: ExportData, 
    options: ExportOptions = { format: 'pdf' }
  ): Promise<boolean> => {
    try {
      isExporting.value = true
      exportProgress.value = 0

      const filename = options.filename || generateFilename(data, options.format)

      switch (options.format) {
        case 'pdf':
          await exportToPDF(data, filename)
          break
        case 'json':
          exportToJSON(data, filename, options)
          break
        case 'csv':
          exportToCSV(data, filename)
          break
        case 'html':
          exportToHTML(data, filename)
          break
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }

      return true
    } catch (error) {
      console.error('Export failed:', error)
      return false
    } finally {
      isExporting.value = false
      exportProgress.value = 0
    }
  }

  /**
   * Export to PDF with professional formatting
   */
  const exportToPDF = async (data: ExportData, filename: string) => {
    exportProgress.value = 10

    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height
    const margin = 20
    let currentY = margin

    // Add header
    pdf.setFontSize(20)
    pdf.setTextColor(5, 150, 105) // Primary green color
    pdf.text('LegalEase Report', margin, currentY)
    
    currentY += 10
    pdf.setFontSize(12)
    pdf.setTextColor(107, 114, 128) // Secondary gray color
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, currentY)

    currentY += 15
    exportProgress.value = 20

    // Add search query section
    pdf.setFontSize(16)
    pdf.setTextColor(31, 41, 55) // Primary text color
    pdf.text('Search Query', margin, currentY)
    currentY += 10

    pdf.setFontSize(10)
    pdf.setTextColor(107, 114, 128)
    
    const queryLines = [
      `Query: ${data.searchQuery.query}`,
      `Address: ${data.searchQuery.address}`,
      `Business Type: ${data.searchQuery.businessType}`,
      `Search Date: ${new Date(data.searchQuery.timestamp).toLocaleString()}`
    ]

    queryLines.forEach(line => {
      if (currentY > pageHeight - margin) {
        pdf.addPage()
        currentY = margin
      }
      pdf.text(line, margin, currentY)
      currentY += 5
    })

    currentY += 10
    exportProgress.value = 40

    // Add requirements section
    if (data.results.requirements.length > 0) {
      if (currentY > pageHeight - 40) {
        pdf.addPage()
        currentY = margin
      }

      pdf.setFontSize(16)
      pdf.setTextColor(31, 41, 55)
      pdf.text('Requirements Checklist', margin, currentY)
      currentY += 10

      data.results.requirements.forEach((req, index) => {
        if (currentY > pageHeight - 30) {
          pdf.addPage()
          currentY = margin
        }

        // Requirement header
        pdf.setFontSize(12)
        pdf.setTextColor(31, 41, 55)
        pdf.text(`${index + 1}. ${req.title}`, margin, currentY)
        currentY += 6

        // Requirement details
        pdf.setFontSize(9)
        pdf.setTextColor(107, 114, 128)
        
        const details = [
          `Authority: ${req.authority}`,
          `Jurisdiction: ${req.jurisdiction}`,
          `Status: ${req.status}`,
          `Estimated Time: ${req.estimatedTime}`,
          `Estimated Cost: ${req.estimatedCost}`
        ]

        details.forEach(detail => {
          pdf.text(`  • ${detail}`, margin + 5, currentY)
          currentY += 4
        })

        // Description
        if (req.description) {
          const descLines = pdf.splitTextToSize(req.description, pageWidth - margin * 2 - 5)
          descLines.forEach((line: string) => {
            if (currentY > pageHeight - margin) {
              pdf.addPage()
              currentY = margin
            }
            pdf.text(`  ${line}`, margin + 5, currentY)
            currentY += 4
          })
        }

        currentY += 5
      })
    }

    exportProgress.value = 70

    // Add conflicts section
    if (data.results.conflicts.length > 0) {
      if (currentY > pageHeight - 30) {
        pdf.addPage()
        currentY = margin
      }

      pdf.setFontSize(16)
      pdf.setTextColor(185, 28, 28) // Red color for conflicts
      pdf.text('⚠ Potential Conflicts', margin, currentY)
      currentY += 10

      data.results.conflicts.forEach((conflict, index) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage()
          currentY = margin
        }

        const severityColor = conflict.severity === 'high' ? [185, 28, 28] : 
                             conflict.severity === 'medium' ? [245, 158, 11] : [107, 114, 128]
        
        pdf.setFontSize(11)
        pdf.setTextColor(...severityColor)
        pdf.text(`${index + 1}. ${conflict.title} (${conflict.severity.toUpperCase()})`, margin, currentY)
        currentY += 6

        pdf.setFontSize(9)
        pdf.setTextColor(107, 114, 128)
        const conflictLines = pdf.splitTextToSize(conflict.description, pageWidth - margin * 2 - 5)
        conflictLines.forEach((line: string) => {
          if (currentY > pageHeight - margin) {
            pdf.addPage()
            currentY = margin
          }
          pdf.text(`  ${line}`, margin + 5, currentY)
          currentY += 4
        })
        currentY += 3
      })
    }

    exportProgress.value = 90

    // Add footer
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(156, 163, 175)
      pdf.text(
        'This report was generated by LegalEase and should be verified with relevant authorities.',
        margin,
        pageHeight - 10
      )
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 20,
        pageHeight - 10
      )
    }

    // Save the PDF
    pdf.save(filename)
    exportProgress.value = 100
  }

  /**
   * Export to JSON format
   */
  const exportToJSON = (data: ExportData, filename: string, options: ExportOptions) => {
    const exportData = options.includeMetadata !== false ? data : {
      searchQuery: data.searchQuery,
      results: data.results
    }

    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    saveAs(blob, filename)
  }

  /**
   * Export to CSV format
   */
  const exportToCSV = (data: ExportData, filename: string) => {
    const csvRows: string[] = []
    
    // Header
    csvRows.push('Type,Title,Authority,Jurisdiction,Status,Description,Estimated Time,Estimated Cost,Severity')

    // Requirements
    data.results.requirements.forEach(req => {
      const row = [
        'Requirement',
        `"${req.title}"`,
        `"${req.authority}"`,
        `"${req.jurisdiction}"`,
        `"${req.status}"`,
        `"${req.description.replace(/"/g, '""')}"`,
        `"${req.estimatedTime}"`,
        `"${req.estimatedCost}"`,
        ''
      ]
      csvRows.push(row.join(','))
    })

    // Conflicts
    data.results.conflicts.forEach(conflict => {
      const row = [
        'Conflict',
        `"${conflict.title}"`,
        '',
        '',
        '',
        `"${conflict.description.replace(/"/g, '""')}"`,
        '',
        '',
        `"${conflict.severity}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, filename)
  }

  /**
   * Export to HTML format (print-optimized)
   */
  const exportToHTML = (data: ExportData, filename: string) => {
    const html = generatePrintHTML(data)
    const blob = new Blob([html], { type: 'text/html' })
    saveAs(blob, filename)
  }

  /**
   * Generate print-optimized HTML
   */
  const generatePrintHTML = (data: ExportData): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LegalEase Report</title>
    <style>
        @media print {
            @page { margin: 2cm; }
            body { font-family: Arial, sans-serif; }
        }
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header { 
            border-bottom: 2px solid #059669; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
        }
        .header h1 { 
            color: #059669; 
            margin: 0;
        }
        .section { margin-bottom: 30px; }
        .section h2 { 
            color: #1f2937; 
            border-left: 4px solid #059669; 
            padding-left: 10px;
        }
        .requirement, .conflict { 
            margin-bottom: 20px; 
            padding: 15px; 
            border: 1px solid #e5e7eb; 
            border-radius: 5px;
        }
        .conflict { border-left: 4px solid #ef4444; }
        .requirement { border-left: 4px solid #059669; }
        .meta { color: #6b7280; font-size: 0.9em; }
        .high-severity { color: #ef4444; font-weight: bold; }
        .medium-severity { color: #f59e0b; font-weight: bold; }
        .low-severity { color: #6b7280; }
        @media print {
            .no-print { display: none; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚖️ LegalEase Report</h1>
        <p class="meta">Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Search Query</h2>
        <p><strong>Query:</strong> ${data.searchQuery.query}</p>
        <p><strong>Address:</strong> ${data.searchQuery.address}</p>
        <p><strong>Business Type:</strong> ${data.searchQuery.businessType}</p>
        <p><strong>Search Date:</strong> ${new Date(data.searchQuery.timestamp).toLocaleString()}</p>
    </div>

    ${data.results.requirements.length > 0 ? `
    <div class="section">
        <h2>Requirements Checklist</h2>
        ${data.results.requirements.map((req, index) => `
        <div class="requirement">
            <h3>${index + 1}. ${req.title}</h3>
            <p class="meta">
                <strong>Authority:</strong> ${req.authority} | 
                <strong>Jurisdiction:</strong> ${req.jurisdiction} | 
                <strong>Status:</strong> ${req.status}
            </p>
            <p>${req.description}</p>
            <p class="meta">
                <strong>Estimated Time:</strong> ${req.estimatedTime} | 
                <strong>Estimated Cost:</strong> ${req.estimatedCost}
            </p>
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.results.conflicts.length > 0 ? `
    <div class="section page-break">
        <h2>⚠ Potential Conflicts</h2>
        ${data.results.conflicts.map((conflict, index) => `
        <div class="conflict">
            <h3 class="${conflict.severity}-severity">${index + 1}. ${conflict.title}</h3>
            <p class="meta ${conflict.severity}-severity">Severity: ${conflict.severity.toUpperCase()}</p>
            <p>${conflict.description}</p>
        </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <p class="meta">
            <strong>Disclaimer:</strong> This report was generated by LegalEase and should be verified with relevant authorities. 
            LegalEase is an information discovery tool and does not provide legal advice.
        </p>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate filename based on data and format
   */
  const generateFilename = (data: ExportData, format: ExportFormat): string => {
    const timestamp = new Date().toISOString().split('T')[0]
    const query = data.searchQuery.query.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
    return `legalease-report-${query}-${timestamp}.${format}`
  }

  /**
   * Capture element as PDF using html2canvas
   */
  const captureElementToPDF = async (
    elementId: string, 
    filename: string,
    options: { orientation?: 'portrait' | 'landscape' } = {}
  ): Promise<boolean> => {
    try {
      isExporting.value = true
      exportProgress.value = 10

      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`)
      }

      exportProgress.value = 30

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      exportProgress.value = 60

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF(
        options.orientation || 'portrait', 
        'mm', 
        'a4'
      )

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(filename)

      exportProgress.value = 100
      return true
    } catch (error) {
      console.error('Element capture failed:', error)
      return false
    } finally {
      isExporting.value = false
      exportProgress.value = 0
    }
  }

  return {
    isExporting,
    exportProgress,
    exportResults,
    captureElementToPDF,
    generatePrintHTML
  }
}