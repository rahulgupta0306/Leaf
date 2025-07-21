package com.leafdiseasedetector.tflite

import android.graphics.BitmapFactory
import android.graphics.Bitmap
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.io.FileInputStream
import java.nio.channels.FileChannel

class MyTFLiteModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var tflite: Interpreter? = null

    override fun getName(): String {
        return "MyTFLiteModule"
    }

    init {
        val modelFile = loadModelFile("apple_disease_model.tflite")
        tflite = Interpreter(modelFile)
    }

    private fun loadModelFile(filename: String): ByteBuffer {
        val fileDescriptor = reactApplicationContext.assets.openFd(filename)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength

        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    @ReactMethod
    fun runModel(imagePath: String, promise: Promise) {
        try {
            val bitmap = BitmapFactory.decodeFile(imagePath)
            val resized = Bitmap.createScaledBitmap(bitmap, 224, 224, true)

            val inputBuffer = ByteBuffer.allocateDirect(4 * 224 * 224 * 3)
            inputBuffer.order(ByteOrder.nativeOrder())

            for (y in 0 until 224) {
                for (x in 0 until 224) {
                    val px = resized.getPixel(x, y)

                    inputBuffer.putFloat(((px shr 16 and 0xFF) / 255.0f))
                    inputBuffer.putFloat(((px shr 8 and 0xFF) / 255.0f))
                    inputBuffer.putFloat(((px and 0xFF) / 255.0f))
                }
            }

            val output = Array(1) { FloatArray(4) } // 4 classes
            tflite?.run(inputBuffer, output)

            val result = output[0]
            val maxIdx = result.indices.maxByOrNull { result[it] } ?: -1
            val label = when (maxIdx) {
                0 -> "Apple Scab"
                1 -> "Black Rot"
                2 -> "Cedar Apple Rust"
                3 -> "Healthy"
                else -> "Unknown"
            }

            val confidence = result[maxIdx]
            promise.resolve("$label (${(confidence * 100).toInt()}%)")
        } catch (e: Exception) {
            promise.reject("INFERENCE_ERROR", e.message)
        }
    }
}
