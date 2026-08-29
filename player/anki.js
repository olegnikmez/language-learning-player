// Базовая функция для отправки команд в локальный AnkiConnect
async function invokeAnki(action, params = {}) {
    try {
        const response = await fetch('http://127.0.0.1:8765', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, version: 6, params: params })
        });
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        return data.result;
    } catch (error) {
        alert('Ошибка подключения к Anki! Убедитесь, что программа Anki запущена, и плагин AnkiConnect установлен.');
        console.error('AnkiConnect Error:', error);
        return null;
    }
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