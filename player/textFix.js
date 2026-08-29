// функция для выбора обработчика файла
function processFileType() {
  const file = document.getElementById("fileInput").files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    const fileName = file.name;
    const fileExtension = fileName.split(".").pop().toLowerCase();
    
    if (fileExtension === "fb2") {
      processFB2(event.target.result);
    } else {
      processFile(event.target.result);
    }
  };
  reader.readAsText(file, "utf-8");
}

// функция для обработки файла
/*function processFile() {
  const file = document.getElementById("fileInput").files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    // удаляем лишние пробелы и знаки табуляции
    let text = event.target.result.replace(/\s+/g, " ");
    // преобразуем символы, которые могут испортить структуру html
    text = text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
    // разбиваем текст на главы по ключевому слову
    const chapterKeyword = document.getElementById("idChapter").value.trim();
    let chapters = text.split(chapterKeyword);
    // удаляем лишние пробелы в начале и конце глав
    chapters = chapters.map(chapter => chapter.trim());
    // разбиваем каждую главу на предложения и добавляем перенос строки
    for (let i = 0; i < chapters.length; i++) {
      let sentences = chapters[i].split(/(?<=[.?!])\s+(?=[A-ZА-Я])/);
      sentences = sentences.map(sentence => sentence.trim()).join('\n');
      chapters[i] = sentences;
    }
    // убираем пустые главы
    const nonEmptyChapters = chapters.filter(chapter => chapter.trim().length > 0);
    // создаем кнопки для скачивания глав
    const chaptersList = document.getElementById("chaptersList");
    chaptersList.innerHTML = "";
    for (let i = 0; i < nonEmptyChapters.length; i++) {
      const chapterBlob = new Blob([nonEmptyChapters[i]], {type: "text/plain;charset=utf-8"});
      const chapterLink = document.createElement("a");
      chapterLink.href = URL.createObjectURL(chapterBlob);
      chapterLink.download = `chapter${i+1}.txt`;
      chapterLink.textContent = `Глава ${i+1}`;
      chaptersList.appendChild(chapterLink);
      chaptersList.appendChild(document.createElement("br"));
    }
  };
  reader.readAsText(file, "utf-8");
}*/



/*function processFile() {
  const file = document.getElementById("fileInput").files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    // удаляем лишние пробелы и знаки табуляции
    let text = event.target.result.replace(/\s+/g, " ");
    // преобразуем символы, которые могут испортить структуру html
    text = text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
    // разбиваем текст на главы по ключевому слову
    const chapterKeyword = document.getElementById("idChapter").value.trim();
    let chapters = text.split(chapterKeyword);
    // удаляем лишние пробелы в начале и конце глав
    chapters = chapters.map(chapter => chapter.trim());
    // разбиваем каждую главу на предложения и добавляем перенос строки
    for (let i = 0; i < chapters.length; i++) {
      let sentences = chapters[i].split(/(?<=^|[.?!])\s+(?=[^a-zа-яё])/gm);
      sentences = sentences.map(sentence => sentence.trim()).join('\n');
      chapters[i] = sentences;
    }
    // убираем пустые главы
    const nonEmptyChapters = chapters.filter(chapter => chapter.trim().length > 0);
    // создаем кнопки для скачивания глав
    const chaptersList = document.getElementById("chaptersList");
    chaptersList.innerHTML = "";
    for (let i = 0; i < nonEmptyChapters.length; i++) {
      const chapterBlob = new Blob([nonEmptyChapters[i]], {type: "text/plain;charset=utf-8"});
      const chapterLink = document.createElement("a");
      chapterLink.href = URL.createObjectURL(chapterBlob);
      chapterLink.download = `chapter${i+1}.txt`;
      chapterLink.textContent = `Глава ${i+1}`;
      chaptersList.appendChild(chapterLink);
      chaptersList.appendChild(document.createElement("br"));
    }
  };
  reader.readAsText(file, "utf-8");
}*/




function processFile(file) {
  // const file = document.getElementById("fileInput").files[0];
  // const reader = new FileReader();
  // reader.onload = function(event) {
    // удаляем лишние пробелы и знаки табуляции
    // let text = event.target.result.replace(/[ \t]+/g, " ");
    let text = file.replace(/[ \t]+/g, " ");

    // преобразуем символы, которые могут испортить структуру html
    text = text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");

    const regex = /(\.|\?|\!|\.{3})\s+("|'|`)?(\n|\r\n)?\s*/g;
    text = text.replace(regex, "$1\n$2\n");


    // разбиваем текст на главы по ключевому слову
    const chapterKeyword = document.getElementById("idChapter").value.trim();
    let chapters = text.split(chapterKeyword);
    // удаляем лишние пробелы в начале и конце глав
    chapters = chapters.map(chapter => chapterKeyword + ' ' + chapter.trim());
    // разбиваем каждую главу на предложения и добавляем перенос строки
    for (let i = 0; i < chapters.length; i++) {
      // let sentences = chapters[i].split(/(?<=^|[.?!])\s+(?=[^a-zа-яё])/gm);
      // sentences = sentences.map(sentence => sentence.trim()).join('\n');
      // chapters[i] = sentences;
      // let sentences = chapters[i].split(/(?<=^|[.?!])\s+|\n/gm);
      // let sentences = chapters[i].split(/([.?!]\s|[.?!]$)\s*/gm);
      // let sentences = chapters[i].split(/(?<=[.?!]['"’”]?)(?=\s+|$)/gm);
      // let sentences = chapters[i].split('\n');
      let sentences = chapters[i].split(/(?<!['"]) *\n(?![^']*['"])/);
      // console.log(sentences);

      // sentences = sentences.map(sentence => sentence.trim());
      sentences = sentences.map(sentence => sentence.trim()).filter(sentence => sentence !== '');

      /*for (let j = 0; j < sentences.length - 1; j++) {
        const currentSentenceLength = sentences[j].length;
        const nextSentenceLength = sentences[j + 1].length;
        
        if (nextSentenceLength < 25) {
          sentences[j] = currentSentenceLength + ' ' + nextSentenceLength + ' ' + sentences[j].replace(/\n/g, " ");
        }
      }*/

      chapters[i] = sentences.join('\n');
    }
    // убираем пустые главы
    const nonEmptyChapters = chapters.filter(chapter => chapter.trim().length > 0);
    // создаем кнопки для скачивания глав
    const chaptersList = document.getElementById("chaptersList");
    chaptersList.innerHTML = "";
    for (let i = 0; i < nonEmptyChapters.length; i++) {
      const chapterBlob = new Blob([nonEmptyChapters[i]], {type: "text/plain;charset=utf-8"});
      const chapterLink = document.createElement("a");
      chapterLink.href = URL.createObjectURL(chapterBlob);
      chapterLink.download = `chapter${i+1}.txt`;
      chapterLink.textContent = `Глава ${i+1}`;
      chaptersList.appendChild(chapterLink);
      chaptersList.appendChild(document.createElement("br"));
    }
  // };
  // reader.readAsText(file, "utf-8");
}
// ===========================================

function processFB2(contents) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(contents, "application/xml");
  const chapters = xmlDoc.getElementsByTagName("section");

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const paragraphs = chapter.getElementsByTagName("p");

    for (let j = 0; j < paragraphs.length; j++) {
      const paragraph = paragraphs[j];

      if (paragraph.textContent.length > 300) {
        const sentences = paragraph.textContent.split(/(?<=[.?!])\s+/);
        let updatedContent = "";

        for (let k = 0; k < sentences.length; k++) {
          const sentence = sentences[k].trim();

          if (sentence.length > 0) {
            updatedContent += sentence + "\n";
          }
        }

        paragraph.textContent = updatedContent.trim();
      }

      if (paragraph.innerHTML.trim() === "") {
        paragraph.parentNode.removeChild(paragraph);
      }
    }
  }

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const chapterText = chapter.textContent.trim();
    const chapterBlob = new Blob([chapterText], { type: "text/plain" });
    const chapterURL = URL.createObjectURL(chapterBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = chapterURL;
    downloadLink.download = "Chapter " + (i + 1) + ".txt";
    downloadLink.textContent = "Скачать главу " + (i + 1);

    document.body.appendChild(downloadLink);
    document.body.appendChild(document.createElement("br"));
  }
}





window.addEventListener('load', function() { 
  // добавляем обработчик события на кнопку "Обработать файл"
  const processButton = document.getElementById("processButton");
  processButton.addEventListener("click", processFileType);
});
