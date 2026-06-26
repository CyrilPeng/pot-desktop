import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { Button, Input, Switch, Card, CardBody, Progress } from '@nextui-org/react';
import { resourceDir, join } from '@tauri-apps/api/path';
import { createDir, exists, writeBinaryFile } from '@tauri-apps/api/fs';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';

import { useToastStyle } from '../../../hooks';
import { useConfig } from '../../../hooks/useConfig';
import { isModelReady, resetPipeline } from './pipeline';

// Model download sources from ModelScope (domestic CDN, fast in China)
const MODEL_SOURCES = {
    det: {
        url: 'https://modelscope.cn/models/PaddlePaddle/PP-OCRv6_medium_det_onnx/resolve/master/inference.onnx',
        filename: 'ppocrv6_det.onnx',
    },
    rec: {
        url: 'https://modelscope.cn/models/PaddlePaddle/PP-OCRv6_medium_rec_onnx/resolve/master/inference.onnx',
        filename: 'ppocrv6_rec.onnx',
    },
    dict: {
        url: 'https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/ppocr/utils/ppocr_keys_v1.txt',
        filename: 'ppocr_keys_v1.txt',
    },
};

// CLS model is optional and not yet available as ONNX on ModelScope.
// When enableCls is true but cls model is not found, it will be skipped gracefully.

export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [config, setConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.recognize.ppocr.title'),
            modelDir: '',
            enableCls: false,
            detLimitSideLen: 960,
        },
        { sync: false }
    );

    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState('');
    const [modelStatus, setModelStatus] = useState('unknown');

    const toastStyle = useToastStyle();

    // Check model status on mount and when modelDir changes
    useEffect(() => {
        async function checkModel() {
            if (!config || !config.modelDir) {
                // Set default model dir to app install location
                try {
                    let appDir = await resourceDir();
                    // Remove Windows extended-length path prefix \\?\
                    appDir = appDir.replace(/^\\\\\\?\\/, '');
                    const defaultDir = await join(appDir, 'models', 'ppocr');
                    setConfig({ ...config, modelDir: defaultDir });
                } catch {
                    // ignore
                }
                setModelStatus('not_downloaded');
                return;
            }
            const detExists = await exists(`${config.modelDir}/ppocrv6_det.onnx`);
            const recExists = await exists(`${config.modelDir}/ppocrv6_rec.onnx`);
            setModelStatus(detExists && recExists ? 'ready' : 'not_downloaded');
        }
        checkModel();
    }, [config?.modelDir]);

    async function downloadModels() {
        setIsDownloading(true);
        setDownloadProgress(0);

        const sources = Object.values(MODEL_SOURCES);
        const totalFiles = sources.length;

        try {
            // Ensure model directory exists
            const dirExists = await exists(config.modelDir);
            if (!dirExists) {
                await createDir(config.modelDir, { recursive: true });
            }

            for (let i = 0; i < totalFiles; i++) {
                const { url, filename } = sources[i];
                setDownloadStatus(`${t('services.recognize.ppocr.downloading')} ${filename} (${i + 1}/${totalFiles})`);

                const res = await window.fetch(url, { redirect: 'follow' });
                if (!res.ok) {
                    throw new Error(`Failed to download ${filename}: HTTP ${res.status}`);
                }

                const reader = res.body.getReader();
                const contentLength = parseInt(res.headers.get('content-length') || '0');
                const chunks = [];
                let receivedLength = 0;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    receivedLength += value.length;
                    if (contentLength > 0) {
                        const fileProgress = receivedLength / contentLength;
                        const totalProgress = ((i + fileProgress) / totalFiles) * 100;
                        setDownloadProgress(Math.round(totalProgress));
                    }
                }

                // Concatenate chunks into single Uint8Array
                const buffer = new Uint8Array(receivedLength);
                let offset = 0;
                for (const chunk of chunks) {
                    buffer.set(chunk, offset);
                    offset += chunk.length;
                }

                const filePath = await join(config.modelDir, filename);
                await writeBinaryFile(filePath, buffer);
            }

            setDownloadProgress(100);
            setDownloadStatus(t('services.recognize.ppocr.download_complete'));
            setModelStatus('ready');
            resetPipeline();
            toast.success(t('services.recognize.ppocr.download_complete'), { style: toastStyle });
        } catch (e) {
            setDownloadStatus(t('services.recognize.ppocr.download_failed'));
            toast.error(t('services.recognize.ppocr.download_failed') + ': ' + e.toString(), { style: toastStyle });
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        config !== null && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (modelStatus !== 'ready') {
                        toast.error(t('services.recognize.ppocr.model_not_ready'), { style: toastStyle });
                        return;
                    }
                    setIsLoading(true);
                    setConfig(config, true);
                    updateServiceList(instanceKey);
                    setIsLoading(false);
                    onClose();
                }}
            >
                <Toaster />

                {/* Instance Name */}
                <div className='config-item'>
                    <Input
                        label={t('services.instance_name')}
                        labelPlacement='outside-left'
                        value={config[INSTANCE_NAME_CONFIG_KEY]}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            setConfig({
                                ...config,
                                [INSTANCE_NAME_CONFIG_KEY]: value,
                            });
                        }}
                    />
                </div>

                {/* Model Status */}
                <Card
                    isBlurred
                    className={`border-none ${
                        modelStatus === 'ready'
                            ? 'bg-success/20 dark:bg-success/10'
                            : 'bg-warning/20 dark:bg-warning/10'
                    }`}
                    shadow='sm'
                >
                    <CardBody>
                        <div className='flex items-center justify-between'>
                            <span>
                                {modelStatus === 'ready'
                                    ? t('services.recognize.ppocr.model_ready')
                                    : t('services.recognize.ppocr.model_not_ready')}
                            </span>
                        </div>
                    </CardBody>
                </Card>

                {/* Model Directory */}
                <div className='config-item'>
                    <Input
                        label={t('services.recognize.ppocr.model_dir')}
                        labelPlacement='outside-left'
                        value={config.modelDir}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            setConfig({ ...config, modelDir: value });
                            resetPipeline();
                        }}
                    />
                </div>

                {/* Download Button */}
                <div className='config-item'>
                    <Button
                        fullWidth
                        color='warning'
                        isLoading={isDownloading}
                        onPress={downloadModels}
                    >
                        {t('services.recognize.ppocr.download')}
                    </Button>
                </div>

                {/* Download Progress */}
                {isDownloading && (
                    <div className='my-2'>
                        <Progress
                            value={downloadProgress}
                            color='primary'
                            className='mb-1'
                        />
                        <p className='text-xs text-default-500'>{downloadStatus}</p>
                    </div>
                )}

                {/* Enable CLS */}
                <div className='config-item'>
                    <Switch
                        isSelected={config.enableCls}
                        onValueChange={(value) => {
                            setConfig({ ...config, enableCls: value });
                        }}
                        classNames={{
                            base: 'flex flex-row-reverse justify-between w-full max-w-full',
                        }}
                    >
                        {t('services.recognize.ppocr.enable_cls')}
                    </Switch>
                </div>

                {/* Detection Limit Side Length */}
                <div className='config-item'>
                    <Input
                        label={t('services.recognize.ppocr.det_limit')}
                        labelPlacement='outside-left'
                        type='number'
                        value={String(config.detLimitSideLen)}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            setConfig({ ...config, detLimitSideLen: parseInt(value) || 960 });
                        }}
                    />
                </div>

                <br />
                <Button
                    type='submit'
                    isLoading={isLoading}
                    color='primary'
                    fullWidth
                >
                    {t('common.save')}
                </Button>
            </form>
        )
    );
}
