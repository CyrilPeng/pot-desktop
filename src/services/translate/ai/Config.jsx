import { Input, Button, Switch, Textarea, Card, CardBody } from '@nextui-org/react';
import { DropdownTrigger } from '@nextui-org/react';
import { MdDeleteOutline } from 'react-icons/md';
import { DropdownMenu } from '@nextui-org/react';
import { DropdownItem } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@nextui-org/react';
import React, { useState, useEffect } from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { useToastStyle } from '../../../hooks';
import { translate, ollamaAdapter } from './index';
import { Language } from './index';
import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';

const protocols = [
    { key: 'openai', label: 'OpenAI Compatible' },
    { key: 'anthropic', label: 'Anthropic' },
    { key: 'gemini', label: 'Google Gemini' },
    { key: 'ollama', label: 'Ollama' },
];

const defaultBaseUrl = {
    openai: 'https://api.openai.com',
    anthropic: 'https://api.anthropic.com',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash',
    ollama: 'http://localhost:11434',
};

const defaultRequestArguments = JSON.stringify(
    {
        temperature: 0.1,
        top_p: 0.99,
    },
    null,
    2
);

function getDefaultConfig(t) {
    return {
        [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.ai.title'),
        protocol: 'openai',
        baseUrl: defaultBaseUrl.openai,
        apiKey: '',
        model: 'gpt-4o-mini',
        stream: true,
        useAzure: false,
        promptList: [
            {
                role: 'system',
                content:
                    'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.',
            },
            { role: 'user', content: 'Translate into $to:\n"""\n$text\n"""' },
        ],
        requestArguments: defaultRequestArguments,
    };
}

export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [serviceConfig, setServiceConfig] = useConfig(instanceKey, getDefaultConfig(t), { sync: false });

    const [isLoading, setIsLoading] = useState(false);
    const [installedModels, setInstalledModels] = useState(null);
    const [pullingStatus, setPullingStatus] = useState('');
    const [pullProgress, setPullProgress] = useState(0);
    const [isPulling, setIsPulling] = useState(false);

    const toastStyle = useToastStyle();

    // Load Ollama models when protocol is ollama and baseUrl changes
    useEffect(() => {
        if (serviceConfig && serviceConfig.protocol === 'ollama') {
            ollamaAdapter
                .listModels(serviceConfig)
                .then((list) => setInstalledModels(list))
                .catch(() => setInstalledModels(null));
        }
    }, [serviceConfig?.protocol, serviceConfig?.baseUrl]);

    async function pullOllamaModel() {
        setIsPulling(true);
        setPullProgress(0);
        setPullingStatus('pulling...');
        try {
            await ollamaAdapter.pullModel(serviceConfig, serviceConfig.model, (part) => {
                if (part.digest && part.completed && part.total) {
                    setPullProgress(Math.round((part.completed / part.total) * 100));
                }
                if (part.status) {
                    setPullingStatus(part.status);
                }
            });
            setPullingStatus('');
            setPullProgress(0);
            setIsPulling(false);
            // Refresh model list
            const list = await ollamaAdapter.listModels(serviceConfig);
            setInstalledModels(list);
        } catch (e) {
            setIsPulling(false);
            setPullingStatus('');
            toast.error(t('config.service.test_failed') + e.toString(), { style: toastStyle });
        }
    }

    function updateConfig(partial) {
        const newConfig = { ...serviceConfig, ...partial };
        // Auto-fill baseUrl when protocol changes
        if (partial.protocol && partial.protocol !== serviceConfig.protocol) {
            if (!newConfig.baseUrl || newConfig.baseUrl === defaultBaseUrl[serviceConfig.protocol]) {
                newConfig.baseUrl = defaultBaseUrl[partial.protocol];
            }
        }
        setServiceConfig(newConfig);
    }

    return (
        serviceConfig !== null && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: serviceConfig }).then(
                        () => {
                            setIsLoading(false);
                            setServiceConfig(serviceConfig, true);
                            updateServiceList(instanceKey);
                            onClose();
                        },
                        (e) => {
                            setIsLoading(false);
                            toast.error(t('config.service.test_failed') + e.toString(), { style: toastStyle });
                        }
                    );
                }}
            >
                <Toaster />

                {/* Instance Name */}
                <div className='config-item'>
                    <Input
                        label={t('services.instance_name')}
                        labelPlacement='outside-left'
                        value={serviceConfig[INSTANCE_NAME_CONFIG_KEY]}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            updateConfig({ [INSTANCE_NAME_CONFIG_KEY]: value });
                        }}
                    />
                </div>

                {/* Protocol Selection */}
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.ai.protocol')}</h3>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant='bordered'>
                                {protocols.find((p) => p.key === serviceConfig.protocol)?.label ||
                                    serviceConfig.protocol}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            autoFocus='first'
                            aria-label='protocol'
                            onAction={(key) => {
                                updateConfig({ protocol: key });
                            }}
                        >
                            {protocols.map((p) => (
                                <DropdownItem key={p.key}>{p.label}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>

                {/* Azure toggle (only for OpenAI protocol) */}
                {serviceConfig.protocol === 'openai' && (
                    <div className='config-item'>
                        <Switch
                            isSelected={serviceConfig.useAzure}
                            onValueChange={(value) => {
                                updateConfig({ useAzure: value });
                            }}
                            classNames={{
                                base: 'flex flex-row-reverse justify-between w-full max-w-full',
                            }}
                        >
                            Azure API
                        </Switch>
                    </div>
                )}

                {/* Stream Toggle */}
                <div className='config-item'>
                    <Switch
                        isSelected={serviceConfig.stream}
                        onValueChange={(value) => {
                            updateConfig({ stream: value });
                        }}
                        classNames={{
                            base: 'flex flex-row-reverse justify-between w-full max-w-full',
                        }}
                    >
                        {t('services.translate.ai.stream')}
                    </Switch>
                </div>

                {/* Base URL */}
                <div className='config-item'>
                    <Input
                        label={t('services.translate.ai.base_url')}
                        labelPlacement='outside-left'
                        value={serviceConfig.baseUrl}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            updateConfig({ baseUrl: value });
                        }}
                    />
                </div>

                {/* API Key (hidden for Ollama) */}
                {serviceConfig.protocol !== 'ollama' && (
                    <div className='config-item'>
                        <Input
                            label={t('services.translate.ai.api_key')}
                            labelPlacement='outside-left'
                            type='password'
                            value={serviceConfig.apiKey}
                            variant='bordered'
                            classNames={{
                                base: 'justify-between',
                                label: 'text-[length:--nextui-font-size-medium]',
                                mainWrapper: 'max-w-[50%]',
                            }}
                            onValueChange={(value) => {
                                updateConfig({ apiKey: value });
                            }}
                        />
                    </div>
                )}

                {/* Model */}
                <div className='config-item'>
                    <Input
                        label={t('services.translate.ai.model')}
                        labelPlacement='outside-left'
                        value={serviceConfig.model}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            updateConfig({ model: value });
                        }}
                    />
                </div>

                {/* Ollama Model Status & Pull */}
                {serviceConfig.protocol === 'ollama' && installedModels && (
                    <Card
                        isBlurred
                        className={`border-none ${
                            installedModels.includes(serviceConfig.model)
                                ? 'bg-success/20 dark:bg-success/10'
                                : 'bg-warning/20 dark:bg-warning/10'
                        }`}
                        shadow='sm'
                    >
                        <CardBody>
                            {installedModels.includes(serviceConfig.model) ? (
                                <div className='flex items-center justify-between'>
                                    <span>{t('services.translate.ai.ready')}</span>
                                </div>
                            ) : (
                                <div className='flex flex-col gap-2'>
                                    <span>{t('services.translate.ai.not_installed')}</span>
                                    {isPulling ? (
                                        <div>
                                            <div className='text-sm text-default-500'>{pullingStatus}</div>
                                            {pullProgress > 0 && (
                                                <div className='w-full bg-default-200 rounded-full h-2 mt-1'>
                                                    <div
                                                        className='bg-primary h-2 rounded-full transition-all'
                                                        style={{ width: `${pullProgress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <Button
                                            size='sm'
                                            color='warning'
                                            onPress={pullOllamaModel}
                                        >
                                            {t('services.translate.ai.install_model')}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )}

                {/* Prompt List */}
                <h3 className='my-auto'>Prompt List</h3>
                <p className='text-[10px] text-default-700'>{t('services.translate.ai.prompt_description')}</p>

                <div className='bg-content2 rounded-[10px] p-3'>
                    {serviceConfig.promptList &&
                        serviceConfig.promptList.map((prompt, index) => {
                            return (
                                <div
                                    className='config-item'
                                    key={index}
                                >
                                    <Textarea
                                        label={prompt.role}
                                        labelPlacement='outside'
                                        variant='faded'
                                        value={prompt.content}
                                        placeholder={`Input Some ${prompt.role} Prompt`}
                                        onValueChange={(value) => {
                                            updateConfig({
                                                promptList: serviceConfig.promptList.map((p, i) => {
                                                    if (i === index) {
                                                        if (i === 0) {
                                                            return { role: 'system', content: value };
                                                        } else {
                                                            return {
                                                                role: index % 2 !== 0 ? 'user' : 'assistant',
                                                                content: value,
                                                            };
                                                        }
                                                    } else {
                                                        return p;
                                                    }
                                                }),
                                            });
                                        }}
                                    />
                                    <Button
                                        isIconOnly
                                        color='danger'
                                        className='my-auto mx-1'
                                        variant='flat'
                                        onPress={() => {
                                            updateConfig({
                                                promptList: serviceConfig.promptList.filter((_, i) => i !== index),
                                            });
                                        }}
                                    >
                                        <MdDeleteOutline className='text-[18px]' />
                                    </Button>
                                </div>
                            );
                        })}
                    <Button
                        fullWidth
                        onPress={() => {
                            updateConfig({
                                promptList: [
                                    ...serviceConfig.promptList,
                                    {
                                        role:
                                            serviceConfig.promptList.length === 0
                                                ? 'system'
                                                : serviceConfig.promptList.length % 2 === 0
                                                  ? 'assistant'
                                                  : 'user',
                                        content: '',
                                    },
                                ],
                            });
                        }}
                    >
                        {t('services.translate.ai.add')}
                    </Button>
                </div>

                {/* Request Arguments (only for OpenAI protocol) */}
                {serviceConfig.protocol === 'openai' && (
                    <>
                        <br />
                        <h3 className='my-auto'>{t('services.translate.ai.request_args')}</h3>
                        <div className='config-item'>
                            <Textarea
                                label=''
                                labelPlacement='outside'
                                variant='faded'
                                value={serviceConfig.requestArguments}
                                placeholder='{"temperature": 0.1, "top_p": 0.99}'
                                onValueChange={(value) => {
                                    updateConfig({ requestArguments: value });
                                }}
                            />
                        </div>
                    </>
                )}

                <br />
                <Button
                    type='submit'
                    isLoading={isLoading}
                    fullWidth
                    color='primary'
                >
                    {t('common.save')}
                </Button>
            </form>
        )
    );
}
