<?php
header('Content-Type: text/xml; charset=UTF-8');
print_r(file_get_contents('http://'.$_SERVER['SERVER_NAME'].'/cgi-bin/koha/ilsdi.pl?service=GetRecords&id='.$_GET['id']));
?>
