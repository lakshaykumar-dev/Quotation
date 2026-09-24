package com.mobile

import android.app.Activity
import android.app.DatePickerDialog
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.util.Calendar

class QuotationPdfModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "QuotationPdfModule"

    @ReactMethod
    fun printHtml(html: String, jobName: String, promise: Promise) {
        val currentAct: Activity? = reactContext.currentActivity
        if (currentAct == null) {
            promise.reject("E_ACTIVITY_NULL", "Current Activity is null")
            return
        }

        Handler(Looper.getMainLooper()).post {
            try {
                val webView = WebView(currentAct)
                webView.webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        val printManager = currentAct.getSystemService(Context.PRINT_SERVICE) as? PrintManager
                        if (printManager == null) {
                            promise.reject("E_PRINT_SERVICE", "Print service not available on device")
                            return
                        }

                        val printAdapter = webView.createPrintDocumentAdapter(jobName)
                        val printAttributes = PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                            .build()

                        printManager.print(jobName, printAdapter, printAttributes)
                        promise.resolve(true)
                    }
                }
                webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
            } catch (e: Exception) {
                promise.reject("E_PRINT_ERROR", e.localizedMessage ?: "Unknown print error", e)
            }
        }
    }

    @ReactMethod
    fun generateAndSharePdf(html: String, jobName: String, promise: Promise) {
        val currentAct: Activity? = reactContext.currentActivity
        if (currentAct == null) {
            promise.reject("E_ACTIVITY_NULL", "Current Activity is null")
            return
        }

        Handler(Looper.getMainLooper()).post {
            try {
                val webView = WebView(currentAct)
                webView.settings.javaScriptEnabled = true
                webView.webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        try {
                            val outputDir = File(currentAct.cacheDir, "quotations")
                            val safeName = jobName.replace("[^a-zA-Z0-9_-]".toRegex(), "_")
                            val fileName = "$safeName.pdf"

                            val printAttributes = PrintAttributes.Builder()
                                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                                .setResolution(PrintAttributes.Resolution("pdf", "pdf", 300, 300))
                                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                .build()

                            val adapter = webView.createPrintDocumentAdapter(jobName)
                            val pdfPrint = android.print.PdfPrint(printAttributes)

                            pdfPrint.print(adapter, outputDir, fileName, object : android.print.PdfPrint.Callback {
                                override fun onSuccess(file: File) {
                                    try {
                                        val contentUri = FileProvider.getUriForFile(
                                            currentAct,
                                            "${currentAct.packageName}.provider",
                                            file
                                        )

                                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                            type = "application/pdf"
                                            putExtra(Intent.EXTRA_STREAM, contentUri)
                                            putExtra(Intent.EXTRA_SUBJECT, "$jobName.pdf")
                                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                        }

                                        val chooser = Intent.createChooser(shareIntent, "Share Quotation PDF")
                                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                        currentAct.startActivity(chooser)

                                        promise.resolve(file.absolutePath)
                                    } catch (ex: Exception) {
                                        promise.reject("E_SHARE_INTENT", ex.localizedMessage ?: "Failed to open share sheet", ex)
                                    }
                                }

                                override fun onFailure(error: Throwable) {
                                    promise.reject("E_PDF_WRITE", error.localizedMessage ?: "Failed to generate PDF", error)
                                }
                            })
                        } catch (err: Exception) {
                            promise.reject("E_PDF_GEN", err.localizedMessage ?: "Failed to configure PDF", err)
                        }
                    }
                }
                webView.loadDataWithBaseURL("file:///android_asset/", html, "text/html", "UTF-8", null)
            } catch (e: Exception) {
                promise.reject("E_SHARE_PDF", e.localizedMessage ?: "Error in PDF generation", e)
            }
        }
    }

    @ReactMethod
    fun openDatePicker(currentDateStr: String, promise: Promise) {
        val currentAct: Activity? = reactContext.currentActivity
        if (currentAct == null) {
            promise.reject("E_ACTIVITY_NULL", "Current Activity is null")
            return
        }

        Handler(Looper.getMainLooper()).post {
            try {
                val calendar = Calendar.getInstance()
                val parts = currentDateStr.split("/")
                if (parts.size == 3) {
                    val d = parts[0].trim().toIntOrNull() ?: calendar.get(Calendar.DAY_OF_MONTH)
                    val m = (parts[1].trim().toIntOrNull() ?: (calendar.get(Calendar.MONTH) + 1)) - 1
                    val y = parts[2].trim().toIntOrNull() ?: calendar.get(Calendar.YEAR)
                    calendar.set(y, m, d)
                }

                val year = calendar.get(Calendar.YEAR)
                val month = calendar.get(Calendar.MONTH)
                val day = calendar.get(Calendar.DAY_OF_MONTH)

                val dialog = DatePickerDialog(
                    currentAct,
                    { _, selectedYear, selectedMonth, selectedDay ->
                        val dd = String.format("%02d", selectedDay)
                        val mm = String.format("%02d", selectedMonth + 1)
                        val formatted = "$dd/$mm/$selectedYear"
                        promise.resolve(formatted)
                    },
                    year,
                    month,
                    day
                )

                dialog.setOnCancelListener {
                    promise.resolve(null)
                }

                dialog.show()
            } catch (e: Exception) {
                promise.reject("E_DATE_PICKER", e.localizedMessage ?: "Error opening date picker", e)
            }
        }
    }
}
