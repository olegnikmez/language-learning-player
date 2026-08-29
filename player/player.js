window.addEventListener('load', function() { 

  const videoFileInput = document.getElementById('videoFile');
  const subtitlesTopInput = document.getElementById('subtitlesTop');
  const subtitlesBottomInput = document.getElementById('subtitlesBottom');
  const stopAfterSubtitleCheckbox = document.getElementById('stopAfterSubtitle');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoSubtitlesTop = document.getElementById('videoSubtitlesTop');
  const videoSubtitlesBottom = document.getElementById('videoSubtitlesBottom');
  const toTranslateElements = document.querySelectorAll('.toTranslate');
  const translationBox = document.querySelector('.translation-box');
  const createDeckButton = document.getElementById('createDeck');
  const createModelButton = document.getElementById('createModel');
  const hideRightBarCheckbox = document.getElementById('hide-right-bar');
  const allTopSubsContainer = document.getElementById('allTopSubsContainer');
  const videoContainer = document.getElementById('videoContainer');
  const blocks = document.querySelectorAll('.top-chengeble');
  let fileSize = 0;
  let fileName = '';
  let subtitlesTop = [];
  let subtitlesBottom = [];
  let pauseTime = 0.5; // время в секундах возврата на время после паузы
  let storedCurrentTime = 0;
  let noBottom = 1;
  let topText = '';
  let bottomText = '';
  let keyMPressed = false;
  let fullscreen = 0;
  let isDeepSeekActive = false; // Флаг фиксации боковой панели

  // === deepseek ===
  const deepseekApiKeyInput = document.getElementById('deepseekApiKey');
  const deepseekInstructionInput = document.getElementById('deepseekInstruction');

  // Дефолтная инструкция
  const defaultInstruction = `Ты строгий лингвистический анализатор. ЗАПРЕЩЕНО использовать любые приветствия, вводные, оценочные или заключительные фразы. Начинай ответ СТРОГО с литературного перевода.

Раздели предложение на логические смысловые блоки (словосочетания, идиомы, грамматические конструкции, предложные группы или отдельные сложные слова). Не дроби неделимые фразы.

Выводи ответ строго по этой структуре:

Литературный перевод:
[Полный перевод фразы]

**Разбор:**

**[Смысловой блок]** — [его точное значение именно в этом предложении]
* [Краткое грамматическое пояснение: только самое важное для понимания (начальная форма, падеж, время, управление, тип склонения), краткий перевод каждого слова в контексте 
**[слово]** - (перевод). Без избыточных деталей, каждое слово с новой строки, но без абзаца или пункта]
***
Продолжай этот шаблон для каждого смыслового блока в предложении.`;

  // Загружаем сохраненные данные, если они есть
  const savedApiKey = localStorage.getItem('deepseekApiKey') || '';
  const savedInstruction = localStorage.getItem('deepseekInstruction') || defaultInstruction;

  deepseekApiKeyInput.value = savedApiKey;
  deepseekInstructionInput.value = savedInstruction;

  // Слушатели для автоматического сохранения при изменении
  deepseekApiKeyInput.addEventListener('change', (e) => localStorage.setItem('deepseekApiKey', e.target.value));
  deepseekInstructionInput.addEventListener('change', (e) => localStorage.setItem('deepseekInstruction', e.target.value));
  // =======

  // Обработка закрытия модального окна Anki
  const ankiModal = document.getElementById('ankiEditModal');
  const closeAnkiBtn = document.getElementById('closeAnkiModal');
  
  if (closeAnkiBtn) {
      closeAnkiBtn.onclick = function() {
          ankiModal.style.display = 'none';
      };
  }
  // Закрытие по клику вне окна
  // Переменная для отслеживания места, где началось нажатие
  let ankiModalMousedownTarget = null;

  window.addEventListener('mousedown', function(event) {
      ankiModalMousedownTarget = event.target;
  });

  // Закрытие окна только в том случае, если и нажатие, и отпускание были строго на темном фоне
  window.addEventListener('mouseup', function(event) {
      if (event.target === ankiModal && ankiModalMousedownTarget === ankiModal) {
          ankiModal.style.display = 'none';
      }
  });

  // Создание списка по Ctrl + L в редакторе Anki
  document.getElementById('ankiTranslationInput').addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.code === 'KeyL') {
          e.preventDefault();
          document.execCommand('insertUnorderedList', false, null);
      }
  });

  videoFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const fileType = file.type;
    fileSize = file.size;
    fileName = file.name;
    if (fileType.startsWith('audio/')) {
      videoPlayer.style.height = '100vh';
    }else{
      videoPlayer.style.height = 'auto';
    }
    const fileURL = URL.createObjectURL(file);
    videoPlayer.src = fileURL;

    storedCurrentTime = localStorage.getItem(fileName + '_' + fileSize);
    if (storedCurrentTime) {
      videoPlayer.currentTime = storedCurrentTime;
      // play();
    }

  });

  subtitlesTopInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (event) => {
      subtitlesTop = parseSrt(event.target.result);
      loadTopSubtitles();
    }
    videoSubtitlesTop.style.display = 'block';
  });

  subtitlesBottomInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (event) => {
      subtitlesBottom = parseSrt(event.target.result);
      noBottom = 0;
    }
    videoSubtitlesBottom.style.display = 'block';
  });

  // Пауза через время в сек. для задания точного 
  // времени остановки в конце блока субтитров
  async function pauseWait(secWait) {
    if(secWait > 0){
      secWait = secWait * 1000;
      await new Promise(resolve => setTimeout(resolve, secWait));
      videoPlayer.pause();
      // console.log(secWait);
    }else{
      return false;
    }
  }

  async function play() {
    videoPlayer.play();
      await new Promise(resolve => setTimeout(resolve, 100));
      if (videoPlayer.paused) {
        videoPlayer.play();
      }
  }

  let currentSubtitleTopIndex = -1;
  let currentSubtitleBottomIndex = -1;
  let currentTime = 0;
  let oldIndex = -1;
  let pauseWas = 0;

  videoPlayer.addEventListener('timeupdate', (event) => {
    currentTime = videoPlayer.currentTime;

    // Поиск индекса текущего блока субтитров
    for (let i = 0; i < subtitlesTop.length; i++) {
      /*let endTimeTop = 0;
      if(subtitlesTop[i+1] && subtitlesTop[i+1].startTime){
        endTimeTop = subtitlesTop[i+1].startTime;
      }else{
        endTimeTop = subtitlesTop[i].endTime;
      }*/
      // console.log(convertTime(endTimeTop));
      if (currentTime >= subtitlesTop[i].startTime && currentTime < subtitlesTop[i].endTime) {
        currentSubtitleTopIndex = i;
        // subtitlesTopEndTime = subtitlesTop[i].endTime;
        break;
      }
    }

    for (let i = 0; i < subtitlesBottom.length; i++) {
      if (currentTime >= subtitlesBottom[i].startTime && currentTime < subtitlesBottom[i].endTime) {
        currentSubtitleBottomIndex = i;
        break;
      }
    }

    if(oldIndex != currentSubtitleTopIndex){
      // console.log(currentSubtitleTopIndex);
      updateSubtitleCurrentClass(currentSubtitleTopIndex);
      oldIndex = currentSubtitleTopIndex;

      // Сохраняем время для возможности восстановления
      localStorage.setItem(fileName + '_' + fileSize, currentTime);

      if ((currentSubtitleTopIndex !== -1)) {
        videoSubtitlesTop.innerHTML = wrapWordsInSpan(subtitlesTop[currentSubtitleTopIndex].text);
        topText = subtitlesTop[currentSubtitleTopIndex].text;
        // translationBoxHide();
      }
      if (currentSubtitleBottomIndex !== -1) {
        videoSubtitlesBottom.innerHTML = subtitlesBottom[currentSubtitleBottomIndex].text;
        bottomText = subtitlesBottom[currentSubtitleBottomIndex].text;
      }
    }

    // Вычисляем время до следующих субтитров
    // if(subtitlesTop[currentSubtitleTopIndex] && subtitlesTop[currentSubtitleTopIndex].endTime){
    let stopEnd = 0;
    if(subtitlesTop[currentSubtitleTopIndex + 1] && subtitlesTop[currentSubtitleTopIndex + 1].startTime){
      stopEnd = subtitlesTop[currentSubtitleTopIndex + 1].startTime;
    }else{
      if(subtitlesTop[currentSubtitleTopIndex]){
        stopEnd = subtitlesTop[currentSubtitleTopIndex].endTime;
      }
      
    }
    if(subtitlesTop[currentSubtitleTopIndex] && stopEnd){
      timeToNextSub = stopEnd - currentTime;
      // Если оно меньше или равно заданному отступу времени до следующего субтитра
      // ставим на паузу с задержкой
      if(timeToNextSub <= pauseTime && stopAfterSubtitleCheckbox.checked){
        // Если пауза уже была в конце этого блока субтитров, то не повторяем её
        if(pauseWas == 0){
          if(timeToNextSub <= 0.1){
            videoPlayer.pause();
          }else{
            pauseWait(timeToNextSub - 0.07);
          }
          pauseWas = 1;
        } 
      }else{
        pauseWas = 0;
      }
    }  

  });

  // Функция парсинга субтитров в формате srt
  function parseSrt(data) {
    const subtitles = [];

    const lines = data.split('\r\n');
    
    let startTime, endTime, text;
    for (let i = 0; i < lines.length; i++) {
      // console.log(lines[i]); // Отладочный вывод
      if (lines[i].match(/^\d+$/)) {
        // Номер субтитра, пропускаем
      } else if (lines[i].match(/^\d\d:\d\d:\d\d,\d\d\d --> \d\d:\d\d:\d\d,\d\d\d$/)) {
        // Временные метки
        const times = lines[i].split(' --> ');
        startTime = convertTimeToSeconds(times[0]);
        endTime = convertTimeToSeconds(times[1]);
      } else if (lines[i].trim() === '') {
        // Пустая строка, пропускаем
      } else {
        // Текст субтитра
        text = escapeHtml(lines[i]);
        i++;
        while (i < lines.length && lines[i].trim() !== '') {
          text += '\n' + lines[i];
          i++;
        }
        i--;
        if (text && text.trim() !== '') {
          subtitles.push({
            startTime: startTime,
            endTime: endTime,
            text: text
          });
        }
      }
    }
    return subtitles;
  }

  // Функция перевода времени в субтитрах в секунды от начала файла
  function convertTimeToSeconds(time) {
    const parts = time.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseFloat(parts[2].replace(',', '.'));
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Функция загрузки верхних субтитров в блок allTopSubs
  function loadTopSubtitles() {
    const allTopSubs = document.getElementById('allTopSubs');
    for (let i = 0; i < subtitlesTop.length; i++) {
      const subtitle = subtitlesTop[i];
      const subtitleDiv = document.createElement('div');
      // subtitleDiv.textContent = subtitle.text;
      subtitleDiv.innerHTML = subtitle.text;
      subtitleDiv.setAttribute('start', subtitle.startTime);
      subtitleDiv.setAttribute('end', subtitle.endTime);
      subtitleDiv.setAttribute('subNumber', i);
      subtitleDiv.classList.add('subtitle');

      // Если сохранено время
      if (storedCurrentTime && storedCurrentTime >= subtitle.startTime && storedCurrentTime < subtitle.endTime){
        subtitleDiv.classList.add('subtitleCurrent');
      }

      allTopSubs.appendChild(subtitleDiv);

      // Вешаем обработчик на клик по этому элементу
      subtitleDiv.addEventListener('click', function() {
        const startTime = parseFloat(subtitleDiv.getAttribute('start'));
        videoPlayer.currentTime = startTime;
        play();
      });
    }
    scrollSubtitleIntoView();
  }

  // Присваиваем класс subtitleCurrent элементу с текущим блоком субтитров
  function updateSubtitleCurrentClass(currentIndex) {
    const subtitles = document.querySelectorAll('.subtitle');
    subtitles.forEach((subtitle) => {
      const subNumber = subtitle.getAttribute('subNumber');
      if (subNumber == currentIndex) {
        subtitle.classList.add('subtitleCurrent');
      } else {
        subtitle.classList.remove('subtitleCurrent');
      }
    });
    scrollSubtitleIntoView();
  }

  // --- ГЛОБАЛЬНАЯ БЛОКИРОВКА КЛАВИШ ПРИ ВВОДЕ ТЕКСТА ---
  // Стоит первым, чтобы перехватить нажатия до того, как они дойдут до слушателей плеера
  document.addEventListener('keydown', function(event) {
      const ankiModal = document.getElementById('ankiEditModal');
      const isAnkiOpen = ankiModal && ankiModal.style.display === 'block';
      
      // Проверяем, находится ли курсор в любом текстовом поле (включая настройки DeepSeek)
      const activeElement = document.activeElement;
      const isTyping = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable;

      if (isAnkiOpen || isTyping) {
          // Если нажали Esc при открытом окне Anki — закрываем его
          if (isAnkiOpen && (event.code === 'Escape' || event.keyCode === 27)) {
              ankiModal.style.display = 'none';
          }
          
          // Жестко блокируем передачу события дальше всем остальным обработчикам (A, S, D и т.д.)
          // При этом печатать текст это не помешает, так как браузерный ввод работает на другом уровне
          event.stopImmediatePropagation();
          return;
      }

      // Возвращаем функцию закрытия панели DeepSeek по Esc (если не набираем текст)
      if (event.code === 'Escape' || event.keyCode === 27) {
          isDeepSeekActive = false; 
          translationBox.innerHTML = "";
          translationBox.style.display = 'none';
      }
  });
  // -----------------------------------------------------

  // Удаление настроек по клавише Ctrl + R
  document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyR' && event.ctrlKey) { 
      localStorage.clear();
      location.reload(); // перезагружаем страницу
    }
  });


  // Повтор текущего фрагмента
  document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyS') { 
      const currentSubtitle = document.querySelector('.subtitleCurrent');
      if (currentSubtitle) {
        const start = currentSubtitle.getAttribute('start');
        videoPlayer.currentTime = start;
        play();
        //videoPlayer.play();
      }
    }
  });

  // Проигрывание предидущего фрагмента
  document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyA') {
      const currentSubtitle = document.querySelector('.subtitleCurrent');
      if (currentSubtitle) {
        const prevSubtitle = currentSubtitle.previousElementSibling;
        if (prevSubtitle && prevSubtitle.classList.contains('subtitle')) {
          currentSubtitle.classList.remove('subtitleCurrent');
          prevSubtitle.classList.add('subtitleCurrent');
          const startTime = parseFloat(prevSubtitle.getAttribute('start'));
          videoPlayer.currentTime = startTime;
          play();
          //videoPlayer.play();
        }
      }
    }
  });

  // Проигрывание следующего фрагмента
  document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyD') {
      const subtitles = document.querySelectorAll('.subtitle');
      let currentSubtitle = document.querySelector('.subtitleCurrent');
      if (currentSubtitle) {
        currentSubtitle.classList.remove('subtitleCurrent');
        const currentSubtitleIndex = Array.from(subtitles).indexOf(currentSubtitle);
        const nextSubtitle = subtitles[currentSubtitleIndex + 1];
        if (nextSubtitle) {
          nextSubtitle.classList.add('subtitleCurrent');
          const startTime = nextSubtitle.getAttribute('start');
          videoPlayer.currentTime = startTime;
          play();
          // videoPlayer.play();
        }
      }
    }
  });

  // Проигрывание или остановка по нажатию пробела
  function togglePlay() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer.paused) {
      // videoPlayer.play();
      play();
    } else {
      videoPlayer.pause();
    }
  }

  document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyX' || event.code === 'KeyE') {
      event.preventDefault();
      togglePlay();
    }
  });

  // По кнопке W скрыть или показать субтитры с переводом
  document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyW') {
      // const videoSubtitlesBottom = document.getElementById('videoSubtitlesBottom');
      if (videoSubtitlesBottom.style.display === 'none') {
        videoSubtitlesBottom.style.display = 'block';
        
      } else {
        videoSubtitlesBottom.style.display = 'none';
      } 
      // Если загружен файл с переводом
      /*if(noBottom == 1){ // Выводим перевод гугл
        const currentSubtitle = document.querySelector('.subtitleCurrent');
        videoSubtitlesBottom.innerHTML = '';
        if (currentSubtitle) {
          const textToTranslate = currentSubtitle.textContent;
          // Выполняем перевод и выводим его в блоке
          translate(textToTranslate, translation => {
            toBottom(translation);
          });
        }
      }*/
      
    }
  });

  function toBottom(response){
    // subtitlesBottomInput
    
    if (response && response[0]) {
      let translation = '';
      for (const transl of response[0]){
        if(transl[0]){
          translation = translation + transl[0];
        }
      }
      videoSubtitlesBottom.innerHTML = translation;
      // console.log(translation);

    }
  }

  // По кнопке Q скрыть или показать основные субтитры
  document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyQ') {
      const videoSubtitlesBottom = document.getElementById('videoSubtitlesTop');
      if (videoSubtitlesTop.style.display === 'none') {
        videoSubtitlesTop.style.display = 'block';
      } else {
        videoSubtitlesTop.style.display = 'none';
      }
    }
  });

  // Скролим чтобы блок проигрываемых субтитров был всегда на виду
  function scrollSubtitleIntoView() {
    const allTopSubs = document.getElementById("allTopSubs");
    const subtitleCurrent = document.querySelector(".subtitleCurrent");
    if (allTopSubs && subtitleCurrent) {
      const allTopSubsRect = allTopSubs.getBoundingClientRect();
      const subtitleCurrentRect = subtitleCurrent.getBoundingClientRect();
      if (subtitleCurrentRect.bottom > allTopSubsRect.bottom) {
        allTopSubs.scrollTo({
          top: allTopSubs.scrollTop - allTopSubsRect.top + subtitleCurrentRect.top,
          behavior: 'smooth'
        });
      } else if (subtitleCurrentRect.top < allTopSubsRect.top) {
        allTopSubs.scrollTo({
          top: allTopSubs.scrollTop - allTopSubsRect.top + subtitleCurrentRect.top,
          behavior: 'smooth'
        });
      }
    }
  }

  // Оборачиваем каждое слово строки в класс toTranslate
  function wrapWordsInSpan(sentence) {
    const words = sentence.split(" ");
    const wrappedWords = words.map(word => `<span class="toTranslate">${word}</span>`);
    
    // Безопасное экранирование предложения для атрибутов
    const safeSentence = escapeHtml(sentence);

    // Встроенная SVG иконка Google Translate
    const googleIcon = `<svg class="toTranslate" sentence="${safeSentence}" role="img" aria-label="Перевести в Google" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="white" style="cursor: pointer; vertical-align: middle; margin-left: 8px; opacity: 0.9;">
      <title>Перевести в Google</title>
      <path style="pointer-events: none;" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
    </svg>`;

    // Идеально ровная, плоская иконка нейросети (Bot) 
    const aiIcon = `<svg class="aiTranslate" sentence="${safeSentence}" role="img" aria-label="Спросить нейросеть" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer; vertical-align: middle; margin-left: 10px; opacity: 0.9;">
      <title>Спросить нейросеть</title>
      <rect width="18" height="14" x="3" y="8" rx="2" style="pointer-events: none;"/>
      <path d="M12 5a3 3 0 1 0-3 3" style="pointer-events: none;"/>
      <line x1="9" x2="15" y1="15" y2="15" style="pointer-events: none;"/>
      <line x1="9" x2="9.01" y1="12" y2="12" style="pointer-events: none;"/>
      <line x1="15" x2="15.01" y1="12" y2="12" style="pointer-events: none;"/>
    </svg>`;

    // Новая иконка добавления всего предложения в Anki (Плюс в квадрате)
    const ankiIcon = `<svg class="ankiAddBtn" sentence="${safeSentence}" role="img" aria-label="Добавить предложение в Anki" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer; vertical-align: middle; margin-left: 10px; opacity: 0.9;">
      <title>Добавить предложение в Anki</title>
      <rect width="18" height="18" x="3" y="3" rx="2" style="pointer-events: none;"/>
      <line x1="12" x2="12" y1="8" y2="16" style="pointer-events: none;"/>
      <line x1="8" x2="16" y1="12" y2="12" style="pointer-events: none;"/>
    </svg>`;

    // Собираем всё вместе без внешних картинок
    const sentenceWithImg = wrappedWords.join(" ") + googleIcon + ankiIcon + aiIcon ;
    return sentenceWithImg;  
  }
  /*function wrapWordsInSpan(sentence) {
    const words = sentence.split(" ");
    const wrappedWords = words.map(word => `<span class="toTranslate">${word}</span>`);
    
    // Безопасное экранирование предложения для атрибутов
    const safeSentence = escapeHtml(sentence);

    // Встроенная SVG иконка Google Translate (заменяет translateWhite.png)
    const googleIcon = `<svg class="toTranslate" sentence="${safeSentence}" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="white" style="cursor: pointer; vertical-align: middle; margin-left: 8px; opacity: 0.9;" title="Перевести в Google">
      <path style="pointer-events: none;" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
    </svg>`;

    // Идеально ровная, плоская иконка нейросети (Bot) из библиотеки Lucide
    const aiIcon = `<svg class="aiTranslate" sentence="${safeSentence}" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer; vertical-align: middle; margin-left: 10px; opacity: 0.9;" title="Спросить нейросеть">
      <rect width="18" height="14" x="3" y="8" rx="2" style="pointer-events: none;"/>
      <path d="M12 5a3 3 0 1 0-3 3" style="pointer-events: none;"/>
      <line x1="9" x2="15" y1="15" y2="15" style="pointer-events: none;"/>
      <line x1="9" x2="9.01" y1="12" y2="12" style="pointer-events: none;"/>
      <line x1="15" x2="15.01" y1="12" y2="12" style="pointer-events: none;"/>
    </svg>`;

    // Собираем всё вместе без внешних картинок
    const sentenceWithImg = wrappedWords.join(" ") + googleIcon + aiIcon;
    return sentenceWithImg;  
  }*/

  /*function wrapWordsInSpan(sentence) {
    const words = sentence.split(" ");
    const wrappedWords = words.map(word => `<span class="toTranslate">${word}</span>`);
    
    // Безопасное экранирование предложения для атрибутов
    const safeSentence = escapeHtml(sentence);

    // Плоская контурная (stroke) иконка GPT, которая не слипается в кляксу
    const aiIcon = `<svg class="aiTranslate" sentence="${safeSentence}" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer; vertical-align: middle; margin-left: 10px; opacity: 0.9;" title="Спросить нейросеть">
      <rect width="18" height="14" x="3" y="8" rx="2"/>
      <path d="M12 5a3 3 0 1 0-3 3"/>
      <line x1="9" x2="15" y1="15" y2="15"/>
      <line x1="9" x2="9.01" y1="12" y2="12"/>
      <line x1="15" x2="15.01" y1="12" y2="12"/>
    </svg>`;

    const sentenceWithImg = wrappedWords.join(" ") + ` <img class="toTranslate toTranslateImg" sentence="${safeSentence}" src="player/translateWhite.png" style="vertical-align: middle;"> ` + aiIcon;
    return sentenceWithImg;  
  }*/

  // Функция отправки текста гугл переводчику
  function translate(text, callback) {
    const slSelect = document.getElementById('sl');
    const tlSelect = document.getElementById('tl');
    var sourceText = text;
    var sourceLang = slSelect.value;
    var targetLang = tlSelect.value;

    var xhr = new XMLHttpRequest();
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + sourceLang + "&tl=" + targetLang + "&dt=t&dt=at&dt=ex&q=" + encodeURI(sourceText);
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        callback(response);
      }
    };
    xhr.send();
  }

  // При наведении мышки на блок с классом videoSubtitlesTop 
  videoSubtitlesTop.addEventListener('mouseover', function(event) {
    if (event.shiftKey || keyMPressed || isDeepSeekActive) {
      return; // не выполняем действие, если была нажата клавиша Shift
    }
    var translated = '';
    // Проверяем, что произошло событие наведения на блок toTranslate
    if (event.target.classList.contains('toTranslate')) {
      // Проверяем наличие атрибута sentence и его содержимого
      const sentence = event.target.getAttribute('sentence');
      // console.log(sentence);
      var text = '';
      if (sentence && sentence.trim() !== ''){
        text = sentence.trim();
      }else{
        // Получаем текст блока toTranslate
        text = event.target.innerText;
      }
      

      var mouseX = event.clientX;
      var windowWidth = window.innerWidth;
      var halfWindowWidth = windowWidth / 2;

      if (mouseX < halfWindowWidth || !fullscreen) {
        // Мышь находится в левой половине окна
        translationBox.classList.remove('translationBox-left');
        translationBox.classList.add('translationBox-right');
      } else {
        // Мышь находится в правой половине окна
        translationBox.classList.remove('translationBox-right');
        translationBox.classList.add('translationBox-left');
      }



      translationBox.style.display = 'block';

      // Выполняем перевод и выводим его в блоке
      translate(text, translation => {
        createTranslationBlock(translation);
      });
    }
  });

  // Обработка клика по иконке DeepSeek
  videoSubtitlesTop.addEventListener('click', async function(event) {


    // Обработка клика по иконке добавления всего предложения в Anki
    const ankiBtnFull = event.target.closest('.ankiAddBtn');
    if (ankiBtnFull) {
        // Опционально: ставим видео на паузу для удобства редактирования
        if (typeof videoPlayer !== 'undefined' && !videoPlayer.paused) {
            videoPlayer.pause();
        }

        const sentence = ankiBtnFull.getAttribute('sentence');
        
        // Забираем перевод из нижних субтитров
        const bottomSubBlock = document.getElementById('videoSubtitlesBottom');
        const bottomTranslation = bottomSubBlock ? bottomSubBlock.textContent.trim() : '';

        const modal = document.getElementById('ankiEditModal');
        
        // Заполняем поля редактора (Слово и Контекст = само предложение)
        document.getElementById('ankiWordInput').value = sentence;
        document.getElementById('ankiContextInput').value = sentence;
        
        // Заполняем поле разбора переводом из нижнего субтитра
        document.getElementById('ankiTranslationInput').innerHTML = bottomTranslation;
        
        modal.style.display = 'block';
        
        const saveBtn = document.getElementById('saveToAnkiBtn');
        saveBtn.onclick = async function() {
            const editedWord = document.getElementById('ankiWordInput').value;
            const editedContext = document.getElementById('ankiContextInput').value;
            const editedTranslation = document.getElementById('ankiTranslationInput').innerHTML;
            
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '⏳ Сохранение...';
            saveBtn.style.pointerEvents = 'none';
            
            // Отправляем в Anki через уже существующую функцию в anki.js
            const success = await addCardToAnki(editedWord, editedTranslation, editedContext);
            
            saveBtn.innerHTML = originalText;
            saveBtn.style.pointerEvents = 'auto';
            
            if (success) {
                modal.style.display = 'none';
                // Визуальное подтверждение: иконка становится зеленой
                ankiBtnFull.style.stroke = '#28a745'; 
            }
        };
    }



    const aiBtn = event.target.closest('.aiTranslate');
    if (aiBtn) {
      isDeepSeekActive = true; // Блокируем панель от изменений

      const sentence = aiBtn.getAttribute('sentence');
      const apiKey = localStorage.getItem('deepseekApiKey');
      const instruction = localStorage.getItem('deepseekInstruction') || defaultInstruction;

      if (!apiKey) {
        alert("Пожалуйста, введите API ключ DeepSeek в левой панели.");
        return;
      }

      // Определение стороны показа панели (как в переводчике Google)
      var mouseX = event.clientX;
      if (mouseX < window.innerWidth / 2 || !fullscreen) {
        translationBox.classList.remove('translationBox-left');
        translationBox.classList.add('translationBox-right');
      } else {
        translationBox.classList.remove('translationBox-right');
        translationBox.classList.add('translationBox-left');
      }

      // Показываем блок с загрузкой
      translationBox.style.display = 'block';
      translationBox.innerHTML = '<div style="padding: 20px; font-weight: bold; ">Нейросеть анализирует...</div>';

      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: instruction },
              { role: 'user', content: sentence }
            ],
            temperature: 0.3
          })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
          const answer = data.choices[0].message.content;
          
          // Конвертируем Markdown от нейросети в готовый HTML
          const htmlAnswer = marked.parse(answer);
          
          // Вывод ответа (убран white-space: pre-wrap, добавлен класс markdown-body)
          translationBox.innerHTML = `
            <div class="translation-block">
              <div class="source-text">${escapeHtml(sentence)}</div>
              <div class="translation-header markdown-body" style="font-size: 15px; font-weight: normal; margin-top: 10px;">${htmlAnswer}</div>
            </div>
          `;


          // --- НОВЫЙ КОД: ДОБАВЛЕНИЕ КНОПОК ANKI ---
          const blocks = translationBox.querySelectorAll('.markdown-body strong');
          
          // Шаг 1: Находим только ГЛАВНЫЕ фразы (исключаем списки и случайные слова)
          const phraseBlocks = [];
          blocks.forEach(strongEl => {
              const textAfter = strongEl.nextSibling;
              
              // Ищем тире после жирного текста
              if (textAfter && textAfter.nodeType === 3 && (textAfter.textContent.includes('—') || textAfter.textContent.includes('-'))) {
                  const parent = strongEl.parentElement;
                  
                  // ВАЖНО: Игнорируем элементы внутри списков (LI), чтобы не вешать кнопки на каждое разобранное слово
                  if (parent && parent.tagName !== 'LI') {
                      parent.setAttribute('data-phrase-header', 'true');
                      phraseBlocks.push({ strongEl, textAfter, parent });
                  }
              }
          });

          // Шаг 2: Расставляем кнопки и собираем контент
          phraseBlocks.forEach(({ strongEl, textAfter, parent }) => {
              const ankiBtn = document.createElement('span');
              ankiBtn.innerHTML = ' ➕ в Anki';
              ankiBtn.style.cssText = 'cursor: pointer; background: #1D9BF5; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; user-select: none; transition: 0.2s;';
              ankiBtn.title = 'Создать карточку с подробным разбором';
              
              textAfter.after(ankiBtn);
              
              ankiBtn.onclick = function() {
                  const word = strongEl.textContent.trim();
                  const directTranslation = textAfter.textContent.replace(/^[—-\s]+/, '').trim();
                  
                  let detailsHTML = "";
                  
                  // 1. Берем остаток текста в текущем абзаце ПОСЛЕ кнопки
                  let sibling = ankiBtn.nextSibling;
                  while (sibling) {
                      if (sibling.nodeType === 1) detailsHTML += sibling.outerHTML;
                      else if (sibling.nodeType === 3) detailsHTML += sibling.textContent;
                      sibling = sibling.nextSibling;
                  }
                  
                  // 2. Собираем следующие абзацы, пока не упремся в <hr> или следующий смысловой блок
                  if (parent) {
                      let nextBlock = parent.nextElementSibling;
                      while (nextBlock) {
                          if (nextBlock.tagName === 'HR' || nextBlock.hasAttribute('data-phrase-header')) break; 
                          detailsHTML += nextBlock.outerHTML;
                          nextBlock = nextBlock.nextElementSibling;
                      }
                  }
                  
                  // 3. Формируем финальный перевод
                  let finalTranslation = directTranslation;
                  if (detailsHTML.trim()) {
                      finalTranslation += `<br><br><div style="text-align: left; font-size: 16px; color: #333; line-height: 1.4;">${detailsHTML.trim()}</div>`;
                  }
                  
                  // --- НОВОЕ: Открываем модальное окно вместо прямой отправки ---
                  const modal = document.getElementById('ankiEditModal');
                  document.getElementById('ankiWordInput').value = word;
                  document.getElementById('ankiContextInput').value = sentence;
                  // Используем innerHTML, чтобы сохранить верстку в редакторе
                  document.getElementById('ankiTranslationInput').innerHTML = finalTranslation;
                  
                  modal.style.display = 'block';
                  
                  // Обработка клика по кнопке "Сохранить в Anki" внутри модального окна
                  const saveBtn = document.getElementById('saveToAnkiBtn');
                  saveBtn.onclick = async function() {
                      // Забираем уже отредактированные значения
                      const editedWord = document.getElementById('ankiWordInput').value;
                      const editedContext = document.getElementById('ankiContextInput').value;
                      const editedTranslation = document.getElementById('ankiTranslationInput').innerHTML;
                      
                      const originalText = saveBtn.innerHTML;
                      saveBtn.innerHTML = '⏳ Сохранение...';
                      saveBtn.style.pointerEvents = 'none';
                      
                      // Отправляем в Anki
                      const success = await addCardToAnki(editedWord, editedTranslation, editedContext);
                      
                      saveBtn.innerHTML = originalText;
                      saveBtn.style.pointerEvents = 'auto';
                      
                      if (success) {
                          modal.style.display = 'none';
                          ankiBtn.innerHTML = ' ✔️ Добавлено';
                          ankiBtn.style.background = '#28a745';
                      }
                  };
              };
          });
          // --- КОНЕЦ НОВОГО КОДА ---


        
          




        } else {
          translationBox.innerHTML = `<div style="padding: 20px;">Ошибка ответа: ${JSON.stringify(data)}</div>`;
        }
      } catch (error) {
        translationBox.innerHTML = `<div style="padding: 20px; color: red;">Сетевая ошибка: ${error.message}</div>`;
      }
    }
  });
  
  var isCursorOverSubtitlesTop = false;
  var isCursorOverTranslationBox = false;
  var mouseLeaveTimeout;

  // При уходе мыши с блока текста убираем перевод

  videoSubtitlesTop.addEventListener('mouseenter', function() {
    isCursorOverSubtitlesTop = true;
  });

  videoSubtitlesTop.addEventListener('mouseleave', function(event) {
    if (!event.shiftKey) {

      clearTimeout(mouseLeaveTimeout);
      mouseLeaveTimeout = setTimeout(function() {
        isCursorOverSubtitlesTop = false;
        translationBoxHide();
      }, 200);

        
    }
  });

  translationBox.addEventListener('mouseenter', function() {
    isCursorOverTranslationBox = true;
    console.log(isCursorOverTranslationBox);
  });

  translationBox.addEventListener('mouseleave', function(event) {
    if (!event.ctrlKey) {

      clearTimeout(mouseLeaveTimeout);
      mouseLeaveTimeout = setTimeout(function() {
        isCursorOverTranslationBox = false;
        translationBoxHide();
      }, 200);

        
    }
  });

  function translationBoxHide() {
    if (isDeepSeekActive) return; // Не скрываем панель, если открыт ответ DeepSeek
    // console.log(isCursorOverSubtitlesTop, isCursorOverTranslationBox);
    if(!isCursorOverSubtitlesTop && !isCursorOverTranslationBox){
      translationBox.innerHTML = "";
      translationBox.style.display = 'none';
    } 
  }


  /*document.addEventListener("keydown", function(event) {
    const ankiModal = document.getElementById('ankiEditModal');
    if (event.keyCode === 27) { // если нажата клавиша "Esc" (код 27)
      isDeepSeekActive = false; // Снимаем блокировку
      translationBox.innerHTML = "";
      translationBox.style.display = 'none';
      // videoPlayer.play();
    }
  });*/

  // Формирование блока перевода из ответа Google Translate API 
  function createTranslationBlock(response) {
    
    let sourceText = ''; // Переводимый текст
    let translation = ''; // перевод слова
    let alternativeTranslations = []; // альтернативные переводы

    if (response && response[0]) {
      sendTextes = response[0];
      for (const sendText of sendTextes){
        if(sendText[0]){
          translation = translation + sendText[0];
        }
        if(sendText[1]){
          sourceText = sourceText + sendText[1];
        }
      }
    }
    // Альтернативные переводы  
    if (response && response[5]) {
      if(response[5]){ 
        for (const alternativeTranslationsText of response[5]){
          if(alternativeTranslationsText){
            var countAlt = -1;
            if(alternativeTranslationsText[2]){
              for(const alternativeT of alternativeTranslationsText[2]){
                countAlt++;
                if(alternativeT[0]){
                  if(!alternativeTranslations[countAlt]){
                    alternativeTranslations[countAlt] = '';
                  }
                  alternativeTranslations[countAlt] = alternativeTranslations[countAlt] + ' ' + alternativeT[0];
                } 
              }
            }
          }
        }
      }
    }

    let examples = []; // примеры использования
    if (response && response[13] && response[13][0]) {
      examples = response[13][0];
    }

    const translationBlock = document.createElement('div');
    translationBlock.classList.add('translation-block');

    const translationHeader = document.createElement('div');
    translationHeader.classList.add('translation-header');
    translationHeader.classList.add('alternative-translation');
    translationHeader.textContent = translation;

    const sourceTextDiv = document.createElement('div');
    sourceTextDiv.classList.add('source-text');
    sourceTextDiv.textContent = sourceText;

    const alternativeTranslationsList = document.createElement('ul');
    alternativeTranslationsList.classList.add('alternative-translations-list');

    for (const altTranslation of alternativeTranslations) {
      const listItem = document.createElement('li');
      // listItem.textContent = altTranslation[0];
      listItem.textContent = altTranslation;
      listItem.classList.add('alternative-translation');
      alternativeTranslationsList.appendChild(listItem);
    }

    const examplesList = document.createElement('ul');
    examplesList.classList.add('examples-list');

    for (const example of examples) {
      const listItem = document.createElement('li');
      listItem.innerHTML = example[0].replace(/<\/?b>/g, ''); // убираем теги <b>
      examplesList.appendChild(listItem);
    }
    translationBlock.appendChild(sourceTextDiv);
    translationBlock.appendChild(translationHeader);
    translationBlock.appendChild(alternativeTranslationsList);
    translationBlock.appendChild(examplesList);
    translationBox.innerHTML = "";
    translationBox.appendChild(translationBlock);

    return translationBlock;
  }

  // Убираем из текста элементы которые рушат HTML
  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  const colorSelect = document.getElementById("background-color");

  // Вычитываем цвет фона из локального хранилища
  const backgroundColor = localStorage.getItem('background-color');
  if(backgroundColor){
    colorSelect.style.backgroundColor = backgroundColor;
    videoPlayer.style.backgroundColor = backgroundColor;
  }
  // Меняем цвет фона по выбору из select
  colorSelect.addEventListener("change", function() {
    const selectedOption = this.options[this.selectedIndex];
    const selectedColor = selectedOption.value;
    colorSelect.style.backgroundColor = selectedColor;
    videoPlayer.style.backgroundColor = selectedColor;

    localStorage.setItem('background-color', selectedColor);
  });

  // Сохраняем языки
  // Получаем элемент select и значение из localStorage
  const selectSl = document.getElementById('sl');
  const selectTl = document.getElementById('tl');
  const selectedSlValue = localStorage.getItem('selectedSlValue');
  const selectedTlValue = localStorage.getItem('selectedTlValue');
  
  // Если значение есть, то устанавливаем его в selectSl
  if (selectedSlValue) {
    selectSl.value = selectedSlValue;
  }
  if (selectedTlValue) {
    selectTl.value = selectedTlValue;
  }
  
  // Добавляем обработчик события изменения значения selectSl
  selectSl.addEventListener('change', function() {
    // Сохраняем значение в localStorage
    localStorage.setItem('selectedSlValue', this.value);
  });

  selectTl.addEventListener('change', function() {
    localStorage.setItem('selectedTlValue', this.value);
  });

  // Сохраняем положение чекбокса stopAfterSubtitle
  // сохраняем состояние чекбокса в localStorage
  stopAfterSubtitleCheckbox.addEventListener("change", function() {
    localStorage.setItem("stopAfterSubtitleCheckbox", this.checked);
  });

  // восстанавливаем состояние чекбокса из localStorage
  const savedStopAfterSubtitle = localStorage.getItem("stopAfterSubtitleCheckbox");
  if (savedStopAfterSubtitle !== null) {
    stopAfterSubtitleCheckbox.checked = savedStopAfterSubtitle === "true";
  }

  // Озвучиваем слова с сервера Google
  // Добавляем обработчик клика на каждый элемент
  /*videoSubtitlesTop.addEventListener('click', function(event) {
    // Проверяем, что произошло событие наведения на блок toTranslate

    if (event.target.classList.contains('toTranslate') && !keyMPressed) {
      // if (event.button === 0){
        // Получаем текст для произношения
        const textToSpeak = event.target.textContent;
        const language = selectSl.value;
        // Создаем аудио-элемент и произносим текст на выбранном языке
        const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textToSpeak)}&tl=${language}&client=tw-ob`);
        audio.play();
      // } 
    };
  });
*/
  // Озвучиваем слово через синтезатор речи
  videoSubtitlesTop.addEventListener('click', function(event) {
    if (event.target.classList.contains('toTranslate') && event.button === 0 && !keyMPressed) {
      const textToSpeak = event.target.textContent;
      const language = selectSl.value; // Получаем код языка из селекта (например, 'de')

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language;

      // Принудительно ищем подходящий голос в системе
      const voices = window.speechSynthesis.getVoices();
      // Ищем голос, который начинается с нужного кода (например, 'de-DE' или 'de-AT')
      const targetVoice = voices.find(v => v.lang.startsWith(language));
      
      if (targetVoice) {
        utterance.voice = targetVoice; // Явно назначаем голос, если он найден
      }

      speechSynthesis.speak(utterance);
    }


    /*if (event.target.classList.contains('toTranslate') && event.button === 0 && !keyMPressed) {
      const textToSpeak = event.target.textContent;
      const language = selectSl.value;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language;

      speechSynthesis.speak(utterance);
    }*/
  });

  // Взаимодействие с anki
  async function toAnkiSend(action, version, params={}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('error', () => reject('failed to issue request'));
      xhr.addEventListener('load', () => {
          try {
              const response = JSON.parse(xhr.responseText);
              if (Object.getOwnPropertyNames(response).length != 2) {
                  throw 'response has an unexpected number of fields';
              }
              if (!response.hasOwnProperty('error')) {
                  throw 'response is missing required error field';
              }
              if (!response.hasOwnProperty('result')) {
                  throw 'response is missing required result field';
              }
              if (response.error) {
                  throw response.error;
              }
              resolve(response.result);
          } catch (e) {
              reject(e);
          }
      });

      xhr.open('POST', 'http://127.0.0.1:8765');
      xhr.send(JSON.stringify({action, version, params}));
    });
  }

  async function toAnki(action, version, params={}) {
    try {
      const ankiResp = await toAnkiSend(action, version, params);
      // console.log('Response from Anki:', ankiResp);
    } catch (e) {
      alert('Ошибка!');
      console.error('Error:', e);
    }
  }

  // Получаем название колод Anki или формируем его
  /*let deckName = localStorage.getItem('deckName');
  if(!deckName){
    deckName = "player_" + selectSl.value + "_" + selectTl.value;
    localStorage.setItem('deckName', deckName);
    
  }*/

  // Создаем колоду Anki при клике по кнопке
  /*createDeckButton.addEventListener('click', function(event) {
    toAnki('createDeck', 6, {deck: deckName});
  });*/

  // Создаем модель Anki при клике по кнопке
  /*createModelButton.addEventListener('click', function(event) {
    params = {
        "modelName": "player",
        "inOrderFields": ["Word", "Translation", "Sentence", "Sentence_Translation"],
        "isCloze": false,
        "cardTemplates": [
            {
                "Name": "{{Word}}",
                "Front": "{{Word}} \r\n<br><br> \r\n{{Sentence}}",
                "Back": "{{Word}} \r\n<br><br> \r\n{{Sentence}} \r\n <hr> \r\n{{Translation}} \r\n<br><br> \r\n{{Sentence_Translation}}"
            }
        ]
    };
    toAnki('createModel', 6, params);
  });*/


  // Сохраняем слово
  /*translationBox.addEventListener('click', function(event) {
    if(event.target.classList.contains('source-text') || event.target.classList.contains('alternative-translation')){
      let wordToSave = '';
      let transText = '';
      const translationBlock = event.target.closest('.translation-block');
      if(event.target.classList.contains('source-text')){
        wordToSave= event.target.innerText;
        if(translationBlock){
          transText = translationBlock.querySelector('.translation-header').innerText;
        }
      }else if(event.target.classList.contains('alternative-translation')){
        transText = event.target.innerText;
        if(translationBlock){
          wordToSave = translationBlock.querySelector('.source-text').innerText;
        }
      }
        

      wordToSave = wordToSave.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
      transText = transText.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();

      params = {
          "note": {
              "deckName": deckName,
              "modelName": "player",
              "fields": {
                  "Word": wordToSave,
                  "Translation": transText,
                  "Sentence": topText,
                  "Sentence_Translation": bottomText
              },
              "tags": [
                "player"
              ]
          }
      };
      toAnki('guiAddCards', 6, params);
    }
    
  });*/

  // Прячем правую панель
  function toggleRightBar() {
    if (hideRightBarCheckbox.checked) {
      // allTopSubsContainer.style.display = 'none';
      allTopSubsContainer.classList.add('slide-right');
      videoContainer.classList.add('full-width');
      fullscreen = 1;
    } else {
      allTopSubsContainer.style.display = 'block';
      videoContainer.classList.remove('full-width');
      allTopSubsContainer.classList.remove('slide-right');
      fullscreen = 0;
    }
    handleWindowResize();
  }

  hideRightBarCheckbox.addEventListener('change', toggleRightBar);

  document.addEventListener('keydown', function (event) {
    // console.log(event.keyCode);
    if (event.code === 'KeyH') { 
      hideRightBarCheckbox.checked = !hideRightBarCheckbox.checked;
      toggleRightBar();
    }
  });

  // =============== Изменение позиции блоков =====================
  var currentBlock = null;
  var startOffsetTop = 0;
  var isDragging = false;
  
  function handleMouseDown(event) {
    if (!keyMPressed) return; // Проверяем, удерживается ли кнопка "KeyM"
    event.preventDefault();
    currentBlock = this;
    currentBlock.classList.add('moving');
    var blockRect = currentBlock.getBoundingClientRect();
    startOffsetTop = event.clientY - blockRect.top;
    isDragging = true;
  }

  function handleMouseUp() {
    if (!keyMPressed) return;
    event.preventDefault();
    if(currentBlock){
      currentBlock.classList.remove('moving');
    }
    
    currentBlock = null;
    isDragging = false;
  }

  function handleMouseMove(event) {
    if (!keyMPressed) return;
    event.preventDefault();
    if (isDragging) {
      var mouseY = event.clientY;
      var windowHeight = window.innerHeight;
      var blockHeight = currentBlock.offsetHeight;

      var videoContainerTop = videoContainer.offsetTop;
      var newTop = mouseY - startOffsetTop - videoContainerTop;
      
      // Проверка верхнего края окна
      if (newTop < 0) {
        newTop = 0;
      }

      // Проверка нижнего края окна
      if (newTop + blockHeight > windowHeight) {
        newTop = windowHeight - blockHeight;
      }

      /*if (newTop + blockHeight + 10 > windowHeight) {
        newTop = windowHeight - blockHeight - 10;
      }*/

      var videoContainerHeight = videoContainer.offsetHeight;
      var newBottom = videoContainerHeight - (newTop + blockHeight);
      
      if (event.which === 3) { // Проверяем, нажата ли правая кнопка мыши
        currentBlock.style.bottom = newBottom + 'px';
        currentBlock.style.top = 'auto';
      }else{
        currentBlock.style.top = newTop + 'px';
        currentBlock.style.bottom = 'auto';
      }
      window.getSelection().removeAllRanges(); // Убираем выделение текста
    }
  }

  function handleKeyDown(event) {
    if (event.code === 'KeyM') {
      keyMPressed = true;
    }
  }

  function handleKeyUp(event) {
    if (event.code === 'KeyM') {
      event.preventDefault();
      keyMPressed = false;
      if (currentBlock) {
        currentBlock.classList.remove('moving');
        currentBlock = null;
      }
    }
  }

  function handleContextMenu(event) {
    if (keyMPressed){
      event.preventDefault(); // Отменяем показ контекстного меню
    }
  }

  blocks.forEach(function (block) {
    block.addEventListener('mousedown', handleMouseDown);
  });

  // Пересчитываем положения блоков субтитров при изменении размеров окна
  function handleWindowResize() {
    // Получаем текущие размеры окна
    var windowHeight = window.innerHeight;

    // Перебираем все блоки и пересчитываем их положение
    blocks.forEach(function (block) {
      var blockRect = block.getBoundingClientRect();
      var blockTop = blockRect.top;

      // Проверяем, если верхняя граница блока выходит за границы окна
      if (blockTop < 0) {
        block.style.top = "0";
        block.style.bottom = "auto";
        return;
      }

      // Проверяем, если нижняя граница блока выходит за границы окна
      if (blockTop + block.offsetHeight > windowHeight) {
        var videoContainerHeight = videoContainer.offsetHeight;
        /*block.style.top = windowHeight - block.offsetHeight + "px";
        block.style.bottom = "auto";*/

        block.style.top = "auto";
        block.style.bottom = (videoContainerHeight - windowHeight) + "px";
      }
    });
  }

  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener("resize", handleWindowResize);


  // Маштабирование шрифта мышкой
  // Функция для изменения размера шрифта
  function changeFontSize(delta) {
    const currentFontSize = parseFloat(getComputedStyle(videoSubtitlesTop).fontSize);
    const newFontSize = currentFontSize - delta;

    videoSubtitlesTop.style.fontSize = newFontSize + 'px';
    videoSubtitlesBottom.style.fontSize = newFontSize + 'px';
  }

  // Обработчик события прокрутки мыши
  function handleMouseWheel(event) {
    // Определение направления прокрутки
    const delta = Math.sign(event.deltaY);

    
    
    // Изменение размера шрифта
    changeFontSize(delta);
    
    // Отмена стандартного поведения (прокрутки страницы)
    event.preventDefault();
  }

  videoSubtitlesTop.addEventListener('wheel', handleMouseWheel);
  videoSubtitlesBottom.addEventListener('wheel', handleMouseWheel);


  function convertTime(seconds) {
    var minutes = Math.floor(seconds / 60); // Получаем количество минут
    var remainingSeconds = seconds % 60; // Получаем количество оставшихся секунд

    // Добавляем ведущий ноль для однозначных чисел
    var formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    var formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

    return formattedMinutes + ':' + formattedSeconds; // Возвращаем время в формате 'мм:сс'
  }


});