<img width="200px" src="public/icon.svg" align="left"/>

# Pot (派了个萌的翻译器)

> 🌈 一个跨平台的划词翻译软件

![License](https://img.shields.io/github/license/CyrilPeng/pot-desktop.svg)
![Tauri](https://img.shields.io/badge/Tauri-1.6.8-blue?logo=tauri)
![JavaScript](https://img.shields.io/badge/-JavaScript-yellow?logo=javascript&logoColor=white)
![Rust](https://img.shields.io/badge/-Rust-orange?logo=rust&logoColor=white)
![Windows](https://img.shields.io/badge/-Windows-blue?logo=windows&logoColor=white)
![MacOS](https://img.shields.io/badge/-macOS-black?&logo=apple&logoColor=white)
![Linux](https://img.shields.io/badge/-Linux-yellow?logo=linux&logoColor=white)

<br/>
<hr/>
<div align="center">

<h3>中文 | <a href='./README_EN.md'>English</a> | <a href='./README_KR.md'> 한글 </a></h3>

<table>
<tr>
    <td> <img src="asset/1.png">
    <td> <img src="asset/2.png">
    <td> <img src="asset/3.png">
</table>

# 目录

</div>

-   [使用说明](#使用说明)
-   [特色功能](#特色功能)
-   [支持接口](#支持接口)
-   [插件系统](#插件系统)
-   [安装](#安装)
-   [外部调用](#外部调用)
-   [Wayland 支持](#wayland-支持)

<div align="center">

# 使用说明

</div>

| 划词翻译                                             | 输入翻译                                                       | 外部调用                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| 鼠标选中需要翻译的文本，按下设置的划词翻译快捷键即可 | 按下输入翻译快捷键呼出翻译窗口，输入待翻译文本后按下 回车 翻译 | 通过被其他软件调用实现更加方便高效的功能, 详见 [外部调用](#外部调用) |
| <img src="asset/eg1.gif"/>                           | <img src="asset/eg2.gif"/>                                     | <img src="asset/eg3.gif"/>                                           |

| 剪切板监听模式                                                         | 截图 OCR                                          | 截图翻译                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| 在任意翻译面板上点击左上角图标启动剪切板监听默认，复制文字即可完成翻译 | 按下截图 OCR 快捷键后框选需要识别区域即可完成识别 | 按下截图翻译快捷键后框选需要识别区域即可完成翻译 |
| <img src="asset/eg4.gif"/>                                             | <img src="asset/eg5.gif"/>                        | <img src="asset/eg6.gif"/>                       |

</div>

<div align="center">

# 特色功能

</div>

-   [x] 多接口并行翻译 ([支持接口](#支持接口))
-   [x] 多接口文字识别 ([支持接口](#支持接口))
-   [x] 多接口语音合成 ([支持接口](#支持接口))
-   [x] 导出到生词本 ([支持接口](#支持接口))
-   [x] 外部调用 ([详情](#外部调用))
-   [x] 支持插件系统 ([插件系统](#插件系统))
-   [x] 支持所有 PC 平台 (Windows, macOS, Linux)
-   [x] 支持 Wayland (在 KDE、Gnome 以及 Hyprland 上测试)
-   [x] 多语言支持

<div align="center">

# 支持接口

</div>

## 翻译

-   [x] AI 翻译（支持 OpenAI Compatible、Anthropic、Gemini、Ollama）
-   [x] [阿里翻译](https://www.aliyun.com/product/ai/alimt)
-   [x] [百度翻译](https://fanyi.baidu.com/)
-   [x] [彩云小译](https://fanyi.caiyunapp.com/)
-   [x] [腾讯翻译君](https://fanyi.qq.com/)
-   [x] [腾讯交互翻译](https://transmart.qq.com/)
-   [x] [火山翻译](https://translate.volcengine.com/)
-   [x] [小牛翻译](https://niutrans.com/)
-   [x] [Google](https://translate.google.com)
-   [x] [Bing](https://learn.microsoft.com/zh-cn/azure/cognitive-services/translator/)
-   [x] [Bing 词典](https://www.bing.com/dict)
-   [x] [DeepL](https://www.deepl.com/)
-   [x] [有道翻译](https://ai.youdao.com/)
-   [x] [剑桥词典](https://dictionary.cambridge.org/)
-   [x] [Yandex](https://translate.yandex.com/)

更多接口支持见 [插件系统](#插件系统)

## 文字识别

-   [x] 系统 OCR (离线)
    -   [x] [Windows.Media.OCR](https://learn.microsoft.com/en-us/uwp/api/windows.media.ocr.ocrengine?view=winrt-22621) on Windows
    -   [x] [Apple Vision Framework](https://developer.apple.com/documentation/vision/recognizing_text_in_images) on MacOS
    -   [x] [Tesseract OCR](https://github.com/tesseract-ocr) on Linux
-   [x] [Tesseract.js](https://tesseract.projectnaptha.com/) (离线)
-   [x] [百度](https://ai.baidu.com/tech/ocr/general)
-   [x] [腾讯](https://cloud.tencent.com/product/ocr-catalog)
-   [x] [火山](https://www.volcengine.com/product/OCR)
-   [x] [迅飞](https://www.xfyun.cn/services/common-ocr)
-   [x] [腾讯图片翻译](https://cloud.tencent.com/document/product/551/17232)
-   [x] [百度图片翻译](https://fanyi-api.baidu.com/product/22)
-   [x] [Simple LaTeX](https://simpletex.cn/)
-   [x] 二维码识别

更多接口支持见 [插件系统](#插件系统)

## 语音合成

-   [x] [Lingva](https://github.com/thedaviddelta/lingva-translate)

## 生词本

-   [x] [Anki](https://apps.ankiweb.net/)
-   [x] [欧路词典](https://dict.eudic.net/)

<div align="center">

# 插件系统

</div>

软件内置接口数量有限，但是您可以通过插件系统来扩展软件的功能。

## 插件安装

在 偏好设置-服务设置-添加外部插件-安装外部插件 选择对应的 `.potext` 文件即可安装成功，添加到服务列表中即可像内置服务一样正常使用了。

## 插件开发

各种插件的开发模板和文档请查看对应的模板仓库。

<div align="center">

# 安装

</div>

前往 [Release](https://github.com/CyrilPeng/pot-desktop/releases/latest) 页面下载对应平台的安装包：

| 平台 | 文件 |
|------|------|
| Windows (64位) | `pot_{version}_x64-setup.exe` |
| Windows (32位) | `pot_{version}_x86-setup.exe` |
| Windows (ARM64) | `pot_{version}_arm64-setup.exe` |
| macOS (Apple Silicon) | `pot_{version}_aarch64.dmg` |
| macOS (Intel) | `pot_{version}_x64.dmg` |
| Linux (Debian/Ubuntu) | `pot_{version}_amd64.deb` |
| Linux (AppImage) | `pot_{version}_amd64.AppImage` |

### 故障排除

**Windows**: 启动后没有界面？检查是否卸载/禁用了 WebView2，如需可下载内置 WebView2 的版本 `pot_{version}_{arch}_fix_webview2_runtime-setup.exe`。

**macOS**: 提示无法验证开发者？前往 设置 → 隐私与安全性，点击 仍要打开。若提示文件损坏：

```bash
sudo xattr -d com.apple.quarantine /Applications/pot.app
```

**Linux (Nvidia)**: Webkit2Gtk 2.42.0 下可能崩溃，在 `/etc/environment` 中添加：

```
WEBKIT_DISABLE_DMABUF_RENDERER=1
```

<div align="center">

# 外部调用

</div>

Pot 提供了完整的 HTTP 接口，以便可以被其他软件调用。您可以通过向 `127.0.0.1:port` 发送 HTTP 请求来调用 pot，其中的`port`是 pot 监听的端口号，默认为`60828`,可以在软件设置中进行更改。

## API 文档

```bash
POST "/" => 翻译指定文本(body为需要翻译的文本),
GET "/config" => 打开设置,
POST "/translate" => 翻译指定文本(同"/"),
GET "/selection_translate" => 划词翻译,
GET "/input_translate" => 输入翻译,
GET "/ocr_recognize" => 截图OCR,
GET "/ocr_translate" => 截图翻译,
GET "/ocr_recognize?screenshot=false" => 截图OCR(不使用软件内截图),
GET "/ocr_translate?screenshot=false" => 截图翻译(不使用软件内截图),
```

## 示例

```bash
curl "127.0.0.1:60828/selection_translate"
```

## 不使用软件内截图

1. 使用其他截图工具截图
2. 将截图保存在 `$CACHE/com.pot-app.desktop/pot_screenshot_cut.png`
3. 向 `127.0.0.1:port/ocr_recognize?screenshot=false` 发送请求

> `$CACHE` 为系统缓存目录，例如 Windows 上为 `C:\Users\{用户名}\AppData\Local\com.pot-app.desktop\`

Hyprland 配置示例：

```conf
bind = ALT, X, exec, grim -g "$(slurp)" ~/.cache/com.pot-app.desktop/pot_screenshot_cut.png && curl "127.0.0.1:60828/ocr_recognize?screenshot=false"
bind = ALT, C, exec, grim -g "$(slurp)" ~/.cache/com.pot-app.desktop/pot_screenshot_cut.png && curl "127.0.0.1:60828/ocr_translate?screenshot=false"
```

<div align="center">

# Wayland 支持

</div>

## 快捷键无法使用

由于 Tauri 的快捷键方案并没有支持 Wayland，所以 pot 应用内的快捷键设置在 Wayland 下无法使用。 您可以设置系统快捷用 curl 发送请求来触发 pot，详见[外部调用](#外部调用)

## 截图无法使用

在一些纯 Wayland 桌面环境/窗口管理器(如 Hyprland)上，pot 内置的截图无法使用，这时可以通过使用其他截图工具代替，详见 [不使用软件内截图](#不使用软件内截图)

## 划词翻译窗口跟随鼠标位置

Hyprland 配置示例：

```conf
windowrulev2 = float, class:(pot), title:(Translator|OCR|PopClip|Screenshot Translate)
windowrulev2 = move cursor 0 0, class:(pot), title:(Translator|PopClip|Screenshot Translate)
```

## 手动编译

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.5.0
- Rust >= 1.80.0

### 开始编译

```bash
git clone https://github.com/CyrilPeng/pot-desktop.git
cd pot-desktop
pnpm install
pnpm tauri dev   # 开发调试
pnpm tauri build # 打包构建
```

Linux 额外依赖：

```bash
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev patchelf libxdo-dev libxcb1 libxrandr2 libdbus-1-3
```
