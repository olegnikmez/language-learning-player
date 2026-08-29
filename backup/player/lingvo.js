// const lingvoServiceUrl = 'https://developers.lingvolive.com';
// const lingvoApiKey = 'YzkyMDZiMTgtMDVkMi00MjAyLTlhMDYtNWFiYWM1NmViZGQxOjEyYzc3OTM5YjY1NTQxMmU5MDJlNjg3OTQxZDg4Mjcw';
let lingvoToken = '';
let text = '';
var lingvoURL = "https://www.lingvolive.com/ru-ru/translate/en-ru/";
var html = '';
let dictionaryName = '';

window.addEventListener('load', function() { 

	function recursiveReading(item) {
	  var attr = '';
	  var style = '';
	  var tag = '';
	  var fileName = '';
	  // Картинка громкоговорителя
	  var svgSound = 'M 5.525 7.445 h -3.5 c -0.83 0 -1.5 0.672 -1.5 1.5 v 3 c 0 0.828 0.67 1.5 1.5 1.5 h 3.5 l 7 7 v -20 l -7 7 Z M 15.525 6.945 c 1.125 0.818 2 2.002 2 3.5 c 0 1.498 -0.874 2.682 -2 3.5';

	  // Готовим подсказку, если есть
	  if (item.FullText) attr += ' title="' + item.FullText + '"';

	  // Присоединяем дополнительные данные, если есть
	  if (item.FileName){
	  	fileName = item.FileName;
	  	attr += ' data-file="' + fileName + '"';

	  } 

	  // Обозначаем тип узла и открываем тег
	  switch (item.Node) {
	    case 'Text':
	      // Готовим дополнительное оформление, если есть
	      if (item.IsAccent) style += 'font-weight:bold;';
	      if (item.IsItalics) style += 'font-style:italic;';
	      if (style) style = ' style="' + style + '"';
	      tag = 'span';
	      break;
	    case 'CardRef':
	      tag = 'a'
	      attr += ' href="' + lingvoURL + encodeURIComponent(item.Text) + '"'
	      attr += ' class="toTranslate"';
	      attr += ' target="_blank"'
	      break;
	    case 'Abbrev':
	      tag = 'abbr';
	      break;
	    case 'List':
	      tag = 'ol';
	      break;
	    case 'ListItem':
	      tag = 'li';
	      break;
	    case 'Sound':
	      tag = 'svg';
	      attr += ' class="' + item.Node + '"';
	      // attr += ' fileName="' + fileName + '"';
	      // attr += ' dictionaryName="' + dictionaryName + '"';
	      break;
	    default:
	      tag = 'div';
	      attr += ' class="' + item.Node + '"';
	  }
	  html += '<' + tag + attr + style + '>';

	  // Если нужно показать картинку громкоговорителя
	  if(item.Node == 'Sound'){
	  	// html += '<a href="#" fileName="' + fileName + '" dictionaryName="' + dictionaryName + '"  class="soundUrl"><path d="' + svgSound + '"/>';
	  	html += '<path d="' + svgSound + '" filename="' + fileName + '" dictionaryname="' + dictionaryName + '"  class="soundUrl"/>';
	  }
	  

	  // Пишем текст узла, если есть
	  if (item.Text) html += item.Text;

	  // Углубляемся на следующий уровень, если есть разметка
	  if ('Markup' in item) {
	    item.Markup.forEach(function (item) {
	      recursiveReading(item);
	    });
	  }

	  // Углубляемся на следующий уровень, если есть элементы
	  if ('Items' in item) {
	    item.Items.forEach(function (item) {
	      recursiveReading(item);
	    });
	  }

	  // Закрываем тег
	  html += '</' + tag + '>';
	}

	function createLingvoBlok(data){
		html = '<button class="plus-button">+</button> <button class="minus-button">-</button>';
		// console.log('createLingvoBlok');
		if(data){
			var response = JSON.parse(data);
			
			response.forEach(function (item) {
			  dictionaryName = item.Dictionary;
			  html += '<div class="dictionary">';
			  html += '<h3>' + item.Dictionary + '</h3>';
			  html += '<h4>' + item.Title + '</h4>';

			  item.Body.forEach(function (item) {
			    recursiveReading(item);
			  });

			  html += '</div>';
			});
			// Вывод результата формирования карточки
			document.getElementById('lingvo-translation-box').innerHTML = html;
			document.getElementById('lingvo-translation-box').style.display = 'block';
		}	

			
	}

	// =================================================================



	// document.addEventListener('click', function(event) {
	// && event.ctrlKey
	document.addEventListener('contextmenu', function(event){
	  // Проверяем, был ли клик на элементе с классом "toTranslate"
	  if (event.target.classList.contains('toTranslate')) {
	  	event.preventDefault();
	  	text = event.target.innerText;
	  	if(!text){
	  		return false;
	  	}

	    // Проверяем, пустая ли переменная lingvoToken
	    if (lingvoToken === '') {
	      // Выполняем запрос для получения токена
	      getToken()
	        .then(function(token) {
	          // Записываем полученный токен в переменную lingvoToken
	          lingvoToken = token;
	          // console.log('lingvoToken: ', lingvoToken);
	          
	          // Вызываем функцию для выполнения перевода
	          performTranslation(text);
	        })
	        .catch(function(error) {
	          console.log('Ошибка при получении токена:', error);
	        });
	    } else {
	      // Если lingvoToken не пустая, вызываем функцию для выполнения перевода
	      performTranslation(text);
	    }
	  }
	});

	// Функция для получения токена
	function getToken() {
	  var url = 'player/lingvo.req.php?getToken';
	  return fetch(url)
	    .then(function(response) {
	      if (response.ok) {
	        // return response.json();
	        return response.text();
	      } else {
	        throw new Error('Ошибка при получении токена');
	      }
	    })
	    .then(function(data) {
	    	return data;
	    });
	}

	function performTranslation(text) {
	  var selectElement = document.getElementById('sl');
	  var selectedOption = selectElement.options[selectElement.selectedIndex];
	  var srcLang = selectedOption.getAttribute('srcLang');

	  var selectElementtl = document.getElementById('tl');
	  var selectedOptiontl = selectElementtl.options[selectElementtl.selectedIndex];
	  var dstLang = selectedOptiontl.getAttribute('dstLang');
	  // console.log(srcLang, dstLang);
	  if(!srcLang || !dstLang){
	  	return 0;
	  }
	// encodeURIComponent(text)
	  var url = 'player/lingvo.req.php?translation&text=' + text + '&srcLang=' + srcLang + '&dstLang='  + dstLang + '&token=' + lingvoToken;
	  return fetch(url)
	    .then(function(response) {
	      if (response.ok) {
	        // return response.json();
	        return response.text();
	      } else {
	        throw new Error('Ошибка при получении токена');
	      }
	    })
	    .then(function(data) {
	      createLingvoBlok(data);
	      
	      return data;
	    });
	}

	// Скрываем блок
	document.addEventListener("keydown", function(event) {
	    if (event.keyCode === 27) { // если нажата клавиша "Esc" (код 27)
	      document.getElementById('lingvo-translation-box').innerHTML = "";
	      document.getElementById('lingvo-translation-box').style.display = 'none';
	      // videoPlayer.play();
	    }
	});

	// =============== Показываем или скрываем дополнительные данные карточки =======
	// Получаем ссылки на элементы с классами "plus-button" и "minus-button"
	const plusButtons = document.querySelectorAll('.plus-button');
	const minusButtons = document.querySelectorAll('.minus-button');

	// Обработчик клика на кнопку "plus-button"
	function handlePlusButtonClick() {
	  // Показываем все блоки с классами "Examples", "ExampleItem" и "CardRefs"
	  const examples = document.querySelectorAll('.Examples');
	  const exampleItems = document.querySelectorAll('.ExampleItem');
	  const cardRefs = document.querySelectorAll('.CardRefs');

	  examples.forEach((example) => {
	    example.style.display = 'block';
	  });

	  exampleItems.forEach((item) => {
	    item.style.display = 'block';
	  });

	  cardRefs.forEach((ref) => {
	    ref.style.display = 'block';
	  });
	}

	// Обработчик клика на кнопку "minus-button"
	function handleMinusButtonClick() {
	  // Скрываем все блоки с классами "Examples", "ExampleItem" и "CardRefs"
	  const examples = document.querySelectorAll('.Examples');
	  const exampleItems = document.querySelectorAll('.ExampleItem');
	  const cardRefs = document.querySelectorAll('.CardRefs');

	  examples.forEach((example) => {
	    example.style.display = 'none';
	  });

	  exampleItems.forEach((item) => {
	    item.style.display = 'none';
	  });

	  cardRefs.forEach((ref) => {
	    ref.style.display = 'none';
	  });
	}

	// Назначаем обработчик клика на родительский элемент, содержащий кнопки
	document.addEventListener('click', function(event) {
	  // Проверяем, что кликнули на кнопку "plus-button"
	  if (event.target.matches('.plus-button')) {
	    handlePlusButtonClick(event);
	  }

	  // Проверяем, что кликнули на кнопку "minus-button"
	  if (event.target.matches('.minus-button')) {
	    handleMinusButtonClick(event);
	  }
	});

	// Проиграть звук с через API lingvo
	document.addEventListener('click', function(event) {
	  if (event.target.classList.contains('soundUrl')) {
	  	event.preventDefault();
	    // var soundUrl = event.target.getAttribute('data-soundUrl');
	    var fileName = event.target.getAttribute('filename');
		var dictionaryName = event.target.getAttribute('dictionaryname');
	    // console.log(fileName, dictionaryName);

	    var url = 'player/lingvo.req.php?sound&fileName=' + fileName + '&dictionaryName=' + dictionaryName + ' &token=' + lingvoToken;

	    fetch(url)
	      .then(function(response) {
	        return response.blob();
	      })
	      .then(function(blob) {
	      	// console.log(blob);
	        var audio = new Audio();
	        audio.src = URL.createObjectURL(blob);
	        audio.preload = "auto"; // Включение прелоада
	        audio.play();
	      });

	  }
	});




});