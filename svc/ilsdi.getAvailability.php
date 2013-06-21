<?php
header('Content-Type: text/xml; charset=ISO-8859-1');
print_r(file_get_contents('http://'.$_SERVER['SERVER_NAME'].'/cgi-bin/koha/ilsdi.pl?service=GetAvailability&id='.preg_replace('/ /','+',$_POST['id']).'&id_type=item'));
?>
