<img width="200px" src="public/icon.svg" align="left"/>

# Pot

> 🌈 크로스 플랫폼 번역 소프트웨어

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

<h3><a href='./README.md'>中文</a> | <a href='./README_EN.md'>English</a> | 한글 </h3>

<table>
<tr>
    <td> <img src="asset/1.png">
    <td> <img src="asset/2.png">
    <td> <img src="asset/3.png">
</table>

# 목차

</div>

-   [사용법](#사용법)
-   [기능](#기능)
-   [지원 서비스](#지원-서비스)
-   [플러그인 시스템](#플러그인-시스템)
-   [설치](#설치)
-   [외부 API](#외부-api)
-   [Wayland 지원](#wayland-지원)

<div align="center">

# 사용법

</div>

| 선택 번역                                  | 입력 번역                                                        | 외부 API                                                  |
| ------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------- |
| 번역할 텍스트를 선택하고 단축키를 누릅니다 | 단축키를 눌러 번역 창을 열고 텍스트를 입력한 후 Enter를 누릅니다 | 다른 소프트웨어에서 호출 가능, [외부 API](#외부-api) 참조 |
| <img src="asset/eg1.gif"/>                 | <img src="asset/eg2.gif"/>                                       | <img src="asset/eg3.gif"/>                                |

| 클립보드 모니터링                                                  | 스크린샷 OCR                             | 스크린샷 번역                            |
| ------------------------------------------------------------------ | ---------------------------------------- | ---------------------------------------- |
| 번역 패널의 아이콘을 클릭하여 활성화, 텍스트를 복사하면 번역됩니다 | 단축키를 누르고 인식할 영역을 선택합니다 | 단축키를 누르고 번역할 영역을 선택합니다 |
| <img src="asset/eg4.gif"/>                                         | <img src="asset/eg5.gif"/>               | <img src="asset/eg6.gif"/>               |

</div>

<div align="center">

# 기능

</div>

-   [x] 다중 서비스 병렬 번역 ([지원 서비스](#지원-서비스))
-   [x] 다중 서비스 OCR ([지원 서비스](#지원-서비스))
-   [x] 다중 서비스 TTS ([지원 서비스](#지원-서비스))
-   [x] 단어장 내보내기 ([지원 서비스](#지원-서비스))
-   [x] 외부 API ([상세](#외부-api))
-   [x] 플러그인 시스템 ([플러그인 시스템](#플러그인-시스템))
-   [x] 모든 PC 플랫폼 (Windows, macOS, Linux)
-   [x] Wayland 지원 (KDE, Gnome, Hyprland에서 테스트)
-   [x] 다국어 UI

<div align="center">

# 지원 서비스

</div>

## 번역

-   [x] AI 번역 (OpenAI Compatible, Anthropic, Gemini, Ollama)
-   [x] [Alibaba Translate](https://www.aliyun.com/product/ai/alimt)
-   [x] [Baidu Translate](https://fanyi.baidu.com/)
-   [x] [Caiyun](https://fanyi.caiyunapp.com/)
-   [x] [Tencent Transmart](https://fanyi.qq.com/)
-   [x] [Tencent Interactive Translate](https://transmart.qq.com/)
-   [x] [Volcengine Translate](https://translate.volcengine.com/)
-   [x] [NiuTrans](https://niutrans.com/)
-   [x] [Google](https://translate.google.com)
-   [x] [Bing](https://learn.microsoft.com/zh-cn/azure/cognitive-services/translator/)
-   [x] [Bing Dictionary](https://www.bing.com/dict)
-   [x] [DeepL](https://www.deepl.com/)
-   [x] [Youdao](https://ai.youdao.com/)
-   [x] [Cambridge Dictionary](https://dictionary.cambridge.org/)
-   [x] [Yandex](https://translate.yandex.com/)

## OCR

-   [x] 시스템 OCR (오프라인)
    -   [x] [Windows.Media.OCR](https://learn.microsoft.com/en-us/uwp/api/windows.media.ocr.ocrengine?view=winrt-22621) (Windows)
    -   [x] [Apple Vision Framework](https://developer.apple.com/documentation/vision/recognizing_text_in_images) (macOS)
    -   [x] [Tesseract OCR](https://github.com/tesseract-ocr) (Linux)
-   [x] [Tesseract.js](https://tesseract.projectnaptha.com/) (오프라인)
-   [x] [Baidu](https://ai.baidu.com/tech/ocr/general)
-   [x] [Tencent](https://cloud.tencent.com/product/ocr-catalog)
-   [x] [Volcengine](https://www.volcengine.com/product/OCR)
-   [x] [iFlytek](https://www.xfyun.cn/services/common-ocr)
-   [x] QR 코드

## TTS

-   [x] [Lingva](https://github.com/thedaviddelta/lingva-translate)

## 단어장

-   [x] [Anki](https://apps.ankiweb.net/)
-   [x] [Eudic](https://dict.eudic.net/)

<div align="center">

# 플러그인 시스템

</div>

내장 서비스는 제한적입니다. 플러그인 시스템을 통해 기능을 확장할 수 있습니다.

## 플러그인 설치

환경 설정 → 서비스 설정 → 외부 플러그인 추가 → 외부 플러그인 설치에서 `.potext` 파일을 선택하여 설치합니다.

<div align="center">

# 설치

</div>

[Release](https://github.com/CyrilPeng/pot-desktop/releases/latest) 페이지에서 플랫폼에 맞는 설치 파일을 다운로드하세요:

| 플랫폼                | 파일                            |
| --------------------- | ------------------------------- |
| Windows (64비트)      | `pot_{version}_x64-setup.exe`   |
| Windows (32비트)      | `pot_{version}_x86-setup.exe`   |
| Windows (ARM64)       | `pot_{version}_arm64-setup.exe` |
| macOS (Apple Silicon) | `pot_{version}_aarch64.dmg`     |
| macOS (Intel)         | `pot_{version}_x64.dmg`         |
| Linux (Debian/Ubuntu) | `pot_{version}_amd64.deb`       |
| Linux (AppImage)      | `pot_{version}_amd64.AppImage`  |

### 문제 해결

**Windows**: 실행 후 UI가 없나요? WebView2가 제거/비활성화되었는지 확인하세요. WebView2 내장 버전 `pot_{version}_{arch}_fix_webview2_runtime-setup.exe`을 다운로드하세요.

**macOS**: "개발자를 확인할 수 없어 열 수 없습니다"? 시스템 설정 → 개인 정보 보호 및 보안으로 이동하여 "열기"를 클릭하세요. 파일이 손상된 경우:

```bash
sudo xattr -d com.apple.quarantine /Applications/pot.app
```

**Linux (Nvidia)**: Webkit2Gtk 2.42.0에서 충돌할 수 있습니다. `/etc/environment`에 추가:

```
WEBKIT_DISABLE_DMABUF_RENDERER=1
```

<div align="center">

# 외부 API

</div>

Pot는 완전한 HTTP API를 제공합니다. `127.0.0.1:port`로 요청을 보내세요. `port` 기본값은 `60828`입니다.

## API 문서

```bash
POST "/" => 텍스트 번역 (body = 번역할 텍스트),
GET "/config" => 설정 열기,
POST "/translate" => 텍스트 번역 ("/"와 동일),
GET "/selection_translate" => 선택 번역,
GET "/input_translate" => 입력 번역,
GET "/ocr_recognize" => 스크린샷 OCR,
GET "/ocr_translate" => 스크린샷 번역,
GET "/ocr_recognize?screenshot=false" => OCR (내장 스크린샷 미사용),
GET "/ocr_translate?screenshot=false" => 번역 (내장 스크린샷 미사용),
```

## 예시

```bash
curl "127.0.0.1:60828/selection_translate"
```

## 내장 스크린샷 없이 사용

1. 다른 스크린샷 도구로 캡처
2. `$CACHE/com.pot-app.desktop/pot_screenshot_cut.png`에 저장
3. `127.0.0.1:port/ocr_recognize?screenshot=false`로 요청

> `$CACHE`는 시스템 캐시 디렉토리입니다 (예: Windows의 경우 `C:\Users\{사용자}\AppData\Local\com.pot-app.desktop\`)

<div align="center">

# Wayland 지원

</div>

## 단축키가 작동하지 않음

Tauri의 단축키 시스템은 Wayland를 지원하지 않습니다. 시스템 단축키와 curl을 사용하세요. [외부 API](#외부-api) 참조.

## 스크린샷이 작동하지 않음

순수 Wayland 환경(예: Hyprland)에서는 외부 스크린샷 도구를 사용하세요. [내장 스크린샷 없이 사용](#내장-스크린샷-없이-사용) 참조.

## 번역 창이 마우스를 따라가기

Hyprland 설정 예시:

```conf
windowrulev2 = float, class:(pot), title:(Translator|OCR|PopClip|Screenshot Translate)
windowrulev2 = move cursor 0 0, class:(pot), title:(Translator|PopClip|Screenshot Translate)
```

## 소스에서 빌드

### 요구 사항

-   Node.js >= 18.0.0
-   pnpm >= 8.5.0
-   Rust >= 1.80.0

### 단계

```bash
git clone https://github.com/CyrilPeng/pot-desktop.git
cd pot-desktop
pnpm install
pnpm tauri dev   # 개발
pnpm tauri build # 빌드
```

Linux 추가 의존성:

```bash
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev patchelf libxdo-dev libxcb1 libxrandr2 libdbus-1-3
```
