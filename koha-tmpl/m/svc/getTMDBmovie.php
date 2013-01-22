<?php
	
	require_once 'config.php';
	
	function getInitials($name){
		//split name using spaces
		$words=explode(" ",$name);
		$inits='';
		//loop through array extracting initial letters
		foreach($words as $word){
			$inits.=strtoupper(substr($word,0,1));
			$inits.=' ';
		}
		return $inits;	
	}
	
	function setMovie($a) {
		$b['id'] = $a['id'];
		$b['original_title'] = $a['original_title'];
		$b['release_date'] = $a['release_date'];
		$b['poster_path'] = $a['poster_path'];
		$b['title'] = $a['title'];
		return $b;
	}
	//echo "Before include : ".time()."\n";
	include('TMDb-PHP-API/TMDb.php');
	//echo "After include : ".time()."\n";

	$tmdb = new TMDb($tmdbApiKey, 'fr', TRUE);

	$sortie = Array();
	
	//$token = $tmdb->getAuthToken();
	 // Request valid session for that particular user from API
	
	//$_GET['director'] ="Carl Dreyer";
	//$_GET['movie']  = "Du skal aere din hustru" ;
	$initials = '';
	$director = '';
	$title = '';
	$title2 = '';
	if (isset($_GET['director-fn']) && !empty($_GET['director-fn'])){
		$initials = getInitials($_GET['director-fn']);
	}
	if (isset($_GET['director-sn']) && !empty($_GET['director-sn'])){
		$directorBis = $initials." ".$_GET['director-sn'] ;
		$director = $_GET['director-fn']." ".$_GET['director-sn'] ;
		
	}
	if (isset($_GET['movie1']) && !empty($_GET['movie1'])) {
		$title = $_GET['movie1'] ;
	}
	if (isset($_GET['movie2']) && !empty($_GET['movie2'])){
		$title2 = $_GET['movie2'];
	}
	$adult ="false";
	$year="";
	$lang="fr";
	//echo "Before searchPerson : ".time()."\n";
	$real= $tmdb->searchPerson($director, $page = 1, $adult, $year, $lang );
	if (sizeof($real['results']) == 0) {
	   $real= $tmdb->searchPerson($directorBis, $page = 1, $adult, $year, $lang );
	}
	   
	//echo "After searchPerson : ".time()."\n";
	if (sizeof($real['results']) > 0) {
		$real = $real['results'][0]['id'];
		//echo "Before getPersonCredits : ".time()."\n";
		$PersonCredits = $tmdb->getPersonCredits($real, $lang);
		//echo "After getPersonCredits : ".time()."\n";
		$movies = $PersonCredits['crew'];
		$movie = Array();
		$count = 0;
		//echo "movies size : ".sizeof($movies)."\n";
		foreach($movies as $aMovie) {
			$count ++;
			//echo "Before similar text #".$count." : ".time()."\n";
			//echo "After similar text #".$count." : ".time()."\n---\n";
			similar_text($title, $aMovie['title'], $percent); 
			if ($percent > 80) {
				$movie = setMovie($aMovie);
				break;
			}
			else {
				similar_text($title, $aMovie['original_title'], $percentOri);
				if ($percentOri > 80) {
					$movie = setMovie($aMovie);
					break;
				} else  {
					similar_text($title2, $aMovie['title'], $percent2); 
					if ($percent2 > 80) {
						$movie = setMovie($aMovie);
						break;
					}
					else {
						similar_text($title2, $aMovie['original_title'], $percentOri2);
						if ($percentOri2 > 80) {
							$movie = setMovie($aMovie);
							break;
						}
					}
				}
			}
		}
		//echo "counted elt : ".$count."\n";
		array_push($sortie,$movie);
	}
	
		
	header('Content-Type: text/javascript; charset=utf8');
	header('Access-Control-Allow-Methods: GET, POST');
	$json= '('.json_encode($sortie).');'; //must wrap in parens and end with semicolon
	print_r($_GET['callback'].$json); //callback is prepended for json-p
	//echo "\nAfter display : ".time()."\n";
?>
