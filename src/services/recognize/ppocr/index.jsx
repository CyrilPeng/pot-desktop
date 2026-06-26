import { initPipeline, runPipeline, isModelReady, resetPipeline } from './pipeline';

export async function recognize(base64, language, options = {}) {
    const { config } = options;

    if (!config || !config.modelDir) {
        return Promise.reject('PP-OCR: Model directory not configured. Please download models first.');
    }

    try {
        await initPipeline(config.modelDir);
        return await runPipeline(base64, config);
    } catch (e) {
        // If model loading fails, reset so it retries next time
        resetPipeline();
        return Promise.reject(`PP-OCR Error: ${e.toString()}`);
    }
}

export { isModelReady, resetPipeline };

export * from './Config';
export * from './info';
