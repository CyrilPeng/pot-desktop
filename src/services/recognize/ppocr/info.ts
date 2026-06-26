export const info = {
    name: 'ppocr',
    icon: 'logo/ppocr.svg',
};

// PP-OCRv6 uses a unified model for 50 languages.
// The language code here is passed to the recognition pipeline
// to influence character priority, but the model itself handles all languages.
export enum Language {
    auto = 'auto',
    zh_cn = 'ch',
    zh_tw = 'ch',
    en = 'en',
    ja = 'japan',
    ko = 'korean',
    fr = 'french',
    es = 'spanish',
    ru = 'russian',
    de = 'german',
    it = 'italian',
    tr = 'turkish',
    pt_pt = 'portuguese',
    pt_br = 'portuguese',
    vi = 'vietnamese',
    id = 'indonesian',
    th = 'thai',
    ms = 'malay',
    ar = 'arabic',
    hi = 'hindi',
    uk = 'ukrainian',
    he = 'hebrew',
    fa = 'persian',
    sv = 'swedish',
    pl = 'polish',
    nl = 'dutch',
}
