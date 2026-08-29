<?php
include 'player/lingvo.inc.php';
$lingvo = new Lingvo();
/*try{
	$lingvo = new Lingvo(); 
}catch(Exception $e){
	var_dump($e);
}*/

?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="../mt.png" type="image/icon type">
  <script src="player/lingvo.js"></script>
  <link href="player/player.css" rel="stylesheet" type="text/css">
  <link href="player/lingvo.css" rel="stylesheet" type="text/css">
  <title>Видеоплеер с двумя субтитрами</title>
</head>
<body>
<div id="lingvo-translation-box" class="lingvo-translation-box"></div>
<div class="box">
	<div class="toTranslate">Car</div>
	<div class="toTranslate">broom</div>
	<div class="toTranslate">greed</div>
	<div class="toTranslate">pair, </div>
	<input type="text" class="toTranslate">
</div>
</body>
</html>