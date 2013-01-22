<?php

require_once 'config.php';

$id = $_GET['id'];
$request = $_GET['request'];

function parseLinks($xmlstr)
    {
        $records = array(); // array to return

        $xml = new DomDocument();
        if (!@$xml->loadXML($xmlstr)) {
            return $records;
        }

        $xpath = new DOMXpath($xml);
        $linkGroups = $xpath->query("//ssopenurl:linkGroup[@type='holding']");
        if (!is_null($linkGroups)) {
            foreach ($linkGroups as $linkGroup) {
                $record = array();
                // select the deepest link returned
                $elems = $xpath->query(
                    ".//ssopenurl:url[@type='article']", $linkGroup
                );
                if ($elems->length > 0) {
                    $record['linktype'] = 'article';
                } else {
                    $elems = $xpath->query(
                        ".//ssopenurl:url[@type='journal']", $linkGroup
                    );
                    if ($elems->length > 0) {
                        $record['linktype'] = 'journal';
                    } else {
                        $elems = $xpath->query(
                            ".//ssopenurl:url[@type='source']", $linkGroup
                        );
                        if ($elems->length > 0) {
                            $record['linktype'] = 'source';
                        }
                    }
                }
                if ($elems->length > 0) {
                    $href = $elems->item(0)->nodeValue;
                    $record['href']= $href;
                    $record['service_type'] = 'getFullTxt';
                } else {
                    $record['service_type'] = 'getHolding';
                }
                $elems = $xpath->query(
                    ".//ssopenurl:holdingData/ssopenurl:providerName", $linkGroup
                );
                //$title = $elems->item(0)->textContent;
                $elems = $xpath->query(
                    ".//ssopenurl:holdingData/ssopenurl:databaseName", $linkGroup
                );
                $title = ' Sur ' . $elems->item(0)->textContent;
                $record['title'] = $title;
                $elems = $xpath->query(
                    ".//ssopenurl:holdingData/ssopenurl:startDate", $linkGroup
                );
                if ($elems->length > 0) {
                    $dateStart = $elems->item(0)->textContent;
                    $record['coverage'] ='de ' . $elems->item(0)->textContent . ' à ';
                }
                $elems = $xpath->query(
                    ".//ssopenurl:holdingData/ssopenurl:endDate", $linkGroup
                );
                if ($elems->length > 0) {

                    $dateEnd = $elems->item(0)->textContent;
                    $record['coverage'] .= $dateEnd;
                }
                else {
                if ($dateStart > 0){$record['coverage'] .= "Aujourd'hui";}}

                array_push($records, $record);
            }
        }
        return $records;
    }
    
    $url = $linkResolver . '/openurlxml?version=1.0&'. $request .'='.$id;
    
    if(!is_null($proxy_server)){
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
        // Création du contexte de transaction
        $ctx = stream_context_create($opts);    
        $feed = file_get_contents($url,false,$ctx);
     }
     else { 
     	$feed = file_get_contents($url);
     }  
     
$arr= parseLinks($feed);


header('Content-Type: text/javascript; charset=utf8');
header('Access-Control-Allow-Methods: GET, POST');
   
$json= '('.json_encode($arr).');'; //must wrap in parens and end with semicolon
print_r($_GET['callback'].$json); //callback is prepended for json-p
?>
