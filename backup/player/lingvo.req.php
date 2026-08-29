<?php
ini_set('error_reporting', E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

include_once 'lingvo.inc.php';
$lingvo = new Lingvo();

// Получить токен
if(isset($_GET['getToken'])){
	$token = $lingvo->auth();
	echo $token;
}

// Перевести слово или фразу (словарная карточка)
if(isset($_GET['translation'])){

	$text = $_GET['text'];
	$srcLang = $_GET['srcLang'];
	$dstLang = $_GET['dstLang'];
	$token = $_GET['token'];

	$translation = $lingvo->translation($text, $srcLang, $dstLang, $token);
	echo $translation;
}

// Получить звучание слова
if(isset($_GET['sound'])){

	$dictionaryName = $_GET['dictionaryName'];
	$fileName = $_GET['fileName'];
	$token = $_GET['token'];

	$sound = $lingvo->sound($dictionaryName, $fileName, $token);

	header('Content-Type: audio/wav');
	echo base64_decode($sound);
}

