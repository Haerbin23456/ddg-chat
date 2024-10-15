<div align="center">
<img src="https://socialify.git.ci/leafmoes/DDG-Chat/image?font=Inter&forks=1&issues=1&logo=https%3A%2F%2Fduckduckgo.com%2Fassets%2Flogo_header.v109.svg&name=1&pattern=Plus&pulls=1&stargazers=1&theme=Auto" alt="DDG-Chat"/>

> 本项目为 [Duck2api](https://github.com/aurora-develop/Duck2api) 的 TypeScript 实现，解决了 Golang 版本在 Vercel 无法正常工作的 [Bug](https://github.com/vercel/go-bridge/issues/7).

一键免费部署到 Vercel 你的跨平台私人 ChatGPT 应用

支持 GPT4o mini, Claude 3 Haiku, Llama 3.1 70B, Mixtral 8x7B 模型

所有模型均由 DuckDuckGo 匿名提供

</div>

## 一键部署

<div align="center">

[<img src="https://vercel.com/button" alt="Deploy on Zeabur" height="30">](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fleafmoes%2Fddg-chat&project-name=ddg-chat&repository-name=ddg-chat)

</div>

## 网页端

请使用你自己部署后的 vercel 访问，暂不开设 Demo 站点。

## 调用接口

示例（其中 `example.com` 请替换为你自己部署后的域名）：

```bash
curl --request POST 'https://example.com/v1/chat/completions' \
  --header 'Content-Type: application/json' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "你好！"
      }
    ],
    "model": "gpt-4o-mini",
    "stream": true
  }'
```

## 支持的模型

该模型名称同步使用 DDG 网页抓包所得 (未知模型均会被重定向到 gpt-4o-mini 模型)

- gpt-4o-mini
- claude-3-haiku
- llama-3.1-70b
- mixtral-8x7b

## 交流群组

暂未开设，也没计划开设

## 贡献

欢迎大佬贡献！

# LICENSE

```
MIT License

Copyright (c) 2021 Spencer Woo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

