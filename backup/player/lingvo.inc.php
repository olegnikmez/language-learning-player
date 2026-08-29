<?php
class Lingvo{

	public $lingvoServiceUrl  = 'https://developers.lingvolive.com';
  public $lingvoApiKey = 'YzkyMDZiMTgtMDVkMi00MjAyLTlhMDYtNWFiYWM1NmViZGQxOjEyYzc3OTM5YjY1NTQxMmU5MDJlNjg3OTQxZDg4Mjcw';
  public $access_token;

	function __construct() {
    //return $this->auth();
  }

  // Формируем запрос на авторизацию и посылаем его
  public function auth(){
    $url = '/api/v1.1/authenticate';
    $method = 'POST';
    $response = $this->make_request($method, $url);
    return $response;
  }

  // Перевод слова
  public function translation($text, $srcLang, $dstLang, $token){
  	$this->access_token = $token;

    $add = '?text='.urlencode($text);
    $add .= '&srcLang='.$srcLang;
    $add .= '&dstLang='.$dstLang;
    
    $url = '/api/v1/Translation'.$add;
    $method = 'GET';
    $response = $this->make_request($method, $url);
    return $response;
  }

  // Звучание слова
  public function sound($dictionaryName, $fileName, $token){
  	$this->access_token = $token;

    $add = '?dictionaryName='.urlencode(trim($dictionaryName));
    $add .= '&fileName='.urlencode(trim($fileName));
    
    $url = '/api/v1/Sound'.$add;
    $method = 'GET';
    $response = $this->make_request($method, $url);
    return $response;
  }

	// Отправка запроса на сервер через curl
  function make_request($method, $url, $body = NULL) {
    $headers = array ();
    // Если получен токен, то используем метод авторизации Bearer token
    if(!empty($this->access_token)){
      $headers[] = 'Authorization: Bearer ' . $this->access_token;
    }else{
    	$headers[] = 'Authorization: Basic ' . $this->lingvoApiKey;
    }
    $headers[] = 'Content-Type: application/json';

    if(!$body){
    	$headers[] = 'Content-Length: 0';
    }

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $this->lingvoServiceUrl . $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($body) {
        curl_setopt($ch, CURLOPT_POST, true);
    }
    if (!empty($body)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
 
    // Отключение проверки сертификатов
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLINFO_HEADER_OUT, true);

    $result = curl_exec($ch);
    $info = curl_getinfo($ch, CURLINFO_COOKIELIST);
    curl_close($ch);

    return $result;
  }
}