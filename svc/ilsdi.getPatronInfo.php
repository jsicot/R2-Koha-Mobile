<?php
header('Content-Type: text/xml; charset=UTF-8');
if (isset($_POST['login']) && !empty($_POST['login']) && isset($_POST['password']) && !empty($_POST['password'])) {
    $login = trim($_POST['login']);
    $password = trim($_POST['password']);
    $xml = new SimpleXMLElement('http://'.$_SERVER['SERVER_NAME'].'/cgi-bin/koha/ilsdi.pl?service=AuthenticatePatron&username='.$login.'&password='.$password, Null, True);  
    $nodes = $xml->xpath('//AuthenticatePatron/id');
    if (sizeof($nodes) > 0) {
        $user_id = $nodes[0];
    }
} elseif(($_POST['borrowernumber']) && !empty($_POST['borrowernumber'])) {
    $user_id = $_POST['borrowernumber'];
} else {
    print_r('<?xml version="1.0" encoding="UTF-8" ?>
<GetPatronInfo>
    <error>NoInfos</error>
</GetPatronInfo>');
    die;
}
if (isset($user_id) && !empty($user_id)) {
    print_r(file_get_contents('http://'.$_SERVER['SERVER_NAME'].'/cgi-bin/koha/ilsdi.pl?service=GetPatronInfo&patron_id='.$user_id.'&show_loans=1'));
} else {
    print_r('<?xml version="1.0" encoding="UTF-8" ?>
<GetPatronInfo>
<error>PatronNotFound</error>
</GetPatronInfo>');
}
?>