const axios = require('axios');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();

const corsOptions = {
    origin: '*', 
    methods: 'POST', 
    credentials: true, 
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(bodyParser.json());

app.get('/', (req, res) => {
    fs.readFile(path.join(__dirname, '../web/index.html'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.send(data);
    });
    return;
});

app.get('/avatar.png', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/avatar.png'));
});

app.get('/icon.png', (_, res) => {
    res.sendFile(path.join(__dirname, '../web/icon.png'));
});

app.get('/manifest.json', (_, res) => {
    res.sendFile(path.join(__dirname, '../web/manifest.json'));
});

app.get('/ping', (_, res) => {
    res.json({
        message: "pong"
    });
});

app.post('/v1/chat/completions', async (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    const originalRequest = req.body;
    const client = new Client("https://duckduckgo.com/duckchat/v1");
    try {
        const token = await initToken(client);
        const ddgRequest = ConvertAPIRequest(originalRequest);
        const response = await ddgReq(client, ddgRequest, token)
        if (Handle_request_error(res, response)) {
            return;
        }
        const responsePart = Handler(res, response, ddgRequest, originalRequest.stream);
        if (res.getHeader('Content-Type')) {
            return;
        }
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

class Client {
    axiosInstance;
    constructor(baseURL) {
        this.axiosInstance = axios.create({
            baseURL: baseURL,
            headers: {
                "Accept-Language": "zh-CN,zh;q=0.9",
                "origin": "https://duckduckgo.com/",
                "referer": "https://duckduckgo.com/",
                "sec-ch-ua": `"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"`,
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": `"Windows"`,
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
        });
        this.axiosInstance.interceptors.request.use(config => {
            delete config.headers['Connection'];
            return config;
        });
    }

    async request(method, endpoint, data, headers, responseType) {
        try {
            const config = {
                headers: {
                    ...headers,
                },
                responseType: responseType || "json",
            };
            let response;
            if (method === 'GET') {
                response = await this.axiosInstance.get(endpoint, config);
            } else if (method === 'POST') {
                response = await this.axiosInstance.post(endpoint, data, config);
            } else {
                throw new Error('Unsupported request method');
            }
            return response;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
}

async function initToken(client) {
    if (!global.Token) {
        global.Token = { token: "", expireAt: new Date(0) };
    }
    const now = new Date();
    if (!global.Token.token || global.Token.expireAt < now) {
        global.Token.token = await newToken(client);
        global.Token.expireAt = new Date(now.getTime() + 3 * 60 * 1000);
    }
    return global.Token.token;
}


async function newToken(client) {
    const response = await client.request('GET', '/status', undefined, {
        'accept': '*/*',
        'x-vqd-accept': '1'
    });
    const newToken = response.headers["x-vqd-4"];
    return newToken;
}

function ddgReq(client, data, token) {
    return client.request('POST', '/chat', JSON.stringify(data), {
        'x-vqd-4': token,
        'accept': 'text/event-stream',
        'content-type': 'application/json'
    }, "stream");
}

function Handle_request_error(res, response) {
    if (response.status !== 200) {
        const errorDetail = response.data?.detail || response.data || 'An error occurred';
        res.status(response.status).send(errorDetail);
        return true;
    }
    return false;
}

function Handler(res, response, oldRequest, stream) {
    if (stream) {
        res.type('text/event-stream');
    } else {
        res.type('application/json');
    }

    let previousText = '';

    function processResponseData(data) {
        data.split('\n').forEach((line) => {
            if (line.length < 6) {
                return;
            }
            line = line.slice(6);
            if (line !== "[DONE]") {
                const originalResponse = JSON.parse(line);
                if (originalResponse.action !== "success") {
                    res.status(500).send("Error");
                    return;
                }
                if (originalResponse.message) {
                    previousText += originalResponse.message;
                    const translatedResponse = NewChatCompletionChunkWithModel(originalResponse.message, originalResponse.model);
                    if (stream) {
                        const responseString = `data: ${JSON.stringify(translatedResponse)}\n\n`;
                        res.write(responseString);
                    }
                }
            } else {
                if (stream) {
                    res.write(`data: ${JSON.stringify(StopChunkWithModel("stop", oldRequest.model))}\n\n`);
                    res.end();
                } else {
                    res.json(NewChatCompletionWithModel(previousText, oldRequest.model));
                }
            }
        });
    }

    response.data.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        processResponseData(chunkStr);
    });

    return previousText;
}



function ConvertAPIRequest(api_request) {
    let inputModel = api_request.model;
    let realModel;
    switch (inputModel.toLowerCase()) {
        case "gpt-3.5":
            realModel = "gpt-4o-mini";
            break;
        case "claude-3-haiku":
            realModel = "claude-3-haiku-20240307";
            break;
        case "llama-3.1-70b":
            realModel = "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo";
            break;
        case "mixtral-8x7b":
            realModel = "mistralai/Mixtral-8x7B-Instruct-v0.1";
            break;
    }
    return {
        model: realModel || "gpt-4o-mini",
        messages: [{
            role: 'user',
            content: buildContent(api_request)
        }]
    };
}

function buildContent(apiRequest) {
    let content = '';

    for (const apiMessage of apiRequest.messages) {
        let role = apiMessage.role;

        if (role === "user" || role === "system" || role === "assistant") {
            if (role === "system") {
                role = "user";
            }
            let contentStr = '';
            if (Array.isArray(apiMessage.content)) {
                for (const element of apiMessage.content) {
                    if (typeof element === 'object' && element !== null && 'type' in element && 'text' in element) {
                        if (element.type === "text") {
                            contentStr = element.text;
                            break;
                        }
                    }
                }
            } else {
                contentStr = apiMessage.content;
            }

            content += `${role}:${contentStr};\r\n`;
        }
    }
    return content;
}


function NewChatCompletionChunkWithModel(text, model) {
    return {
        id: "chatcmpl-QXlha2FBbmROaXhpZUFyZUF3ZXNvbWUK",
        object: "chat.completion.chunk",
        created: 0,
        model,
        choices: [{
            index: 0,
            delta: {
                content: text
            },
            finish_reason: null
        }]
    };
}

function StopChunkWithModel(reason, model) {
    return {
        id: "chatcmpl-QXlha2FBbmROaXhpZUFyZUF3ZXNvbWUK",
        object: "chat.completion.chunk",
        created: 0,
        model,
        choices: [{
            index: 0,
            finish_reason: reason
        }]
    };
}


function NewChatCompletionWithModel(text, model) {
    return {
        id: "chatcmpl-QXlha2FBbmROaXhpZUFyZUF3ZXNvbWUK",
        object: "chat.completion",
        created: 0,
        model,
        usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
        },
        choices: [{
            message: {
                content: text,
                role: "assistant"
            },
            index: 0
        }]
    };
}

app.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
});

module.exports = app;