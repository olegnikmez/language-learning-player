// Базовая функция для отправки команд в локальный AnkiConnect
async function invokeAnki(action, params = {}) {
    let response;
    
    // 1. Проверяем физическое подключение к локальному серверу Anki
    try {
        response = await fetch('http://127.0.0.1:8765', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, version: 6, params: params })
        });
    } catch (error) {
        // Ошибка сети (Anki выключен или сбились настройки CORS)
        alert('Ошибка подключения к Anki! Убедитесь, что программа Anki запущена, и плагин AnkiConnect установлен.');
        console.error('AnkiConnect Fetch Error:', error);
        return null;
    }

    // 2. Обрабатываем ответ от самого AnkiConnect
    const data = await response.json();
    
    if (data.error) {
        // Если Anki вернул ошибку, проверяем её текст
        if (data.error.includes('duplicate')) {
            alert('Такая карточка уже существует в вашей колоде (дубликат)!');
        } else {
            alert('Ошибка Anki: ' + data.error);
        }
        console.error('AnkiConnect API Error:', data.error);
        return null;
    }
    
    return data.result;
}

// Функция добавления карточки (Note) в Anki
async function addCardToAnki(word, translation, context) {
    // Определяем текущий язык из селектора, чтобы положить карточку в нужную колоду
    const slSelect = document.getElementById('sl');
    const sl = slSelect ? slSelect.value : 'en'; 
    const deckName = `Language_Player_${sl.toUpperCase()}`;
    const modelName = 'Language_Player_Model';

    const noteParams = {
        note: {
            deckName: deckName,
            modelName: modelName,
            fields: {
                "Word": word,
                "Translation": translation,
                "Context": context,
                "Audio": "" // Оставляем пустым, аудио можно настроить в самом Anki
            },
            options: {
                allowDuplicate: false // Защита от дублей
            },
            tags: ["LanguagePlayer"]
        }
    };

    const result = await invokeAnki('addNote', noteParams);
    return result !== null; // Возвращает true, если успешно
}

// Ждем полной загрузки страницы, так как скрипт будет в <head>
window.addEventListener('load', function() {
    const createDeckBtn = document.getElementById('createDeck');
    const createModelBtn = document.getElementById('createModel');
    const slSelect = document.getElementById('sl'); // Получаем доступ к селектору исходного языка

    // 1. Создание колоды
    if (createDeckBtn) {
        createDeckBtn.addEventListener('click', async function() {
            // Берем текущий язык из селектора (например, 'en', 'de')
            const sl = slSelect ? slSelect.value : 'en'; 
            const deckName = `Language_Player_${sl.toUpperCase()}`;

            const result = await invokeAnki('createDeck', { deck: deckName });
            if (result !== null) {
                alert(`Колода "${deckName}" успешно создана (или уже существует)!`);
            }
        });
    }

    // 2. Создание модели карточки
    if (createModelBtn) {
        createModelBtn.addEventListener('click', async function() {
            const modelName = 'Language_Player_Model';
            
            const modelParams = {
                modelName: modelName,
                inOrderFields: ["Word", "Translation", "Context", "Audio"],
                css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
                isCloze: false,
                cardTemplates: [
                    {
                        Name: "Основная карточка",
                        Front: "{{Word}}<br><br><span style='font-size:14px; color:gray'>{{Context}}</span>",
                        Back: "{{FrontSide}}<hr id=answer><b>{{Translation}}</b><br><br>{{Audio}}"
                    }
                ]
            };

            const result = await invokeAnki('createModel', modelParams);
            if (result !== null) {
                alert(`Модель карточек "${modelName}" успешно создана!`);
            }
        });
    }
});