package android.print

import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import java.io.File

class PdfPrint(private val printAttributes: PrintAttributes) {

    interface Callback {
        fun onSuccess(file: File)
        fun onFailure(error: Throwable)
    }

    fun print(printAdapter: PrintDocumentAdapter, path: File, fileName: String, callback: Callback) {
        printAdapter.onLayout(
            null,
            printAttributes,
            null,
            object : PrintDocumentAdapter.LayoutResultCallback() {
                override fun onLayoutFinished(info: PrintDocumentInfo, changed: Boolean) {
                    try {
                        if (!path.exists()) {
                            path.mkdirs()
                        }
                        val file = File(path, fileName)
                        if (file.exists()) {
                            file.delete()
                        }
                        file.createNewFile()
                        val pfd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_WRITE)

                        printAdapter.onWrite(
                            arrayOf(PageRange.ALL_PAGES),
                            pfd,
                            CancellationSignal(),
                            object : PrintDocumentAdapter.WriteResultCallback() {
                                override fun onWriteFinished(pages: Array<out PageRange>?) {
                                    super.onWriteFinished(pages)
                                    try {
                                        pfd.close()
                                    } catch (ignored: Exception) {}
                                    callback.onSuccess(file)
                                }

                                override fun onWriteFailed(error: CharSequence?) {
                                    super.onWriteFailed(error)
                                    try {
                                        pfd.close()
                                    } catch (ignored: Exception) {}
                                    callback.onFailure(Exception(error?.toString() ?: "PDF write failed"))
                                }

                                override fun onWriteCancelled() {
                                    super.onWriteCancelled()
                                    try {
                                        pfd.close()
                                    } catch (ignored: Exception) {}
                                    callback.onFailure(Exception("PDF write cancelled"))
                                }
                            }
                        )
                    } catch (e: Exception) {
                        callback.onFailure(e)
                    }
                }

                override fun onLayoutFailed(error: CharSequence?) {
                    super.onLayoutFailed(error)
                    callback.onFailure(Exception(error?.toString() ?: "PDF layout failed"))
                }

                override fun onLayoutCancelled() {
                    super.onLayoutCancelled()
                    callback.onFailure(Exception("PDF layout cancelled"))
                }
            },
            null
        )
    }
}
