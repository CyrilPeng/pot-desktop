import { fetch, Body } from '@tauri-apps/api/http';
import { Ollama } from 'ollama/browser';
import { Language } from './info';

// ==================== Prompt Variable Substitution ====================

function substitutePrompt(promptList, text, from, to, detect) {
    return promptList.map((item) => ({
        ...item,
        content: item.content
            .replaceAll('$text', text)
            .replaceAll('$from', from)
            .replaceAll('$to', to)
            .replaceAll('$detect', Language[detect]),
    }));
}

// ==================== Protocol Adapters ====================

const openaiAdapter = {
    buildUrl(config) {
        let url = config.baseUrl.replace(/\/+$/, '');
        if (!url.includes('/chat/completions')) {
            url += '/v1/chat/completions';
        }
        return url;
    },

    buildHeaders(config) {
        const headers = { 'Content-Type': 'application/json' };
        if (config.apiKey) {
            if (config.useAzure) {
                headers['api-key'] = config.apiKey;
            } else {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }
        }
        return headers;
    },

    buildBody(config, messages) {
        let extraArgs = {};
        try {
            extraArgs = JSON.parse(config.requestArguments || '{}');
        } catch {
            // ignore invalid JSON
        }
        return {
            ...extraArgs,
            model: config.model,
            messages: messages,
            stream: !!config.stream,
        };
    },

    parseStreamData(text) {
        // SSE format: "data: {...}\n\n"
        const match = text.match(/"delta":\s*\{[^}]*"content":\s*"([^"]*)"/);
        return match ? match[1] : null;
    },

    parseResponse(data) {
        return data.choices?.[0]?.message?.content?.trim() || '';
    },
};

const anthropicAdapter = {
    buildUrl(config) {
        let url = config.baseUrl.replace(/\/+$/, '');
        if (!url.endsWith('/messages')) {
            url += '/v1/messages';
        }
        return url;
    },

    buildHeaders(config) {
        return {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey || '',
            'anthropic-version': '2023-06-01',
        };
    },

    buildBody(config, messages) {
        // Extract system message, rest are user/assistant messages
        const systemMsg = messages.find((m) => m.role === 'system');
        const chatMessages = messages.filter((m) => m.role !== 'system');

        const body = {
            model: config.model,
            max_tokens: 4096,
            messages: chatMessages,
            stream: !!config.stream,
        };
        if (systemMsg) {
            body.system = systemMsg.content;
        }
        return body;
    },

    parseStreamData(text) {
        const match = text.match(/"type":\s*"content_block_delta"[^}]*"text":\s*"([^"]*)"/);
        return match ? match[1] : null;
    },

    parseResponse(data) {
        return data.content?.[0]?.text?.trim() || '';
    },
};

const geminiAdapter = {
    buildUrl(config) {
        let url = config.baseUrl.replace(/\/+$/, '');
        if (config.stream) {
            return `${url}:streamGenerateContent?key=${config.apiKey}`;
        } else {
            return `${url}:generateContent?key=${config.apiKey}`;
        }
    },

    buildHeaders() {
        return { 'Content-Type': 'application/json' };
    },

    buildBody(config, messages) {
        // Gemini uses contents/parts format, no separate system field
        // Merge system message into user message
        const systemMsg = messages.find((m) => m.role === 'system');
        const chatMessages = messages.filter((m) => m.role !== 'system');

        // If there's a system message, prepend it to the first user message
        const contents = [];
        for (let i = 0; i < chatMessages.length; i++) {
            const msg = chatMessages[i];
            let text = msg.content;
            if (i === 0 && systemMsg) {
                text = systemMsg.content + '\n\n' + text;
            }
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text }],
            });
        }

        return {
            contents,
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
        };
    },

    parseStreamData(text) {
        const match = text.match(/"text":\s*"([^"]*)"/);
        return match ? match[1] : null;
    },

    parseResponse(data) {
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    },
};

const ollamaAdapter = {
    async translate(config, messages, setResult) {
        let host = config.baseUrl.replace(/\/+$/, '');
        if (!host) {
            host = 'http://localhost:11434';
        }
        const ollama = new Ollama({ host });
        const response = await ollama.chat({
            model: config.model,
            messages,
            stream: !!config.stream,
        });

        if (config.stream) {
            let target = '';
            for await (const part of response) {
                target += part.message.content;
                if (setResult) {
                    setResult(target + '_');
                }
            }
            return target.trim();
        } else {
            return response.message.content.trim();
        }
    },

    async listModels(config) {
        let host = config.baseUrl.replace(/\/+$/, '');
        if (!host) {
            host = 'http://localhost:11434';
        }
        const ollama = new Ollama({ host });
        const list = await ollama.list();
        return list.models.map((m) => m.name);
    },

    async pullModel(config, model, onProgress) {
        let host = config.baseUrl.replace(/\/+$/, '');
        if (!host) {
            host = 'http://localhost:11434';
        }
        const ollama = new Ollama({ host });
        const stream = await ollama.pull({ model, stream: true });
        for await (const part of stream) {
            if (onProgress) {
                onProgress(part);
            }
        }
    },
};

const adapters = {
    openai: openaiAdapter,
    anthropic: anthropicAdapter,
    gemini: geminiAdapter,
    ollama: ollamaAdapter,
};

// ==================== Main Translate Function ====================

export async function translate(text, from, to, options = {}) {
    const { config, setResult, detect } = options;
    const protocol = config.protocol || 'openai';
    const adapter = adapters[protocol];

    if (!adapter) {
        return Promise.reject(`Unsupported protocol: ${protocol}`);
    }

    const messages = substitutePrompt(config.promptList, text, from, to, detect);

    // Ollama uses SDK, handle separately
    if (protocol === 'ollama') {
        return adapter.translate(config, messages, setResult);
    }

    // HTTP-based protocols
    const url = adapter.buildUrl(config);
    const headers = adapter.buildHeaders(config);
    const body = adapter.buildBody(config, messages);

    if (config.stream) {
        const res = await window.fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw `Http Request Error\nHttp Status: ${res.status}\n${await res.text()}`;
        }

        let target = '';
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        try {
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;

                    const dataStr = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
                    try {
                        const data = JSON.parse(dataStr);
                        const content = adapter.parseStreamData
                            ? adapter.parseStreamData(JSON.stringify(data))
                            : null;
                        if (content !== null && content !== undefined) {
                            target += content;
                            if (setResult) {
                                setResult(target + '_');
                            }
                        } else {
                            // Try parseResponse as fallback for non-SSE streams
                            const fallback = adapter.parseResponse(data);
                            if (fallback) {
                                target += fallback;
                                if (setResult) {
                                    setResult(target + '_');
                                }
                            }
                        }
                    } catch {
                        // skip unparseable chunks
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
        return target.trim();
    } else {
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: Body.json(body),
        });
        if (!res.ok) {
            throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
        }
        return adapter.parseResponse(res.data);
    }
}

// Export Ollama utilities for Config.jsx
export { ollamaAdapter };

export * from './Config';
export * from './info';
