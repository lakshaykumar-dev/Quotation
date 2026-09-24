package com.mobile

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.WebView
import android.webkit.WebViewClient
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

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
}
