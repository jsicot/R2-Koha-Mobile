<?php
	include('./svc/config.php');
	$dictionaryDir = './dictionaries/';
	$vaDictionaryDir = $dictionaryDir.'auth_values/';
	function readDictionaryFile($filename) {
		$array = array();
		$handle = @fopen($filename, "r");
		if ($handle) {
			while (($buffer = fgets($handle, 4096)) !== false) {
				if (sizeof(trim($buffer)) != 0 && substr($buffer,0,1) != '#') {
					$tmp = explode('	',$buffer);
					if (isset($tmp[0]) && isset($tmp[1])){
						$array[$tmp[0]] = str_replace("\r","",str_replace("\n","",$tmp[1]));
					}
				}
			}
			if (!feof($handle)) {
				echo "Erreur: fgets() a échoué\n";
			}
			fclose($handle);
			return $array;
		}
	}
	function create_page($id,$content,$precontent) {
		global $availableLanguages;
		global $dictionary;
		global $dictionaryList;
		global $lang;
		?>
		<div data-role="page" id="<?php echo $id; ?>" data-theme="c">
			<div data-role="header" data-position="fixed" data-theme="c">
				<div data-role="navbar" data-iconpos="top">
					<ul>
						<li><a href="#home" data-icon="home" data-direction="reverse"></a></li>
						<li><a href="#search" data-icon="search" data-rel="dialog"></a></li>
						<li><a href="#login" data-icon="koha-user"  data-rel="dialog"></a></li>
					</ul>
				</div>
			</div>
			<?php if($precontent){echo $precontent;} ?>
			<div data-role="content">
				<?php echo $content; ?>
			</div>
			<div data-role="footer" data-position="fixed">
				<h3><?php echo $dictionary['TITLE']; ?></h3>
			</div>
		</div>
		<?php
	}
	function create_dialog($id,$title,$content) {
		?>
		<div data-role="dialog" id="<?php echo $id; ?>" data-theme="c">
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
	$dictionary = readDictionaryFile($dictionaryDir.$lang.'.txt');
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
		<link rel="stylesheet" href="/m/styles/jquery.m_opac.min.css" />
		<link rel="stylesheet" href="/m/styles/m_opac.css" />
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
		<script type="text/javascript" src="scripts/script.js"></script>
    </head>
	<body id="mypage" onload="">
		<!-- Home page -->
		<?php
			create_page('home','<form style="display:block" id="search_form" method="get">
					<div data-role="fieldcontain"  style="text-align:center">
						<input type="search" name="keywords" id="keywords" placeholder="'.$dictionary['CATALOG_SEARCH'].'" />
						<br />
						<input type="submit" value="'.$dictionary['SEARCH_TITLE'].'" data-theme="b" data-inline="true" data-icon="search" />
					</div>
				</form>',
				'<img width="100%" alt="'.$dictionary['TITLE'].'" src="styles/images/bg-mobile.png">');
			create_page('result','<div id="results"></div>','');
			create_page('detail','<div id="cdetail"></div>','');
			create_page('account','<div id="accountContent"></div>','');
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
						<div id="itype" data-role="collapsible" data-theme="c" data-content-theme="c">
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
			create_dialog('login',$dictionary['LG'],'
						<p>'.$dictionary['LG_INSTR'].'</p>
						<form id="classicloginform" action="" method="POST">
							<input type="text" onfocus="if(this.value==\''.$dictionary['LG_USERNAME'].'\')this.value=\'\';" onblur="if(this.value==\'\')this.value=\''.$dictionary['LG_USERNAME'].'\';" value="'.$dictionary['LG_USERNAME'].'" name="login" />
							<input type="text" onfocus="if(this.value==\''.$dictionary['LG_PASSWD'].'\'){this.value=\'\';this.type=\'password\';}" onblur="if(this.value==\'\'){this.value=\''.$dictionary['LG_PASSWD'].'\';this.type=\'text\';}" value="'.$dictionary['LG_PASSWD'].'" name="password"/>
							<input type="submit" value="'.$dictionary['LG_LOGIN'].'"/>
						</form>');
			create_dialog('unlog','','<a data-role="button" data-icon="koha-user" href="#account">'.$dictionary['UL_READER_ACCOUNT'].'</a>
                <a id="logout" data-role="button" data-icon="delete">'.$dictionary['UL_UNLOG'].'</a>')
		?>
		<!-- Hack page : to force same page reload on hash change -->
		<div data-role="page" id="hack" data-theme="c"></div>
	</body>
</html>
