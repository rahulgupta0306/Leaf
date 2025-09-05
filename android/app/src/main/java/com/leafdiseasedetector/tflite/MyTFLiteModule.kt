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

    /**
     * Initialize all interpreters and load labels from assets.
     * This runs when the module is first loaded by React Native.
     */
    init {
        try {
            // Load crop classifier
            leafClassifierLabels = loadLabels("leaf_classifier_label.txt")
            leafClassifierTflite = Interpreter(loadModelFile("leaf_classifier_quant.tflite"))

            // Load crop-specific disease models
            appleDiseaseLabels = loadLabels("apple_disease_labels.txt")
            appleDiseaseTflite = Interpreter(loadModelFile("best_apple_disease_model_MobileNetV2.tflite"))

            cornDiseaseLabels = loadLabels("corn_disease_labels.txt")
            cornDiseaseTflite = Interpreter(loadModelFile("best_corn_disease_model_MobileNetV2.tflite"))

            grapeDiseaseLabels = loadLabels("grape_disease_labels.txt")
            grapeDiseaseTflite = Interpreter(loadModelFile("best_grape_disease_model_MobileNetV2.tflite"))

            potatoDiseaseLabels = loadLabels("potato_disease_labels.txt")
            potatoDiseaseTflite = Interpreter(loadModelFile("best_potato_disease_model_MobileNetV2.tflite"))

            tomatoDiseaseLabels = loadLabels("tomato_disease_labels.txt")
            tomatoDiseaseTflite = Interpreter(loadModelFile("best_tomato_disease_model_MobileNetV2.tflite"))

            Log.i("MyTFLiteModule", "✅ All models and labels loaded successfully.")
        } catch (e: Exception) {
            Log.e("MyTFLiteModule", "❌ Error loading TFLite models or labels: ${e.message}", e)
        }
    }

    /**
     * Load a TensorFlow Lite model file from the app's assets folder.
     *
     * @param filename Name of the `.tflite` file in the assets folder.
     * @return A memory-mapped buffer containing the model.
     */
    private fun loadModelFile(filename: String): MappedByteBuffer {
        val fileDescriptor = reactApplicationContext.assets.openFd(filename)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, fileDescriptor.startOffset, fileDescriptor.declaredLength)
    }

    /**
     * Load labels from a text file in the assets folder.
     *
     * @param labelsPath Path of the labels file (e.g. `apple_disease_labels.txt`).
     * @return A list of label strings.
     */
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

    /**
     * Preprocess an image for TensorFlow Lite input.
     * - Loads a bitmap from file.
     * - Resizes to [inputSize] x [inputSize].
     * - Normalizes pixels to [0, 1].
     *
     * @param imagePath Path to the image file.
     * @return A ByteBuffer containing the image data.
     */
    private fun preprocessImage(imagePath: String): ByteBuffer {
        val bitmap = BitmapFactory.decodeFile(imagePath)?: throw IllegalArgumentException("Failed to decode image: $imagePath")
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

    /**
     * Generic model runner for classification.
     *
     * @param interpreter The TensorFlow Lite interpreter.
     * @param labels The list of class labels.
     * @param imagePath Path to the image file.
     * @return A WritableMap with "label" and "confidence".
     */
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

    // ================== React Methods ==================

    /**
     * Run the crop classifier model to identify the crop type.
     *
     * @param imagePath Path to the image file.
     * @param promise A JS promise resolving with {label, confidence}.
     */
    @ReactMethod
    fun runCropClassifier(imagePath: String, promise: Promise) {
        try {
            if (leafClassifierTflite == null) {
                promise.reject(
                    "MODEL_ERROR",
                    "Leaf Classifier not loaded. Verify assets/leaf_classifier_quant.tflite and leaf_classifier_label.txt exist and are uncompressed."
                )
                return
            }
            promise.resolve(runModel(leafClassifierTflite, leafClassifierLabels, imagePath))
        } catch (e: Exception) {
            promise.reject("INFERENCE_ERROR", e.message)
        }
    }

    /**
     * Run the Apple Disease model to detect diseases in apple leaves.
     */
    @ReactMethod fun runAppleDiseaseModel(imagePath: String, promise: Promise) = runDisease(promise, appleDiseaseTflite, appleDiseaseLabels, imagePath)

    /**
     * Run the Corn Disease model to detect diseases in corn leaves.
     */
    @ReactMethod fun runCornDiseaseModel(imagePath: String, promise: Promise) = runDisease(promise, cornDiseaseTflite, cornDiseaseLabels, imagePath)

    /**
     * Run the Grape Disease model to detect diseases in grape leaves.
     */
    @ReactMethod fun runGrapeDiseaseModel(imagePath: String, promise: Promise) = runDisease(promise, grapeDiseaseTflite, grapeDiseaseLabels, imagePath)

    /**
     * Run the Potato Disease model to detect diseases in potato leaves.
     */
    @ReactMethod fun runPotatoDiseaseModel(imagePath: String, promise: Promise) = runDisease(promise, potatoDiseaseTflite, potatoDiseaseLabels, imagePath)

    /**
     * Run the Tomato Disease model to detect diseases in tomato leaves.
     */
    @ReactMethod fun runTomatoDiseaseModel(imagePath: String, promise: Promise) = runDisease(promise, tomatoDiseaseTflite, tomatoDiseaseLabels, imagePath)

    /**
     * Shared helper to execute disease classification models.
     *
     * @param promise JS promise to resolve with result.
     * @param interpreter TFLite interpreter for the crop.
     * @param labels List of disease labels.
     * @param imagePath Path to the image file.
     */
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
}
