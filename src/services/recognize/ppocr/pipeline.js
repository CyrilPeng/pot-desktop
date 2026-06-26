import * as ort from 'onnxruntime-web';
import { readBinaryFile, readTextFile } from '@tauri-apps/api/fs';

// Configure WASM paths
ort.env.wasm.wasmPaths = '/static/';

// ==================== Model Session Cache ====================

let detSession = null;
let clsSession = null;
let recSession = null;
let dictionary = null;
let initializedModelDir = null;

async function loadOnnxModel(path) {
    const buffer = await readBinaryFile(path);
    return await ort.InferenceSession.create(buffer.buffer);
}

export async function initPipeline(modelDir) {
    if (initializedModelDir === modelDir && detSession) {
        return;
    }
    detSession = await loadOnnxModel(`${modelDir}/ppocrv6_det.onnx`);
    recSession = await loadOnnxModel(`${modelDir}/ppocrv6_rec.onnx`);
    dictionary = await loadDictionary(`${modelDir}/ppocr_keys_v6.txt`);
    // CLS model is optional (not yet available as ONNX)
    try {
        clsSession = await loadOnnxModel(`${modelDir}/ppocrv6_cls.onnx`);
    } catch {
        clsSession = null;
    }
    initializedModelDir = modelDir;
}

async function loadDictionary(path) {
    const text = await readTextFile(path);
    const lines = text.split('\n').map((l) => l.trim());
    // Add blank token at index 0 for CTC
    return ['', ...lines];
}

// ==================== Image Utilities ====================

export async function base64ToImageData(base64) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(ctx.getImageData(0, 0, img.width, img.height));
        };
        img.src = 'data:image/png;base64,' + base64;
    });
}

function imageDataToCanvas(imageData, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width || imageData.width;
    canvas.height = height || imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

// ==================== Preprocessing ====================

/**
 * Resize image for detection model while keeping aspect ratio.
 * PaddleOCR det model expects max side <= limitSideLen (default 960).
 */
function resizeForDet(imageData, limitSideLen = 960) {
    const { width, height } = imageData;
    const maxSide = Math.max(width, height);
    if (maxSide <= limitSideLen) {
        return { imageData, ratio: 1.0, newW: width, newH: height };
    }
    const ratio = limitSideLen / maxSide;
    const newW = Math.round(width / 32) * 32; // Must be multiple of 32
    const newH = Math.round(height / 32) * 32;
    const canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext('2d');
    const srcCanvas = imageDataToCanvas(imageData);
    ctx.drawImage(srcCanvas, 0, 0, newW, newH);
    return { imageData: ctx.getImageData(0, 0, newW, newH), ratio: maxSide / Math.max(newW, newH), newW, newH };
}

/**
 * Normalize image for detection: [0,255] → [0,1] → (x-mean)/std
 * PaddleOCR det uses mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]
 */
function normalizeDet(imageData) {
    const { width, height, data } = imageData;
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];
    const float32Data = new Float32Array(3 * height * width);
    for (let i = 0; i < height * width; i++) {
        for (let c = 0; c < 3; c++) {
            const val = data[i * 4 + c] / 255.0;
            float32Data[c * height * width + i] = (val - mean[c]) / std[c];
        }
    }
    return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
}

/**
 * Normalize image for recognition: resize to 48xN (N=max320), normalize to [-1,1]
 */
function normalizeRec(imageData, recImageShape = [3, 48, 320]) {
    const [, targetH, targetW] = recImageShape;
    const { width, height } = imageData;

    // Resize keeping aspect ratio, height = 48
    const ratio = targetH / height;
    let newW = Math.round(width * ratio);
    if (newW > targetW) newW = targetW;
    // Pad to targetW
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, targetW, targetH);
    const srcCanvas = imageDataToCanvas(imageData);
    ctx.drawImage(srcCanvas, 0, 0, newW, targetH);

    const resized = ctx.getImageData(0, 0, targetW, targetH);
    const { data } = resized;
    const float32Data = new Float32Array(3 * targetH * targetW);
    for (let i = 0; i < targetH * targetW; i++) {
        for (let c = 0; c < 3; c++) {
            float32Data[c * targetH * targetW + i] = (data[i * 4 + c] / 255.0 - 0.5) / 0.5;
        }
    }
    return { tensor: new ort.Tensor('float32', float32Data, [1, 3, targetH, targetW]), validWidth: newW };
}

/**
 * Normalize image for classification: resize to 48x192, normalize to [-1,1]
 */
function normalizeCls(imageData) {
    const targetH = 48;
    const targetW = 192;
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    const srcCanvas = imageDataToCanvas(imageData);
    ctx.drawImage(srcCanvas, 0, 0, targetW, targetH);
    const resized = ctx.getImageData(0, 0, targetW, targetH);
    const { data } = resized;
    const float32Data = new Float32Array(3 * targetH * targetW);
    for (let i = 0; i < targetH * targetW; i++) {
        for (let c = 0; c < 3; c++) {
            float32Data[c * targetH * targetW + i] = (data[i * 4 + c] / 255.0 - 0.5) / 0.5;
        }
    }
    return new ort.Tensor('float32', float32Data, [1, 3, targetH, targetW]);
}

// ==================== Postprocessing ====================

/**
 * Post-process detection output to get bounding boxes.
 * The det model outputs a probability map. We threshold and find contours.
 */
function postprocessDet(output, origW, origH, ratio, thresh = 0.3, minBoxSize = 5) {
    const data = output.data;
    const [_, h, w] = output.dims;

    // Threshold the probability map
    const binary = new Uint8Array(h * w);
    for (let i = 0; i < h * w; i++) {
        binary[i] = data[i] > thresh ? 255 : 0;
    }

    // Find bounding boxes from connected components (simplified)
    const boxes = findBoundingBoxes(binary, w, h, origW, origH, ratio, minBoxSize);
    return boxes;
}

/**
 * Simple bounding box extraction by scanning rows.
 * For production, use a proper connected component algorithm.
 */
function findBoundingBoxes(binary, w, h, origW, origH, ratio, minBoxSize) {
    const visited = new Uint8Array(h * w);
    const boxes = [];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (binary[y * w + x] === 255 && visited[y * w + x] === 0) {
                // BFS to find connected component
                let minX = x, maxX = x, minY = y, maxY = y;
                const queue = [[x, y]];
                visited[y * w + x] = 1;
                let head = 0;

                while (head < queue.length) {
                    const [cx, cy] = queue[head++];
                    minX = Math.min(minX, cx);
                    maxX = Math.max(maxX, cx);
                    minY = Math.min(minY, cy);
                    maxY = Math.max(maxY, cy);

                    // 4-connected neighbors
                    const neighbors = [
                        [cx - 1, cy], [cx + 1, cy],
                        [cx, cy - 1], [cx, cy + 1],
                    ];
                    for (const [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h && binary[ny * w + nx] === 255 && visited[ny * w + nx] === 0) {
                            visited[ny * w + nx] = 1;
                            queue.push([nx, ny]);
                        }
                    }
                }

                const boxW = maxX - minX;
                const boxH = maxY - minY;
                if (boxW > minBoxSize && boxH > minBoxSize) {
                    // Scale back to original image coordinates
                    boxes.push([
                        [Math.round(minX * ratio), Math.round(minY * ratio)],
                        [Math.round(maxX * ratio), Math.round(minY * ratio)],
                        [Math.round(maxX * ratio), Math.round(maxY * ratio)],
                        [Math.round(minX * ratio), Math.round(maxY * ratio)],
                    ]);
                }
            }
        }
    }

    return boxes;
}

/**
 * Crop a quadrilateral region from image data using perspective transform.
 * For axis-aligned boxes, this simplifies to a rectangular crop.
 */
function cropByBox(imageData, box) {
    // Use bounding rectangle for simplicity (box is axis-aligned for our det output)
    const minX = Math.min(box[0][0], box[1][0], box[2][0], box[3][0]);
    const maxX = Math.max(box[0][0], box[1][0], box[2][0], box[3][0]);
    const minY = Math.min(box[0][1], box[1][1], box[2][1], box[3][1]);
    const maxY = Math.max(box[0][1], box[1][1], box[2][1], box[3][1]);

    const cropW = Math.max(1, maxX - minX);
    const cropH = Math.max(1, maxY - minY);

    const srcCanvas = imageDataToCanvas(imageData);
    const canvas = document.createElement('canvas');
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(srcCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    return ctx.getImageData(0, 0, cropW, cropH);
}

/**
 * Rotate image 180 degrees.
 */
function rotate180(imageData) {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(data.length);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const dstIdx = ((height - 1 - y) * width + (width - 1 - x)) * 4;
            newData[dstIdx] = data[srcIdx];
            newData[dstIdx + 1] = data[srcIdx + 1];
            newData[dstIdx + 2] = data[srcIdx + 2];
            newData[dstIdx + 3] = data[srcIdx + 3];
        }
    }
    return new ImageData(newData, width, height);
}

/**
 * CTC greedy decode: convert token ID sequence to text.
 */
function ctcDecode(preds, dictionary, blankIdx = 0) {
    const [batch, seqLen, vocabSize] = preds.dims;
    const data = preds.data;
    let text = '';
    let lastIdx = blankIdx;

    for (let t = 0; t < seqLen; t++) {
        // Find argmax at this timestep
        let maxIdx = 0;
        let maxVal = -Infinity;
        for (let v = 0; v < vocabSize; v++) {
            const val = data[t * vocabSize + v];
            if (val > maxVal) {
                maxVal = val;
                maxIdx = v;
            }
        }

        // CTC: skip blank and repeated tokens
        if (maxIdx !== blankIdx && maxIdx !== lastIdx) {
            if (maxIdx < dictionary.length) {
                text += dictionary[maxIdx];
            }
        }
        lastIdx = maxIdx;
    }

    return text;
}

// ==================== Pipeline Stages ====================

async function runDet(imageData, limitSideLen = 960) {
    const { imageData: resized, ratio, newW, newH } = resizeForDet(imageData, limitSideLen);
    const tensor = normalizeDet(resized);
    const inputName = detSession.inputNames[0];
    const result = await detSession.run({ [inputName]: tensor });
    const outputName = detSession.outputNames[0];
    const output = result[outputName];
    return postprocessDet(output, imageData.width, imageData.height, ratio);
}

async function runCls(imageData) {
    const tensor = normalizeCls(imageData);
    const inputName = clsSession.inputNames[0];
    const result = await clsSession.run({ [inputName]: tensor });
    const outputName = clsSession.outputNames[0];
    const output = result[outputName];
    // output shape: [1, 2] — [score_0, score_180]
    const score0 = output.data[0];
    const score180 = output.data[1];
    return score180 > score0 ? 180 : 0;
}

async function runRec(imageData) {
    const { tensor, validWidth } = normalizeRec(imageData);
    const inputName = recSession.inputNames[0];
    const result = await recSession.run({ [inputName]: tensor });
    const outputName = recSession.outputNames[0];
    const output = result[outputName];
    return ctcDecode(output, dictionary);
}

// ==================== Full Pipeline ====================

export async function runPipeline(base64, config = {}) {
    const { detLimitSideLen = 960, enableCls = true } = config;

    const imageData = await base64ToImageData(base64);

    // Stage 1: Text Detection
    const boxes = await runDet(imageData, detLimitSideLen);

    if (boxes.length === 0) {
        return '';
    }

    // Sort boxes by vertical position (top to bottom), then left to right
    boxes.sort((a, b) => {
        const yDiff = a[0][1] - b[0][1];
        if (Math.abs(yDiff) > 10) return yDiff;
        return a[0][0] - b[0][0];
    });

    const results = [];
    for (const box of boxes) {
        let cropped = cropByBox(imageData, box);

        // Stage 2: Direction Classification
        if (enableCls && clsSession) {
            const angle = await runCls(cropped);
            if (angle === 180) {
                cropped = rotate180(cropped);
            }
        }

        // Stage 3: Text Recognition
        const text = await runRec(cropped);
        if (text.trim().length > 0) {
            results.push(text.trim());
        }
    }

    return results.join('\n');
}

// ==================== Model Status Check ====================

export function isModelReady() {
    return detSession !== null && recSession !== null && dictionary !== null;
}

export function resetPipeline() {
    detSession = null;
    clsSession = null;
    recSession = null;
    dictionary = null;
    initializedModelDir = null;
}
