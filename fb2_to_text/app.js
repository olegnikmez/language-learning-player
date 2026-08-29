// app.js
import { abbreviations } from './abbreviations.js';

// --- Общие элементы ---
const separatorInput = document.getElementById('separatorInput');

// --- Элементы Модуля 1 (FB2) ---
const fb2FileInput = document.getElementById('fb2File');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const outputText = document.getElementById('outputText');
let parsedLines = [];

// --- Элементы Модуля 2 (TXT) ---
const txtFileInput = document.getElementById('txtFile');
const chapterButtonsContainer = document.getElementById('chapterButtons');

// ==========================================
// МОДУЛЬ 1: FB2 -> TXT
// ==========================================

fb2FileInput.addEventListener('change', () => {
    processBtn.disabled = !fb2FileInput.files.length;
});

processBtn.addEventListener('click', async () => {
    const file = fb2FileInput.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        processFB2(text);
    } catch (error) {
        console.error('Ошибка при чтении FB2:', error);
        alert('Не удалось прочитать файл.');
    }
});

downloadBtn.addEventListener('click', () => {
    if (!parsedLines.length) return;
    triggerDownload(parsedLines.join('\n'), 'extracted_text.txt');
});

function processFB2(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    const bodies = Array.from(xmlDoc.getElementsByTagName('body'));
    const mainBody = bodies.find(b => !b.hasAttribute('name')) || bodies[0];

    if (!mainBody) {
        alert('Структура FB2 не содержит тега <body>');
        return;
    }

    parsedLines = [];
    const separator = separatorInput.value.trim();

    function traverse(node) {
        if (node.nodeName === 'title') {
            parsedLines.push(separator);
        }

        if (['p', 'v', 'text-author'].includes(node.nodeName)) {
            const rawText = node.textContent.trim();
            if (rawText) {
                const sentences = extractSentences(rawText);
                parsedLines.push(...sentences);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (const child of node.childNodes) {
                traverse(child);
            }
        }
    }

    traverse(mainBody);
    
    outputText.value = parsedLines.join('\n');
    downloadBtn.disabled = false;
}

function extractSentences(text) {
    let safeText = text;
    const PROTECT_TOKEN = '@@_SPACE_@@';

    const initialRegex = /(^|\s)([A-ZÄÖÜА-ЯЁ]\.)\s+/g;
    safeText = safeText.replace(initialRegex, `$1$2${PROTECT_TOKEN}`);
    safeText = safeText.replace(initialRegex, `$1$2${PROTECT_TOKEN}`);

    for (const abbr of abbreviations) {
        const escapedAbbr = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|\\s)(${escapedAbbr})\\s+`, 'gi');
        safeText = safeText.replace(regex, `$1$2${PROTECT_TOKEN}`);
    }

    const boundaryRegex = /(?<=[.!?…]+['"»”]?)\s+(?=[А-ЯЁA-ZÄÖÜ«"“])/;
    const sentences = safeText.split(boundaryRegex);

    return sentences
        .map(s => s.replace(new RegExp(PROTECT_TOKEN, 'g'), ' ').trim())
        .filter(Boolean);
}


// ==========================================
// МОДУЛЬ 2: TXT -> Разделение на главы
// ==========================================

txtFileInput.addEventListener('change', async () => {
    const file = txtFileInput.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        splitIntoChapters(text);
    } catch (error) {
        console.error('Ошибка при чтении TXT:', error);
        alert('Не удалось прочитать TXT файл.');
    }
});

function splitIntoChapters(text) {
    const separator = separatorInput.value.trim();
    if (!separator) {
        alert('Укажите глобальный разделитель глав.');
        return;
    }

    // Разбиваем по разделителю. Сама строка-разделитель при этом исчезает из результирующего массива
    const rawChapters = text.split(separator);
    
    // Очистка от пустот (на случай, если разделитель стоял на 1-й строке или в конце файла)
    const chapters = rawChapters
        .map(ch => ch.trim())
        .filter(ch => ch.length > 0);

    chapterButtonsContainer.innerHTML = ''; // Очистка контейнера

    if (chapters.length === 0) {
        chapterButtonsContainer.innerHTML = '<span class="placeholder">Главы не найдены. Проверьте разделитель.</span>';
        return;
    }

    chapters.forEach((chapterContent, index) => {
        const chapterNumber = index + 1;
        const btn = document.createElement('button');
        
        btn.className = 'chapter-btn';
        btn.textContent = `Глава ${chapterNumber}`;
        btn.title = `Скачать ${chapterNumber}.txt`;
        
        btn.onclick = () => {
            triggerDownload(chapterContent, `${chapterNumber}.txt`);
        };
        
        chapterButtonsContainer.appendChild(btn);
    });
}

/**
 * Утилита для инициации скачивания файла
 * @param {string} content Содержимое файла
 * @param {string} filename Имя файла
 */
function triggerDownload(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    // Освобождение памяти
    setTimeout(() => URL.revokeObjectURL(url), 100);
}