package com.leafdiseasedetector.tflite

import android.graphics.BitmapFactory
import android.graphics.Bitmap
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.io.FileInputStream
import java.nio.channels.FileChannel
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.IOException
import android.util.Log
import java.nio.MappedByteBuffer
import android.graphics.Canvas
import android.graphics.Paint
import android.util.Base64
import java.io.ByteArrayOutputStream

/**
 * React Native bridge module for running TensorFlow Lite models.
 *
 * Responsibilities:
 * - Load the crop classifier model (to identify crop type).
 * - Load multiple crop-specific disease detection models.
 * - Provide ReactMethods to run classification and inference from the JS/TS side.
 *
 * Supported crops: Apple, Corn, Grape, Potato, Tomato.
 */
class MyTFLiteModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    // ==== Interpreters for models ====
    private var leafClassifierTflite: Interpreter? = null
    private var appleDiseaseTflite: Interpreter? = null
    private var cornDiseaseTflite: Interpreter? = null
    private var grapeDiseaseTflite: Interpreter? = null
    private var potatoDiseaseTflite: Interpreter? = null
    private var tomatoDiseaseTflite: Interpreter? = null

    // ==== Label lists ====
    private var leafClassifierLabels: List<String> = emptyList()
    private var appleDiseaseLabels: List<String> = emptyList()
    private var cornDiseaseLabels: List<String> = emptyList()
    private var grapeDiseaseLabels: List<String> = emptyList()
    private var potatoDiseaseLabels: List<String> = emptyList()
    private var tomatoDiseaseLabels: List<String> = emptyList()

    // ==== Model input settings ====
    private val inputSize = 224
    private val pixelSize = 3
    private val numBytesPerChannel = 4 // Float32

    override fun getName(): String = "MyTFLiteModule"

    init {
        try {
            // Load crop classifier
            leafClassifierLabels = loadLabels("leaf_type_labels.txt")
            leafClassifierTflite = Interpreter(loadModelFile("leaf_type_classifier_MobileNetV3Large.tflite"))

            // Load crop-specific disease models
            appleDiseaseLabels = loadLabels("apple_disease_labels.txt")
            appleDiseaseTflite = Interpreter(loadModelFile("apple_disease_model_MobileNetV3Large.tflite"))

            cornDiseaseLabels = loadLabels("corn_disease_labels.txt")
            cornDiseaseTflite = Interpreter(loadModelFile("corn_disease_model_MobileNetV3Large.tflite"))

            grapeDiseaseLabels = loadLabels("grape_disease_labels.txt")
            grapeDiseaseTflite = Interpreter(loadModelFile("grape_disease_model_MobileNetV3Large.tflite"))

            potatoDiseaseLabels = loadLabels("potato_disease_labels.txt")
            potatoDiseaseTflite = Interpreter(loadModelFile("potato_disease_model_MobileNetV3Large.tflite"))

            tomatoDiseaseLabels = loadLabels("tomato_disease_labels.txt")
            tomatoDiseaseTflite = Interpreter(loadModelFile("tomato_disease_model_MobileNetV3Large.tflite"))

            Log.i("MyTFLiteModule", "✅ All models and labels loaded successfully.")
        } catch (e: Exception) {
            Log.e("MyTFLiteModule", "❌ Error loading TFLite models or labels: ${e.message}", e)
        }
    }

    private fun loadModelFile(filename: String): MappedByteBuffer {
        val fileDescriptor = reactApplicationContext.assets.openFd(filename)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, fileDescriptor.startOffset, fileDescriptor.declaredLength)
    }

    @Throws(IOException::class)
    private fun loadLabels(labelsPath: String): List<String> {
        val labels = mutableListOf<String>()
        val reader = BufferedReader(InputStreamReader(reactApplicationContext.assets.open(labelsPath)))
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            labels.add(line!!)
        }
        reader.close()
        return labels
    }

    private fun preprocessImage(imagePath: String): ByteBuffer {
        val bitmap =
            BitmapFactory.decodeFile(imagePath) ?: throw IllegalArgumentException("Failed to decode image: $imagePath")
        val resized = Bitmap.createScaledBitmap(bitmap, inputSize, inputSize, true)

        val inputBuffer = ByteBuffer.allocateDirect(1 * inputSize * inputSize * pixelSize * numBytesPerChannel)
        inputBuffer.order(ByteOrder.nativeOrder())

        for (y in 0 until inputSize) {
            for (x in 0 until inputSize) {
                val pixel = resized.getPixel(x, y)
                inputBuffer.putFloat(((pixel shr 16 and 0xFF).toFloat())) // R
                inputBuffer.putFloat(((pixel shr 8 and 0xFF).toFloat()))  // G
                inputBuffer.putFloat(((pixel and 0xFF).toFloat()))        // B
            }
        }
        return inputBuffer
    }

    private fun runModel(interpreter: Interpreter?, labels: List<String>, imagePath: String): WritableMap {
        val inputBuffer = preprocessImage(imagePath)
        val outputShape = interpreter!!.getOutputTensor(0).shape()
        val outputBuffer = Array(1) { FloatArray(outputShape[1]) }
        interpreter.run(inputBuffer, outputBuffer)

        val result = outputBuffer[0]
        val maxIdx = result.indices.maxByOrNull { result[it] } ?: -1
        val predictedLabel = labels.getOrNull(maxIdx) ?: "Unknown"
        val confidence = if (maxIdx != -1) result[maxIdx] else 0.0f

        return Arguments.createMap().apply {
            putString("label", predictedLabel)
            putDouble("confidence", confidence.toDouble())
        }
    }

    // =============== React Methods ===============
    @ReactMethod
    fun runCropClassifier(imagePath: String, promise: Promise) {
        try {
            if (leafClassifierTflite == null) {
                promise.reject("MODEL_ERROR", "Leaf Classifier not loaded.")
                return
            }
            promise.resolve(runModel(leafClassifierTflite, leafClassifierLabels, imagePath))
        } catch (e: Exception) {
            promise.reject("INFERENCE_ERROR", e.message)
        }
    }

    @ReactMethod fun runAppleDiseaseModel(imagePath: String, promise: Promise) =
        runDisease(promise, appleDiseaseTflite, appleDiseaseLabels, imagePath)

    @ReactMethod fun runCornDiseaseModel(imagePath: String, promise: Promise) =
        runDisease(promise, cornDiseaseTflite, cornDiseaseLabels, imagePath)

    @ReactMethod fun runGrapeDiseaseModel(imagePath: String, promise: Promise) =
        runDisease(promise, grapeDiseaseTflite, grapeDiseaseLabels, imagePath)

    @ReactMethod fun runPotatoDiseaseModel(imagePath: String, promise: Promise) =
        runDisease(promise, potatoDiseaseTflite, potatoDiseaseLabels, imagePath)

    @ReactMethod fun runTomatoDiseaseModel(imagePath: String, promise: Promise) =
        runDisease(promise, tomatoDiseaseTflite, tomatoDiseaseLabels, imagePath)

    private fun runDisease(promise: Promise, interpreter: Interpreter?, labels: List<String>, imagePath: String) {
        try {
            if (interpreter == null || labels.isEmpty()) {
                promise.reject("MODEL_ERROR", "Disease model not loaded.")
                return
            }
            promise.resolve(runModel(interpreter, labels, imagePath))
        } catch (e: Exception) {
            promise.reject("INFERENCE_ERROR", e.message)
        }
    }

    // ---------------- Grad-CAM Support ----------------

    private fun readNpyFromAssets(filename: String): FloatArray {
        val input = reactApplicationContext.assets.open(filename)
        val all = input.readBytes()
        input.close()

        val headerLen = (all[8].toInt() and 0xFF) or ((all[9].toInt() and 0xFF) shl 8)
        val headerEnd = 10 + headerLen
        if (!String(all, 10, headerLen, Charsets.ISO_8859_1).contains("f4")) {
            throw IOException("Unsupported dtype in $filename")
        }
        val bytesPer = 4
        val nElements = (all.size - headerEnd) / bytesPer
        val result = FloatArray(nElements)
        var idx = 0; var b = headerEnd
        while (b + 3 < all.size) {
            val bits = (all[b].toInt() and 0xFF) or ((all[b+1].toInt() and 0xFF) shl 8) or
                       ((all[b+2].toInt() and 0xFF) shl 16) or ((all[b+3].toInt() and 0xFF) shl 24)
            result[idx++] = Float.fromBits(bits)
            b += 4
        }
        return result
    }

    private fun createOutputArrayForShape(shape: IntArray): Any {
        return java.lang.reflect.Array.newInstance(Float::class.javaPrimitiveType, *shape)
    }

    private fun flattenFeatureMapsChannelLast(nested: Any, shape: IntArray): FloatArray {
        val batch = java.lang.reflect.Array.get(nested, 0)
        val H = shape[1]; val W = shape[2]; val C = shape[3]
        val out = FloatArray(H * W * C)
        var idx = 0
        for (y in 0 until H) {
            val row = java.lang.reflect.Array.get(batch, y)
            for (x in 0 until W) {
                val cell = java.lang.reflect.Array.get(row, x) as FloatArray
                for (c in 0 until C) out[idx++] = cell[c]
            }
        }
        return out
    }

    private fun computeHeatmapFromFeatureMaps(
        featureMaps: FloatArray, H: Int, W: Int, C: Int, classIndex: Int, numClasses: Int, classifierWeights: FloatArray
    ): FloatArray {
        val heat = FloatArray(H * W)
        var maxV = 1e-8f
        for (y in 0 until H) {
            for (x in 0 until W) {
                var s = 0f
                val base = (y * W + x) * C
                for (c in 0 until C) {
                    s += featureMaps[base + c] * classifierWeights[c * numClasses + classIndex]
                }
                val idx = y * W + x
                val relu = if (s > 0f) s else 0f
                heat[idx] = relu
                if (relu > maxV) maxV = relu
            }
        }
        if (maxV > 0f) for (i in heat.indices) heat[i] /= maxV
        return heat
    }

    private fun overlayHeatmapOnBitmap(bitmap: Bitmap, heatmap: FloatArray, H: Int, W: Int, alpha: Float = 0.45f): Bitmap {
        val bmHeat = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888)
        for (y in 0 until H) {
            for (x in 0 until W) {
                val v = (heatmap[y * W + x] * 255).toInt().coerceIn(0, 255)
                val color = (0x80 shl 24) or (v shl 16)
                bmHeat.setPixel(x, y, color)
            }
        }
        val bmHeatScaled = Bitmap.createScaledBitmap(bmHeat, bitmap.width, bitmap.height, true)
        val combined = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(combined); val paint = Paint()
        canvas.drawBitmap(bitmap, 0f, 0f, null)
        paint.alpha = (255 * alpha).toInt()
        canvas.drawBitmap(bmHeatScaled, 0f, 0f, paint)
        return combined
    }

    private fun bitmapToBase64Png(bmp: Bitmap): String {
        val baos = ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.PNG, 90, baos)
        return Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
    }

    private fun runModelWithGradCam(
        interpreter: Interpreter,
        labels: List<String>,
        imagePath: String,
        weightsAssetName: String,
        biasAssetName: String? = null
    ): WritableMap {
        val inputBuffer = preprocessImage(imagePath)

        val outputCount = interpreter.outputTensorCount
        val outShapes = (0 until outputCount).map { interpreter.getOutputTensor(it).shape() }

        val outputsMap = HashMap<Int, Any>()
        for (i in 0 until outputCount) {
            outputsMap[i] = createOutputArrayForShape(outShapes[i])
        }
        interpreter.runForMultipleInputsOutputs(arrayOf<Any>(inputBuffer), outputsMap)

        var fmapIndex = -1; var logitsIndex = -1
        var fmapShape: IntArray? = null; var logitsShape: IntArray? = null
        for ((i, s) in outShapes.withIndex()) {
            if (s.size == 4) { fmapIndex = i; fmapShape = s }
            else if (s.size == 2) { logitsIndex = i; logitsShape = s }
        }
        if (fmapIndex < 0 || logitsIndex < 0) throw RuntimeException("Could not find outputs")

        val logitsObj = outputsMap[logitsIndex] ?: throw RuntimeException("Logits missing")
        val logitsAny = java.lang.reflect.Array.get(logitsObj, 0)
        val logits: FloatArray = logitsAny as? FloatArray
            ?: throw RuntimeException("Unexpected logits type: ${logitsAny?.javaClass}")

        // softmax
        val maxLog = logits.maxOrNull() ?: 0f
        val exps = FloatArray(logits.size); var sum = 0.0
        for (i in logits.indices) { exps[i] = Math.exp((logits[i] - maxLog).toDouble()).toFloat(); sum += exps[i] }
        val probs = FloatArray(logits.size)
        for (i in probs.indices) probs[i] = (exps[i] / sum).toFloat()
        val predIdx = probs.indices.maxByOrNull { probs[it] } ?: -1
        val predLabel = if (predIdx >= 0 && predIdx < labels.size) labels[predIdx] else "Unknown"
        val confidence = if (predIdx >= 0) probs[predIdx] else 0f

        val fmapObj = outputsMap[fmapIndex] ?: throw RuntimeException("Feature maps missing")
        val fmapFlat = flattenFeatureMapsChannelLast(fmapObj, fmapShape!!)

        val classifierWeights = readNpyFromAssets(weightsAssetName)
        val numClasses = logits.size
        val heatmap = computeHeatmapFromFeatureMaps(fmapFlat, fmapShape!![1], fmapShape!![2], fmapShape!![3], predIdx, numClasses, classifierWeights)

        val origBmp = BitmapFactory.decodeFile(imagePath) ?: throw IllegalArgumentException("Failed to decode image")
        val resizedOrig = Bitmap.createScaledBitmap(origBmp, inputSize, inputSize, true)
        val overlay = overlayHeatmapOnBitmap(resizedOrig, heatmap, fmapShape!![1], fmapShape!![2], 0.45f)

        return Arguments.createMap().apply {
            putString("label", predLabel)
            putDouble("confidence", confidence.toDouble())
            putString("heatmap_base64", bitmapToBase64Png(overlay))
        }
    }

    @ReactMethod
    fun runAppleDiseaseModelWithGradCAM(imagePath: String, promise: Promise) {
        try {
            val modelBuffer = loadModelFile("apple_two_output_MobileNetV3Large.tflite")
            val dualInterp = Interpreter(modelBuffer)
            if (appleDiseaseLabels.isEmpty()) {
                promise.reject("MODEL_ERROR", "Apple disease labels not loaded"); return
            }
            val outMap = runModelWithGradCam(dualInterp, appleDiseaseLabels, imagePath, "apple_classifier_weights.npy", "apple_classifier_bias.npy")
            promise.resolve(outMap)
        } catch (e: Exception) {
            promise.reject("INFERENCE_ERROR", e.message)
        }
    }
}
