<?php
require_once 'config.php';
require_once $phpcas_path.'/CAS.php';
phpCAS::client(CAS_VERSION_2_0, $cas_host, $cas_port, $cas_context);
phpCAS::setNoCasServerValidation();
if (!isset($_GET['test']) || $_GET['test'] != 1) {
    phpCAS::forceAuthentication();
}
if (isset($_REQUEST['logout'])) {
    phpCAS::logout(array('service'=>$_REQUEST['logout']));
}
if (phpCAS::checkAuthentication()) {
    $xml = new SimpleXMLElement('http://'.$_SERVER['SERVER_NAME'].'/cgi-bin/koha/ilsdi.pl?service=LookupPatron&id='.phpCAS::getUser().'&id_type=userid', Null, True);
    $nodes = $xml->xpath('//LookupPatron/id');
    if (sizeof($nodes) > 0) {
        $borrowernumber = $nodes[0];
    } else {
        $borrowernumber = -1;
    }
    if (isset($_GET['test']) && $_GET['test'] == 1) {
        echo $borrowernumber;
    } else {
        /*print_r('<script>
    window.location = "/m/#account?id='.$borrowernumber.'";
</script>');*/
        header('Location: /m/#account?id='.$borrowernumber);
    }
} else {
    echo 'notlogged';
}
?>
