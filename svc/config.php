<?php
//MySQL db connection
$host = '';
$dbname = '';
$login = '';
$password = '';
$sql = new PDO('mysql:dbname='.$dbname.';host='.$host,$login,$password);

//language preference
$lang = 'fr'; //fr or en


?>
