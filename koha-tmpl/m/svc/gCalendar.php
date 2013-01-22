<?php
require_once 'config.php';
$userid = $_GET['userid'];
$currentDay = date('Y-m-d',$_GET['time']);
$nextDay = date('Y-m-d',$_GET['time']+86400);

$opts = array(
    'http' => array (
        'proxy'=>'tcp://' . $proxy_server . ':' . $proxy_port. '',
        'request_fulluri' => true
    ),
    'https' => array (
        'proxy'=>'tcp://' . $proxy_server . ':' . $proxy_port. '',
        'request_fulluri' => true
    )
);
// Cr�ation du contexte de transaction
$ctx = stream_context_create($opts);    

$url = 'http://www.google.com/calendar/feeds/'.$userid.'/public/full?alt=json-in-script&start-min='.$currentDay.'&start-max='.$nextDay.'&singleevents=true&orderBy=startTime&sortorder=ascending&callback=t';
$feed = file_get_contents($url,false,$ctx);

header('Content-Type: text/javascript; charset=utf8');
header('Access-Control-Allow-Methods: GET, POST');

$feed = preg_replace('/^\/.*?\(/s','(',$feed);
print_r($_GET['callback'].$feed);
?>
