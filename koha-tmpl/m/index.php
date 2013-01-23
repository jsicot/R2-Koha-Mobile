<?php
	include('./svc/connexion.inc.php');
	$lang = 'fr';
	$dictionaryDir = './dictionaries/';
	$vaDictionaryDir = $dictionaryDir.'auth_values/';
	function readDictionaryFile($filename) {
		$array = array();
		$handle = @fopen($filename, "r");
		if ($handle) {
			while (($buffer = fgets($handle, 4096)) !== false) {
				if (sizeof(trim($buffer)) != 0 && substr($buffer,0,1) != '#') {
					$tmp = explode('	',$buffer);
					$array[$tmp[0]] = str_replace("\r","",str_replace("\n","",$tmp[1]));
				}
			}
			if (!feof($handle)) {
				echo "Erreur: fgets() a échoué\n";
			}
			fclose($handle);
			return $array;
		}
	}
	function create_page($id,$content,$precontent,$popup) {
		global $availableLanguages;
		global $dictionary;
		global $dictionaryList;
		global $lang;
		?>
		<div data-role="page" id="<?php echo $id; ?>" data-theme="a">
			<div data-role="header" data-position="fixed" data-theme="e">
				<div data-role="navbar" data-iconpos="top">
					<ul>
						<li><a href="#home" data-icon="home" data-direction="reverse"></a></li>
						<li><a href="#search" data-icon="search" data-rel="dialog"></a></li>
						<li><a href="#map" data-icon="koha-map"></a></li>
						<li><a href="#hours" data-icon="koha-hour"></a></li>
						<li><a href="#login" data-icon="koha-user"  data-rel="dialog"></a></li>
					</ul>
				</div>
			</div>
			<?php echo $precontent; ?>
			<div data-role="content">
				<?php echo $content; ?>
			</div>
			<div data-role="footer" data-position="fixed">
				<div class="ui-btn-left dictionarySelector">
					<select data-native-menu="false" id="<?php echo $id; ?>LgSelector" data-icon="gear" data-iconpos="left" data-theme="a">
						<?php echo $dictionaryList; ?>
					</select>
				</div>
				<h3><?php echo $dictionary['TITLE']; ?></h3>
			</div>
			<?php echo $popup; ?>
		</div>
		<?php
	}
	function create_dialog($id,$title,$content) {
		?>
		<div data-role="dialog" id="<?php echo $id; ?>" data-theme="a">
			<div data-role="header">
				<h1><?php echo $title; ?></h1>
			</div>
			<div data-role="content">
				<?php echo $content; ?>
			</div>
		</div>
		<?php
	}
	function getAuthorisedValues($category,$icons = false) {
		global $sql;
		global $lang;
		global $vaDictionaryDir;
		if (is_file($vaDictionaryDir.$category.'_'.$lang.'.txt')) {
			$vaDico = readDictionaryFile($vaDictionaryDir.$category.'_'.$lang.'.txt');
		}
		$query = 'SELECT authorised_value, lib'.(($icons)?', imageurl':'').' FROM authorised_values WHERE category="'.$category.'";';
		$object = array();
		foreach ($sql->query($query) as $row) {
			$lib = utf8_encode(trim($row['lib']));
			if (isset($vaDico[$row['authorised_value']]) && !empty($vaDico[$row['authorised_value']])) {
				$lib = $vaDico[$row['authorised_value']];
			}
			if ($icons) {
				$object[$row['authorised_value']] = array($lib,utf8_encode(trim($row['imageurl'])));
			} else {
				$object[$row['authorised_value']] = $lib;
			}
		}
		return $object;
	}
	function getLocations() {
		global $sql;
		$query = 'SELECT branchcode, branchname FROM branches;';
		$object = array();
		foreach ($sql->query($query) as $row) {
			$object[$row['branchcode']] = utf8_encode(trim($row['branchname']));
		}
		return $object;
	}
	$dir = opendir($dictionaryDir);
	$availableLanguages = array();
	while($file = readdir($dir)) {
		if($file != '.' && $file != '..' && !is_dir($dictionaryDir.$file)) {
			$availableLanguages[] = str_replace('.txt','',$file);
		}
	}
	closedir($dir);
	if (isset($_COOKIE['MOPAC_language']) && !empty($_COOKIE['MOPAC_language']) && in_array($_COOKIE['MOPAC_language'],$availableLanguages)) {
		$lang = $_COOKIE['MOPAC_language'];
	}
	$dictionary = readDictionaryFile($dictionaryDir.$lang.'.txt');
	$dictionaryList = '';
	foreach ($availableLanguages as $lg) {
		$dictionaryList .= '<option value="'.$lg.'" '.(($lang==$lg)?'selected="selected"':'').'>'.strtoupper($lg).'</option>'; 
	}
	$locations = getLocations();
	$types = getAuthorisedValues('CCODE',true);
	$sublocations = getAuthorisedValues('LOC');
	$qualif = getAuthorisedValues('QUALIF');
	$etats = getAuthorisedValues('ETAT');
?>
<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta charset="utf-8"/>
		<meta name="viewport" content="width=device-width, initial-scale=1"/>
		<title><?php echo $dictionary['TITLE']; ?></title>
		<link rel="shortcut icon" href="styles/images/favicon.ico" type="image/x-icon" />
		<link href="styles/images/ios_icon.png" rel="apple-touch-icon" />
		<link rel="stylesheet" href="http://code.jquery.com/mobile/1.2.0/jquery.mobile-1.2.0.min.css" />
		<link rel="stylesheet" href="/m/styles/jquery.m_opac_r2.min.css" />
		<link rel="stylesheet" href="/m/styles/m_opac_r2.css" />
		<script type="text/javascript" src="http://code.jquery.com/jquery-1.8.2.min.js"></script>
		<script type="text/javascript" src="scripts/plugins/jquery.cookie.js"></script>
		<script type="text/javascript">
			var dictionary = <?php echo json_encode($dictionary); ?>;
			var biblios = <?php echo json_encode($locations); ?>;
			var types = <?php echo json_encode($types); ?>;
			var sublocations = <?php echo json_encode($sublocations); ?>;
			var qualif = <?php echo json_encode($qualif); ?>;
			var etats = <?php echo json_encode($etats); ?>;
			$(document).bind("mobileinit", function() {
				$.mobile.defaultPageTransition = 'slide';
				$.mobile.defaultDialogTransition = 'pop';
			});
		</script>
		<script type="text/javascript" src="http://code.jquery.com/ui/1.9.1/jquery-ui.min.js"></script>
		<script type="text/javascript" src="http://code.jquery.com/mobile/1.2.0/jquery.mobile-1.2.0.min.js"></script>
		<script type="text/javascript" src="scripts/utils/utils.js"></script>
		<script type="text/javascript" src="scripts/utils/unimarc-utils.js"></script>
		<script type="text/javascript" src="scripts/plugins/jqm.page.params.js"></script>
		<script type="text/javascript" src="scripts/plugins/jqm.schedule_from_gcalendar.js"></script>
		<script type="text/javascript" src="scripts/script.js"></script>
    </head>
	<body id="mypage" onload="">
		<!-- Home page -->
		<?php
			create_page('home','<form style="display:block" id="search_form" method="get">
					<div data-role="fieldcontain"  style="text-align:center">
						<input type="search" name="keywords" id="keywords" placeholder="'.$dictionary['CATALOG_SEARCH'].'" />
					</div>
				</form>
				<ul data-role="listview" data-inset="true">
					<li><a href="http://rennes2.summon.serialssolutions.com/"><img src="styles/images/home_icons/summon.png" alt="summon" class="ui-li-icon" />'.$dictionary['ONLINE_DOC'].'</a></li>
					<li><a href="#bdd"><img src="styles/images/home_icons/bdd.png" alt="bdd" class="ui-li-icon" />'.$dictionary['DATABASES'].'</a></li>
					<li><a href="http://scd-actus.univ-rennes2.fr"><img src="styles/images/home_icons/wordpress.png" alt="wordpress" class="ui-li-icon" />'.$dictionary['BU_BLOG'].'</a></li>
					<li><a href="http://www.facebook.com/bibliotheques.univ.rennes2"><img src="styles/images/home_icons/facebook.png" alt="facebook" class="ui-li-icon" />'.$dictionary['BU_FACEBOOK'].'</a></li>
					<li><a href="http://methodoc.univ-rennes2.fr/"><img src="styles/images/home_icons/guide.png" alt="guides" class="ui-li-icon" />'.$dictionary['BU_GUIDES'].'</a></li>					
					<li><a href="http://www.questionpoint.org/crs/qwidget/mobileQwidget.jsp?langcode=2&instid=13054&skin=gray&size=small&referer=http%3A%2F%2Fcatalogue.bu.univ-rennes2.fr%2F"><img src="styles/images/home_icons/ubib.png" alt="ubib" class="ui-li-icon" />'.$dictionary['UBIB'].'</a></li>
				</ul>',
				'<img width="100%" alt="Mobile Library" src="styles/images/bg-mobile.png">',
				'<div data-role="popup" id="addToSpringBoard" data-theme="f" data-overlay-theme="a" data-history="false">
				<a href="#" data-rel="back" data-role="button" data-theme="d" data-icon="delete" data-iconpos="notext" class="ui-btn-right">Close</a>
				<div class="ui-grid-a">
					<img class="ui-block-a" alt="toStringBoard" src="styles/images/toSpringBoard.png" />
					<p class="ui-block-b">'.$dictionary['TO_SPRINGBOARD'].'</p>
				</div>
				<div class="arrow">
					<img alt="arrow" src="styles/images/white_arrow.png" />
				</div>
			</div>');
			create_page('result','<div id="results"></div>');
			create_page('detail','<div id="cdetail"></div>');
			create_page('map','<div id="gmapCanvas"></div>');
			create_page('hours','<div id="chours"></div>');
			create_page('bdd','<div id="databasesContent"></div>');
			create_page('account','<div id="accountContent"></div>');
			$checkboxes = '';
			foreach($types as $code => $data) {
				$checkboxes .= '<div>
                                    <select class="typeselector" name="'.$code.'" data-mini="true" id="type-'.$code.'" data-role="slider" data-track-theme="g">
                                        <option value="0">'.$data[0].'</option>
                                        <option selected="selected" value="1">'.$data[0].'</option>
                                    </select>
                                </div>';
			}
			create_dialog('search',$dictionary['SEARCH_TITLE'],'<form id="search_form2" method="get">
					<div data-role="fieldcontain" style="text-align:center">
						<select name="index" data-native-menu="false" id="index" data-iconpos="left">
							<option value="any">'.$dictionary['FD_ALL'].'</option>
							<option value="title">'.$dictionary['FD_TITLE'].'</option>
							<option value="author">'.$dictionary['FD_AUTHOR'].'</option>
							<option value="subject">'.$dictionary['FD_SUBJECT'].'</option>
							<option value="publisher">'.$dictionary['FD_PUBLISHER'].'</option>
							<option value="serie">'.$dictionary['FD_SERIES'].'</option>
							<option value="callnumber">'.$dictionary['FD_CALL_NUMBER'].'</option>
							<option value="isbn">'.$dictionary['FD_ISBN'].'</option>
						</select>
						<input type="search" name="keywords" id="keywords2" value="" placeholder="'.$dictionary['CATALOG_SEARCH'].'"  />
						<br />
						<div id="itype" data-role="collapsible" data-theme="a" data-content-theme="a">
							<h3>'.$dictionary['TY_TYPES'].' ('.$dictionary['TY_ALL'].')</h3>
							<div data-role="controlgroup" data-mini="true" data-type="horizontal">
								<input type="button" value="'.$dictionary['TY_ALL'].'" class="all" data-icon="check" data-theme="b" />
								<input type="button" value="'.$dictionary['TY_NONE'].'" class="noone" data-icon="delete" data-iconpos="right" data-theme="g"/>
							</div>
							<div data-role="controlgroup" class="checkboxes">'.$checkboxes.'</div>
						</div>
						<br />
						<input type="submit" value="'.$dictionary['SEARCH_TITLE'].'" data-theme="b" data-inline="true" data-icon="search" />
					</div>
				</form>');
			create_dialog('login',$dictionary['LG_YOU_ARE'],'<div data-role="collapsible-set">
					<div data-role="collapsible" data-theme="b" data-content-theme="b">
						<h3>'.$dictionary['LG_FROM_R2'].'</h3>
						<p>'.$dictionary['LG_R2_INSTR'].'</p>
						<a data-role="button" data-theme="b" href="/opac-tmpl/rennes2/svc/CAS.php">'.$dictionary['LG_SESAME'].'</a>
					</div>
					<div data-role="collapsible" data-theme="e" data-content-theme="e">
						<h3>'.$dictionary['LG_EXTERNAL'].'</h3>
						<p>'.$dictionary['LG_EX_INSTR'].'</p>
						<form id="classicloginform" action="" method="POST">
							<input type="text" onfocus="if(this.value==\''.$dictionary['LG_USERNAME'].'\')this.value=\'\';" onblur="if(this.value==\'\')this.value=\''.$dictionary['LG_USERNAME'].'\';" value="'.$dictionary['LG_USERNAME'].'" name="login" />
							<input type="text" onfocus="if(this.value==\''.$dictionary['LG_PASSWD'].'\'){this.value=\'\';this.type=\'password\';}" onblur="if(this.value==\'\'){this.value=\''.$dictionary['LG_PASSWD'].'\';this.type=\'text\';}" value="'.$dictionary['LG_PASSWD'].'" name="password"/>
							<input type="submit" value="'.$dictionary['LG_LOGIN'].'"/>
						</form>
					</div>
				</div>
				<div data-role="collapsible-set">
					<div data-role="collapsible" data-content-theme="a">
						<h3>'.$dictionary['LG_LOST_ID'].'</h3>
						<p>'.$dictionary['LG_LOST_ID_R2_1'].'<a target="_new" title="'.$dictionary['LG_LOST_ID_R2_LT'].'" href="http://www.univ-rennes2.fr/cri/sesame">'.$dictionary['LG_LOST_ID_R2_2'].'</a>.</p>
						<p>'.$dictionary['LG_LOST_ID_EXT'].'</p>
					</div>
					<div data-role="collapsible" data-content-theme="a">
						<h3>'.$dictionary['LG_NOT_ENROLLED'].'</h3>
						<p>'.$dictionary['LG_NOT_ENROLLED_INSTR'].'</p>
					</div>
				</div>');
			create_dialog('unlog','','<a data-role="button" data-icon="koha-user" href="#account">'.$dictionary['UL_READER_ACCOUNT'].'</a>
                <a id="logout" data-role="button" data-icon="delete">'.$dictionary['UL_UNLOG'].'</a>')
		?>
		<!-- Hack page : to force same page reload on hash change -->
		<div data-role="page" id="hack" data-theme="a"></div>
	</body>
</html>
