/*************************
* APPLICATION PARAMETERS *
*************************/
//Default Koha OPAC URL
var default_url = ""; // example : http://koha.library.university.edu/
// Directory for php web services script
var svc_dir = ""; // default : '/m/svc/'
// Directory for perl SRU web service
var srugw_dir = ""; //default is /cgi-bin/koha/mobile/ 
//koha icons directory for itemtypeimg
var itemtypeimg_dir = ""; //example : /opac-tmpl/prog/itemtypeimg/bridge/
//Number of results per page
var qte = 20;

/***********************************************
* MARC field and Subfield Codes for item types *
***********************************************/   
var itypeField = ""; //example : 099
var itypeSub = ""; //example : t

/***********************************************
* Label code (authorised value) for journal item type *
***********************************************/   
var journalLabel = ""; //example "JOURNAL"

/*******************************
* REUSABLE REGULAR EXPRESSIONS *
*******************************/ 
// Extract the id of the page from the URI
var getId_RegExp = /(#[\w%_.-]*)\??|(\/m\/)/;
// Extract all chars placed after the sharp from the URI
var postSharp_RegExp = /((#[\w\?*$&=%_.-]*)|(\/m\/))$/;

/****************************************************
*              FREQUENTLY MODIFIED VARS             *
* tokens, transfunction associative arrays and vars *
****************************************************/
// Boolean to check if app initialisation was already called
var loaded=false;
// Token to avoid multi ajax sent request
var ajax_token = false;
// Token to specify that no aditional results
var scrollEnd = false;
// Simulated Get associative array
var $_GET = {};
// Associative array currently filled and emptied with availability information indexed by exemplary identifier (itemnumber)
var availabilities = {};
// Index of the the resultset in #result
var index = 1;
// Id of the preceding page
var prevPage = '';
// Id of the page the application navigate to
var toPage = '';
// Base of the page title (get form head>title element) to dynamically modify title
var titleBase = '';
// Number of availabilities request sent to group the response
var requestSent = 0;
// Last element of #result list
var lastElt = null;


/*************************************
* ASSOCIATIVE ARRAYS OF OTHER VALUES *
*            absent in db            *
*************************************/ 
// Sudoc libraries's RCR
var RCR = {
/***********   Examples **********  
    352382101 : biblios['BU'],   
    222782101 : biblios['STB'],
    352382136 : biblios['MUS'],
    352382139 : biblios['MED'],
    352382212 : biblios['HUM'],
    352382221 : biblios['ANG'],
    352382233 : biblios['BZH'],
    352382237 : biblios['APS'],
    352382238 : biblios['ALC'],
    352385136 : biblios['CERHIO'],
    352389902 : biblios['BEL'],
    352382213 : biblios['SOC'],
    352382246 : biblios['LAHM']
***********************************/
};


/**************************************
* APPLICATION INITIALIZATION FUNCTION *
**************************************/ 
$('#mypage').live('pagecreate',function(event){
    if (loaded) return; // this avoids repetition
    loaded=true;
    // titleBase initialated with head>title value
    titleBase = $('head>title').text();
    // home page search form submission
    $('#search_form').submit(function() {
        // format the content of the query input
        var q = myescape($('#keywords').val());
        // disable submit if no research term
        if (!q) return false;
        // change page to result list
        $.mobile.changePage('#result?q='+q,{
            dataUrl : '#result?q='+q
        });
        // cancel default behavior
        return false;
    });
    // advenced search form submission
    $('#search_form2').submit(function() {
        // format the value of the selected index
        var i = $('#index option:selected').val().trim();
        var t = '';
        // create a string composed with bits for each type
        $('#itype option:selected').each(function() {
            t+= ''+$(this).attr('value');
        });
        // disable submit if no one type is selected
        if (t.match(/^0+$/))    return false;
        // change string to ALL if all types are selected
        if (t.match(/^1+$/))    t='ALL';
        // format the content of the query input
        var q = myescape($('#keywords2').val());
        // if the query input is empty
        if (!q)
            // if all types selected set query to * else disable submission
            if (t != "ALL")     q = '*';
            else                return false;
        // change page to result list
        $.mobile.changePage('#result?i='+i+'&t='+t+'&q='+q,{
            transition : 'pop',
            reverse : true,
            dataUrl : '#result?i='+i+'&t='+t+'&q='+q
        });
        // cancel default behavior
        return false;
    });
    // on all type selection button click, select all types and update the title of the type list
    $('#itype .all').click(function() {
        $('#itype option').attr('selected','');
        $('#itype option[value="1"]').attr('selected','selected');
        $('#itype .typeselector').slider('refresh');
        updateTypeListLabel();
    });
    // on no one type selection button click, unselect all types and update the title of the type list
    $('#itype .noone').click(function() {
        $('#itype option').attr('selected','');
        $('#itype option[value="0"]').attr('selected','selected');
        $('#itype .typeselector').slider('refresh');
        updateTypeListLabel();
    });
    // call login function on classic login form submission
    $('#classicloginform').submit(login);
    // call logout function on logout button click
    $('#logout').click(logout);
});

/****************************
* PAGE BEFORE CHANGE EVENTS *
****************************/
// All page before change
$('#mypage').live('pagebeforechange',function(e,data) {
    if (typeof data.toPage === 'string') {
        if (data.toPage != '#hack') {
            toPage = postSharp_RegExp.exec(data.toPage)[1];
            if (prevPage != '' && getId_RegExp.exec(prevPage)[1] == getId_RegExp.exec(toPage)[1] && prevPage != toPage) {
                $.mobile.changePage('#hack',{
                    changeHash : false,
                    transition : 'none'
                });
            }
            prevPage = postSharp_RegExp.exec(data.toPage)[1];
        }
    }
    $_GET = data.options.pageData || {};
});

/**************************
* PAGE BEFORE SHOW EVENTS *
**************************/
// Auto-redirect from home when a hash is set on URI
$('#home').live('pagebeforeshow',function(e,data) {    
    if (window.location.hash.match(/\?/)) {
        $.mobile.changePage(window.location.hash,{
            dataUrl : window.location.hash,
            transition : 'none',
            changeHash : false
        });
    }
});

// Reset the tokens and counters, empty the content div of the result page and reset availabilies associative array
$('#result').live("pagebeforeshow",function() {
    lastElt = null;
    scrollEnd = false;
    index = 1;
    requestSent = 0;
    $('#results').empty();
    availabilities = {};
});

// Empty the content div of the detail page and reset availabilies associative array
$('#detail').live("pagebeforeshow",function() {
   $('#cdetail').empty();
   availabilities = {};
});

// Reset slider active sides in grey and collapse the type list
$('#search').live("pagebeforeshow",function() {;
    $('#itype .ui-slider-label-a').addClass('ui-btn-active');
    $('#itype').trigger( "collapse" );	
});

// Collapse all collapsibles and empties classic login form
$('#login').live("pagebeforeshow",function() {
    $('#login .ui-collapsible').trigger("collapse");
    $('#classicloginform input[name="login"]').val('');
    $('#classicloginform input[name="login"]').blur();
    $('#classicloginform input[name="password"]').val('');
    $('#classicloginform input[name="password"]').blur();
});

// SAME PAGE CHANGEMENT ON HASHCHANGE HACK
// On hack page arrival, change page to temporary saved page
$('#hack').live('pagebeforeshow',function(e,data) {
    $.mobile.changePage(toPage,{
        changeHash : false,
        dataUrl : toPage
    });
});

/**************************
* PAGE BEFORE SHOW EVENTS *
**************************/
// Sets the title and display springboard tip if display on iPhone
$('#home').live("pageshow",function() {
    $('head title').text(titleBase+' - '+dictionary['HOME_TITLE']);
});

// Call prepareQuery function if q is set, redirect to home else
$('#result').live("pageshow",function() {
    if ($_GET['q'] != undefined) {
        prepareQuery();
    } else {
        $.mobile.changePage('#home');
    }
});

// Call getDetail function if id is set, redirect to home else
$('#detail').live("pageshow",function() {
    if ($_GET['id'] != undefined) {
        getDetail($_GET['id']);
    } else {
        $.mobile.changePage('#home');
    }
});

// Empty account page if it fill with login demand and ask account information
$('#account').live("pageshow",function() {
    $('head title').text(titleBase+' - '+dictionary['AC_TITLE']);
    if ($('#accountContent').hasClass('askALogin')) {
        $('#accountContent').empty();
        $('#accountContent').removeClass('askALogin');
    }
    if ($('#accountContent').children().size() == 0) {
        getAccount();
    }
});


// Call prepareQuery function when scroll reach bottom of the page if it is not scroll end and if another request wasn't sent
$(window).scroll(function() {
    if (!scrollEnd && (lastElt != null && lastElt.offset().top-$(window).height() <= $(window).scrollTop()) && $.mobile.activePage.attr('id') == 'result' && !ajax_token) {
        prepareQuery();
    }
});

// Call SRU webservice with CQL query
function getRecords(Q) {
    // Disable SRU call if query is empty
    if (Q == '') return;
    // Display loader
    if ($('#results').children().size() > 0) {
        $('#results').find('ul').append('<li class="myloader"><img src="styles/images/ajax-loader.gif" alt="'+dictionary['LOADING']+'"/></li>');
        /*$('html:not(:animated),body:not(:animated)').animate({
            scrollTop : $(document).scrollTop()+200
        }, 'slow');*/
        $('#results').find('ul').listview('refresh');
    } else {
        $('#results').append('<li class="myloader"><img src="styles/images/ajax-loader.gif" alt="'+dictionary['LOADING']+'"/></li>');
    }
    // Encode query, set ajax token to true to disable other calls and call SRU
    var Qe = encodeURIComponent(Q);
    ajax_token = true;
    jQuery.get(srugw_dir+'srugw.pl?preserveNamespace=1&version=1.2&operation=searchRetrieve&query='+Qe+' not dc.suppress=1&startRecord='+index+'&maximumRecords='+qte,function(xml){
        // Remove loader
        $('.myloader').remove();
        // Display result calling displayRecords() function
        if($('#results').children().size() > 0) {
            $('#results').find('ul').append(displayRecords(xml));
        } else {
            $('#results').append('<ul data-role="listview" data-inset="false">'+displayRecords(xml)+'</ul>');
        }
        $('#results').trigger('create');
        $('#results').find('ul').listview('refresh');
        // Call replaceWrongImage() to remove 1*1px amazon image
        replaceWrongImage();
        /*if (lastElt != null)
            $('html:not(:animated),body:not(:animated)').animate({
                scrollTop : lastElt.next().offset().top-$('#result .ui-header').height()
            }, 'slow');*/
        // Set last result into lastElt, increment index and liberate ajax token
        lastElt = $('.myrec:last');
        index += qte;
        ajax_token = false;
    });
}

// Call ILS-DI getRecord webservice
function getDetail(id) {
    // Display loader and call to ILS-DI
    $('#cdetail').append('<div class="myloader"><img src="styles/images/ajax-loader.gif" alt="'+dictionary['LOADING']+'" /></div>');
    jQuery.get(svc_dir+'ilsdi.getRecord.php?id='+id,function(R){
        // Remove loader
        $('.myloader').remove();
        // Display record
        $('#cdetail').append(displayRecord(R));
        $('#cdetail').trigger('create');
        // Call replaceWrongImage() to remove 1*1px amazon image
        replaceWrongImage();
        $('#detail-exemplaire').listview('refresh');
    });
}

// Prepare data to request ILS-DI getPatronInfo webservice
function getAccount() {
    var requestdata = null;
    // If user logged by classic way, set data with login and password, display loader and request account info
    if ($('#classicloginform input[name="login"]').val() != dictionary['LG_USERNAME'] && $('#classicloginform input[name="password"]').val() != dictionary['PASSWORD']) {
        requestdata = {
            login :  $('#classicloginform input[name="login"]').val(),
            password : $('#classicloginform input[name="password"]').val()
        };
        $('#accountContent').append('<div class="myloader"><img src="styles/images/ajax-loader.gif" alt="'+dictionary['LOADING']+'" /></div>');
        requestAccount(requestdata);
    }
   else {
        $('#accountContent').append('<p>'+dictionary['AC_PL_LOGIN']+'</p>\
                                    <a data-role="button" data-icon="koha-user" href="#login" data-rel="dialog">'+dictionary['LG_LOGIN']+'</a>');
        $('#accountContent').addClass('askALogin');
        $('#accountContent').trigger('create');
    }
}

// Get and display account informations
function requestAccount(data) {
    jQuery.ajax({
        url : svc_dir+'ilsdi.getPatronInfo.php',
        dataType : 'xml',
        type : 'POST',
        data : data,
        success : function(R){
            // Remove loader
            $('.myloader').remove();
            if ($(R).find('GetPatronInfo>error').text() != 'PatronNotFound') {
                var today = new Date();
                // Generate complete name of user with title, firstname and surname
                var untel = $(R).find('GetPatronInfo>title').text()+' '+$(R).find('GetPatronInfo>firstname').text()+' '+$(R).find('GetPatronInfo>surname').text();
                // Set title of unlog page with complete name and link user button to unlog page
                $('#unlog div[data-role="header"] h1').text(untel);
                $('a[href="#login"]').attr('href','#unlog');
                // Display "Bonjour <complete name>" and the account expiry date
                var ed = $(R).find('GetPatronInfo>dateexpiry').text();
                var expDate = new Date(ed.substring(0,4),ed.substring(5,7)-1,ed.substring(8,10));
                html = '<p>'+dictionary['AC_HELLO']+' <strong>'+untel+'</strong>,</p>';
                if (expDate.getTime() > today.getTime()) {
                    html += '<p>'+dictionary['AC_VALID']+' <strong>'+expDate.toString(dictionary['DATE_FORMAT'])+'</strong>.</p>';
                } else {
                    html += '<p style="color:red">'+dictionary['AC_UNVALID']+' <strong>'+expDate.toString(dictionary['DATE_FORMAT'])+' !</strong></p>';
                }
                // Alert management
                var alertOutput = '';
                var alertCount = 0;
                // Suspension management
                if ($(R).find('GetPatronInfo>debarred').size() > 0) {
                    // Get suspension data and comment
                    var debdate = new Date($(R).find('GetPatronInfo>debarred').text());
                    var debcom = $(R).find('GetPatronInfo>debarredcomment').text();
                    // If suspension date is later than today, add suspension message to alert output with comment if is set
                    if (debdate.getTime() > today.getTime()) {
                        alertOutput += '<li>'+dictionary['AC_SUSPENS'];
                        if (debdate.getTime() != (new Date('9999-12-31')).getTime())
                            alertOutput += ' '+dictionary['AC_SUSPENS_TIL']+' <strong>'+debdate.toString(dictionary['DATE_FORMAT'])+'</strong>';
                        if (debcom != '')
                            alertOutput += ' '+dictionary['AC_SUSPENS_COM']+' <strong class="ita">"'+debcom+'"</strong>';
                        alertOutput += '.</li>';
                        alertCount ++;
                    }
                }
                // No address management
                if ($(R).find('GetPatronInfo>gonenoaddress').text() == 1) {
                    alertOutput += '<li>'+dictionary['AC_NO_ADDR']+'</li>';
                    alertCount ++;
                }
                // Card loss management
                if ($(R).find('GetPatronInfo>lost').text() == 1) {
                    alertOutput += '<li>'+dictionary['AC_CARD_LOST']+'</li>'
                    alertCount ++;
                }
                // If alerts are set, display them on collapsible listview
                if (alertCount > 0) {
                    html += '<div data-role="collapsible" data-theme="c" data-content-theme="c" data-collapsed-icon="alert" data-expanded-icon="alert">\
                                <h3>'+dictionary['AC_YOU_HAVE']+' '+alertCount+' '+dictionary['AC_ALERT']+(alertCount>1?'s':'')+'</h3>\
                                <ul data-role="listview" class="accountalert">'+alertOutput+'</ul>\
                            </div>';
                }
                // If opac note is set, display it on collaspible
                if ($(R).find('GetPatronInfo>opacnote').size() > 0 && $(R).find('GetPatronInfo>opacnote').text() != '') {
                    html += '<div data-role="collapsible" data-theme="b" data-content-theme="c" data-collapsed-icon="info" data-expanded-icon="info">\
                                <h3>'+dictionary['AC_YOU_HAVE']+' '+dictionary['AC_MESSAGE']+'</h3>\
                                <div>'+$(R).find('GetPatronInfo>opacnote').text()+'</div>\
                            </div>';
                }
                // Prepare listview for loan list
                html += '<ul data-role="listview" data-inset="true">\
                            <li data-role="list-divider">'+dictionary['AC_LOANS']+'</li>';
                if ($(R).find('loan').size() > 0) {
                    // Make an associative array to discern late loan, today restore loan and other loan
                    var loans = {
                        toRestore : new Array(),
                        late : new Array(),
                        others : new Array()
                    };
                    // For each loan, parse the duedate to set data in the correct category
                    $(R).find('loan').each(function() {
                        var dd = $(this).find('date_due').text().trim();
                        var dueDate = new Date(dd.substring(0,4),dd.substring(5,7)-1,dd.substring(8,10),dd.substring(11,13),dd.substring(14,16));
                        var datas = {
                            title : $(this).find('title').text(),
                            author : $(this).find('author').text(),
                            cote : $(this).find('itemcallnumber').text(),
                            dueDate : dueDate.toString(dictionary['CAL_DATE_FORMAT'])
                        }
                        if (dueDate.getTime() < today.getTime())
                            loans.late.push(datas);
                        else if (dueDate.getYear() == today.getYear() && dueDate.getMonth() == today.getMonth() && dueDate.getDate() == today.getDate())
                            loans.toRestore.push(datas);
                        else
                            loans.others.push(datas);
                            
                    });
                    // Display toRestore loan in listview
                    $(loans.toRestore).each(function() {
                        html += '<li class="caution"><input type="button" data-icon="info" data-theme="c" data-iconpos="notext" />\
                                    <div class="title">'+this.title+'</div>\
                                    <div class="author">'+this.author+'</div>\
                                    <div class="duedate">'+dictionary['AC_BACK_TODAY']+'</div>\
                                    <div class="cote">'+dictionary['FD_CALL_NUMBER']+' : <strong>'+this.cote+'</strong></div>\
                                </li>';
                    });
                    // Display late loan in listiview
                    $(loans.late).each(function() {
                        html += '<li class="alert"><input type="button" data-icon="alert" data-theme="b" data-iconpos="notext" />\
                                    <div class="title">'+this.title+'</div>\
                                    <div class="author">'+this.author+'</div>\
                                    <div class="duedate">'+dictionary['AC_LATE_TIL']+' <strong>'+this.dueDate+'</strong></div>\
                                    <div class="cote">'+dictionary['FD_CALL_NUMBER']+' : <strong>'+this.cote+'</strong></div>\
                                </li>';
                    });
                    // Display other loan in listview
                    $(loans.others).each(function() {
                        html += '<li>\
                                    <div class="title">'+this.title+'</div>\
                                    <div class="author">'+this.author+'</div>\
                                    <div class="duedate">'+dictionary['AC_BACK_THE']+' <strong>'+this.dueDate+'</strong></div>\
                                    <div class="cote">'+dictionary['FD_CALL_NUMBER']+' : <strong>'+this.cote+'</strong></div>\
                                </li>';
                    });
                }
                else {
                    html += '<li>'+dictionary['AC_NO_LOAN']+'</li>';
                }
                $('#accountContent').append(html+'</ul>');
                $('#accountContent').trigger('create');
            } else {
                casLogged = false;
                $('#accountContent').append('<p>'+dictionary['AC_BAD_LOGIN']+'</p>\
                                            <a data-role="button" data-icon="koha-user" href="#login" data-rel="dialog">'+dictionary['LG_LOGIN']+'</a>');
                $('#accountContent').addClass('askALogin');
                $('#accountContent').trigger('create');
            }
        },
        error : function(jqXHR, textStatus, errorThrown) {
            casLogged = false;
            $('#accountContent').append('<p>'+dictionary['AC_ERROR']+'</p>\
                                        <a data-role="button" data-icon="koha-user" href="#login" data-rel="dialog">'+dictionary['LG_LOGIN']+'</a>');
            $('#accountContent').addClass('askALogin');
            $('#accountContent').trigger('create');
        }
    });
}

// Change page from loign form to account page
function login() {
    $.mobile.changePage('#account');
    return false;
}

// Unlog the current user
function logout() {
        $('#accountContent').empty();
        $('a[href="#unlog"]').attr('href','#login');
        $.mobile.changePage('#login',{
            changeHash : false
        });
}

// Display records list on search result
function displayRecords(xml) {
    var html = '';
    // Remove zs prefix
    xml = loadXML((new XMLSerializer()).serializeToString(xml).replace(/zs:/g,'zs'));
    var records = $(xml).find("record");
    if (records.length > 0) {
        // Display number of all result to the search
        if($('#results').children().size() == 0) {
            $('head title').text($('head title').text()+' ('+$(xml).find("zsnumberOfRecords").text()+' '+dictionary['LI_RESULT']+($(xml).find("zsnumberOfRecords").text()>1?'s':'')+')');
            html += '<li class="nbresults ui-btn-up-b"><p>'+$(xml).find("zsnumberOfRecords").text()+' '+dictionary['LI_RESULT']+($(xml).find("zsnumberOfRecords").text()>1?'s':'')+'</p></li>';
        }
        for (var i=0; i < records.length; i++) {
            var R = records[i];
            // To see XML structure : alert((new XMLSerializer()).serializeToString(R));
            // Get biblionumber, titles, isbns and document type
            var sn = $(R).find('[tag="001"]').text()/1;
            var title = new Array();
            $(R).find('[tag="200"]').each(function(i) {
                title[i] = $(this).find('[code="a"]').text()+' '+$(this).find('[code="e"]').text();
            });
            var isbns = $(R).find('[tag="010"]').find('[code="a"]');
            var ccode = '';
            // If multiple document type are set, apply the first if no one of them is a journal
            if ($(R).find('[tag="'+itypeField+'"]').find('[code="'+itypeSub+'"]').text().search(journalLabel) > -1) {
                ccode = journalLabel;
            } else {
                ccode = $(R).find('[tag="'+itypeField+'"]').find('[code="'+itypeSub+'"]').first().text();
            }
            var cover='';
            // If document type isn't a journal, add exemplaries informations on availabilities array and set disponibility code to -1 if is an online document
            if (ccode != journalLabel) {
                if (availabilities[sn] == undefined)    availabilities[sn] = {};
                $(R).find('[tag="995"]').each(function(index) {
                    var id = $(this).find('[code="9"]').text();
                    if (availabilities[sn][id] == undefined)  availabilities[sn][id] = {};
                    availabilities[sn][id]['cote'] = $(this).find('[code="k"]').text();
                    availabilities[sn][id]['code'] = $(this).find('[code="o"]').text();
                    if ($(R).find('[tag="856"]').size() > 0) {
                        availabilities[sn][id]['code'] = -1;
                    }
                    availabilities[sn][id]['place'] = biblios[$(this).find('[code="c"]').text()];
                });
            }
            // If an ISBN is set, use the first ISBN to retrieve cover
            if (isbns.length>0) {
                var current_isbn = $(isbns[0]).text();
                current_isbn = current_isbn.replace(/-|\//g, "");
                cover='<img class="cover_image" align="top" width="45" src="http://images.amazon.com/images/P/'+current_isbn+'.08.THUMBZZZ.jpg" />';						
            }
            // If document has no ISBN, set default nocover span
            else {
                cover = '<span class="nocover"></span>';
            }
            // Display result line
            html += '<li class="myrec" id="elt'+sn+'">'+
                        '<a href="#detail?id='+sn+'" data-ajax="false">'+
                            '<p class="my_icon_wrapper">'+
                                cover;
            // Display document type
            if (ccode != '') {
                html +=         '<span class="typedoc" >'+
                                    ((types[ccode][1] != '')?'<img src="'+itemtypeimg_dir+types[ccode][1]+'" alt="'+types[ccode][0]+'" /><br />':'')+
                                    types[ccode][0]+
                                '</span>';
            }
            html +=         '</p>'+
                            '<div class="description">';
            // Display title
            $(title).each(function() {
                html +=         ' <h2 style="font-size:0.8em">'+this+'</h2>';		
            });
            html +=             '<p class="pmyrec">';
            // Display author
            if ($(R).find('[tag="700"]').length) {
                html += $(R).find('[tag="700"] [code="c"]').first().text()+
                ' '+($(R).find('[tag="700"] [code="b"]').first().text())+
                ' '+($(R).find('[tag="700"] [code="a"]').first().text())+
                ' '+($(R).find('[tag="700"] [code="d"]').first().text())+'<br/>';
            }
            // Display editor
            html += $(R).find('[tag="210"] [code="c"]').first().text();
            // If document type is a journal, display first exemplary location and call number and set to available
            if (ccode == journalLabel) {
                html += '<p class="exemplaire available"><b>'+RCR[$(R).find('[tag="930"]').find('[code="b"]').first().text()]+'</b><br /><b>Cote : </b> '+$(R).find('[tag="930"]').find('[code="a"]').first().text()+'</p>'+
                        '</p></div><span class="ui-li-count available" id="dispo'+sn+'">?</span></a></li>';
            }
            // Else, set "Recherche d'exmplaire en cours" and set disponibily icon to grey "?"
            else {
                html += ' - '+$(R).find('[tag="100"]').first().text().substring(9,13)+
                    '<p class="exemplaire">'+dictionary['LI_HOLDING_SEARCH']+'</p>'+
                    '</p></div><span class="ui-li-count" id="dispo'+sn+'">?</span></a></li>';
            }
        }
    }
    // If number of return reccord less than number of maximum result in a set, display message and set end of the scroll to true
    if (records.length < qte) {
        // If no result display, display "Votre recherche ne retourne aucun résultat
        if ($('#results').children().size() == 0 && html == '') {
            html += '<li class="no-result ui-btn-up-b"><p>'+dictionary['LI_NO_RESULT']+'</p></li>';
        }
        // Else, display "Pas de résultats supplémentaires"
        else {
            html += '<li class="no-result ui-btn-up-b"><p>'+dictionary['LI_NO_MORE']+'</p></li>';
        }
        scrollEnd = true;
    }
    // Fill itemnums with itemnumber of exemplary who have 0 on availability code
    var itemnums = new Array();
    $.each(availabilities, function(bibnum, items) {
        $.each(items, function(itemnum, availability) {
            if (availability.code == '0')   itemnums.push(itemnum);
        });
    });
    // Call to ILS-DI webservice to get availability of the document
    jQuery.ajax({
        type : 'POST',
        url : svc_dir+'ilsdi.getAvailability.php',
        beforeSend : function() {
            // On each availabilities request, increase counter to globalise treatment and avoir push/pop array bug
            requestSent ++;
        },
        data : {
            id : itemnums.join("+")
        },
        success : function(R){
            // Avoid treatment if current page isn't still result page
            if ($.mobile.activePage.attr('id') == 'result') {
                // Remove zs prefix
                R = loadXML((new XMLSerializer()).serializeToString(R).replace(/dlf:/g,''));
                // Complete availabilities array with availabilitystatus and availabilitymsg from ILS-DI
                $(R).find('record').each(function() {
                    var bibnum = $(this).find('bibliographic').attr('id');
                    $(this).find('item').each(function() {
                        availabilities[bibnum][$(this).attr('id')]['text'] = $(this).find('availabilitystatus').text();
                        if ($(this).find('availabilitymsg').size() > 0) {
                            availabilities[bibnum][$(this).attr('id')]['msg'] = $(this).find('availabilitymsg').text();
                        }
                    });
                });
                // If not another request was sent
                if (requestSent == 1) {
                    // For each document, set disponibility and count available exemplaries
                    $.each(availabilities, function(bibnum, items) {
                        // Init status to no item available, counter and availability code to 0 and place, message and call number to empty string
                        var statuses = ['not-available','soon','ots','available'];
                        var status = 'no-item';
                        var counter = 0;
                        var total = 0;
                        var place = '';
                        var msg = '';
                        var code = 0;
                        var cote = '';
                        // For each document exemplaries
                        $.each(items, function(itemnum, a) {
                            if (a.code == 0 && a.text == 'available') {
                                if ($.inArray(status,statuses,3) == -1) {
                                    place = a.place;
                                    cote = a.cote;
                                    status = 'available';
                                }
                                counter ++;
                            }
                            if (a.code == 1 || a.code == 3) {
                                if ($.inArray(status,statuses,2) == -1) {
                                    place = a.place;
                                    cote = a.cote;
                                    status = 'ots';
                                }
                                counter ++;
                            }
                            if (((a.code == 0 && a.text == 'not available') || a.code == 8 ) && $.inArray(status,statuses) == -1) {
                                place = a.place;
                                cote = a.cote;
                                status = 'not-available';
                            }
                            if (a.code > 1 && a.code < 8 && $.inArray(status,statuses,1) == -1) {
                                place = a.place;
                                cote = a.cote;
                                status = 'soon';
                            }                           
                            total ++;
                        });
                        // If status change during exemplaries route, set availability string from setting status
                        if (status != 'no-item') {
                            var dispo = '';
                            switch (status) {
                                case 'online' :
                                    dispo = dictionary['AV_ONLINE'];
                                    break;
                                case statuses[3] :
                                    dispo = dictionary['AV_AVAILABLE'];
                                    break;
                                case statuses[2] :
                                    dispo = etats[1];
                                    break;
                                case statuses[1] :
                                    dispo = dictionary['AV_AVAILABLE_SOON'];
                                    break;
                                case statuses[0] :
                                    dispo = dictionary['AV_NOT_AVAILABLE'];
                                    break;
                            }
                            // Display availability, place and call number
                            $('#elt'+bibnum+' .exemplaire').html('<div class="dispo">'+dispo+'</div><div class="place">'+place+'</div><div>'+dictionary['FD_CALL_NUMBER']+' : <span class="cote"> '+cote+'</span></div>').addClass(status);
                        }
                        // Else, display "Pas d'exemplaire disponible"
                        else {
                            $('#elt'+bibnum+' .exemplaire').html('<div class="dispo">'+dictionary['AV_NO_HOLDING']+'</div>').addClass(status);
                        }
                        // Update exemplary counter, reflesh list and delete document line in availabilities array
                        $('#dispo'+bibnum).html(counter+'/'+total).addClass(status);
                        $('#results').find('ul').listview('refresh');
                        delete(availabilities[bibnum]);
                    });
                }
            }
        },
        // Decrease counter when request is  returned
        complete : function() {
            if (requestSent != 0)   requestSent --;
        }
    });
    return html;
}

// Gets informations from MarcXML to display detail record
function displayRecord(xml) {
    // Extract MarcXML from ILS-DI XML
    var mx = new MarcXML($.parseXML($(xml).find('marcxml').text()));
    var mxml = mx.mx;
    var html = '';
    // Get ISBN, title and document type and set page title with record title
    var isbns = $(mxml).find('[tag="010"]').find('[code="a"]');
    var title = $(mxml).find('[tag="200"] [code="a"]').first().text()+' '+$(mxml).find('[tag="200"] [code="e"]').first().text();
    var ccode = $(mxml).find('[tag="'+itypeField+'"]').find('[code="'+itypeSub+'"]').first().text();
    $('head title').text(titleBase+' - '+dictionary['DE_DETAIL']+' : '+title);
    // If an ISBN is set, get cover from Amazon
    if (isbns.length>0) {
        var current_isbn = $(isbns[0]).text(); // use the first ISBN to retrieve cover
        current_isbn = current_isbn.replace(/-|\//g, "");
        html ='<img class="cover_image" align="top" src="http://images.amazon.com/images/P/'+current_isbn+'.01.MZZZZZZZ.jpg" />';						
    }
    // Document type
    html += '<div class="typedoc" >'+
                ((types[ccode][1] != '')?'<img class="typedoc" src="'+itemtypeimg_dir+types[ccode][1]+'" alt="'+types[ccode][0]+'" />':'')+
                types[ccode][0]+
            '</div>';
    // Title (200 $a $d $e $h $i)
    html += mx.tmp200();
    html += '<div data-role="collapsible" class="detaildescription" data-collapsed="false" data-theme="c" data-content-theme="c">\
                <h3>'+dictionary['DE_DESC']+'</h3>\
                <div class="ui-grid-a">';
    if ($(mxml).find('[tag="700"],[tag="710"],[tag="720"],[tag="701"],[tag="711"],[tag="721"],[tag="702"],[tag="712"],[tag="722"],[tag="716"]').size() > 0 && ccode != journalLabel) { 
    // Author(s) (7XX)
    html += '<div class="ui-block-a">'+dictionary['FD_AUTHOR']+(($(mxml).find('[tag="700"],[tag="710"],[tag="720"],[tag="701"],[tag="711"],[tag="721"],[tag="702"],[tag="712"],[tag="722"],[tag="716"]').size() > 1)?'s':'')+'</div>'+
            '<div class="ui-block-b">'+mx.tmp7XX(700)+mx.tmp7XX(710)+mx.tmp7XX(720)+mx.tmp7XX(701)+mx.tmp7XX(711)+mx.tmp7XX(721)+mx.tmp7XX(702)+mx.tmp7XX(712)+mx.tmp7XX(722)+mx.tmp7XX(716)+'</div>';
    }
    // Editor(s) (210)
    html += mx.tmp210();
    // Edition (205)
    html += mx.tmp205();
    // Collection (410)
    html += mx.tmp410();
    // ISBN (010)
    html += mx.tmp01X('010','ISBN');
    // ISSN (011)
    html += mx.tmp01X('011','ISSN');
    html += '</div></div>';
    // Subjects (6XX)
    html += mx.tmp6XX();
    var url = default_url+'cgi-bin/koha/opac-detail.pl?biblionumber='+$_GET['id'];
    // Display collapsible list of share link (mail, facebook, twitter, linkedin, delicious and google plus)
    html += '<div data-role="collapsible" class="share" data-theme="c" data-content-theme="c">\
                <h3>'+dictionary['DE_SHARE']+'</h3>\
                <div>\
                    <a data-role="button" target="_blank" href="mailto:?subject='+title+'&body='+title+' - ('+url+')"><img src="styles/images/social-icons/mail.png" alt="Mail"/>Mail</a>\
                    <a data-role="button" target="_blank" href="http://www.facebook.com/sharer.php?u='+url+'&t='+title+'"><img src="styles/images/social-icons/facebook.png" alt="Facebook"/>Facebook</a>\
                    <a data-role="button" target="_blank" href="http://twitter.com/share?url='+url+'&text='+title+' : "><img src="styles/images/social-icons/twitter.png" alt="Twitter"/>Twitter</a>\
                    <a data-role="button" target="_blank" href="http://www.linkedin.com/shareArticle?mini=true&url='+url+'&title='+title+'"><img src="styles/images/social-icons/linkedin.png" alt="LinkedIn"/>LinkedIn</a>\
                    <a data-role="button" target="_blank" href="http://www.delicious.com/save?url='+url+'&title='+title+'"><img src="styles/images/social-icons/delicious.png" alt="Delicious"/>Delicious</a>\
                    <a data-role="button" target="_blank" href="http://plus.google.com/share?url='+url+'&title='+title+'&hl=fr"><img src="styles/images/social-icons/googleplus.png" alt="Google Plus"/>Google +</a>\
                </div>\
            </div>';
    // URLs (856)
    html += mx.tmp856();
         
    // If document type isn't a journal, display exemplaries
    if (ccode != journalLabel) {
        html += '<ul id="detail-exemplaire" data-role="listview" data-inset="true">'+
                    '<li data-role="list-divider">'+dictionary['DE_HOLDING']+($(xml).find('item').size()>1?'s':'')+'</li>';
        if ($(xml).find('item').size() > 0) {
            $(xml).find('item').each(function() {
                html += '<li>'+
                            '<h3>'+biblios[$(this).find('homebranch').text()]+'</h3>'+
                            '<p>'+sublocations[$(this).find('location').text()]+'</p>'+
                            '<p>'+dictionary['FD_CALL_NUMBER']+' : <strong>'+$(this).find('itemcallnumber').text()+'</strong></p>';
                if ($(this).find('onloan').size() > 0) {
                    var rd = new Date($(this).find('onloan').text());
                    html += '<p class="dispo red">'+dictionary['DE_CHECKED_OUT']+' - '+dictionary['DE_BACK_ON']+' : '+rd.toString(dictionary['CAL_DATE_FORMAT'])+'</p>';
                } else if ($(this).find('wthdrawn').text() == '1') {
                    html += '<p class="dispo red">'+dictionary['DE_ITEM_WITHDRAWN']+'</p>';
                } else if ($(this).find('itemlost').text() == '1') {
                    html += '<p class="dispo red">'+dictionary['DE_ITEM_LOST']+'</p>';
                } else if ($(this).find('damaged').text() == '1') {
                    html += '<p class="dispo red">'+dictionary['DE_ITEM_DAMAGED']+'</p>';
                } else switch($(this).find('notforloan').text()) {
                    case '0' :
                        if (biblios[$(this).find('homebranch').text()] == biblios['BEL']) {
                            html += '<p class="dispo blue">'+dictionary['AV_ONLINE']+'</p>';
                        } else {
                            html += '<p class="dispo green">'+dictionary['AV_AVAILABLE']+'</p>';
                        }
                        break;
                    case '1' : case '2' : case '4' : case '5' : case '6' : case '7' :
                        html += '<p class="dispo orange">'+etats[$(this).find('notforloan').text()]+'</p>';
                        break;
                    default :
                        html += '<p class="dispo red">'+etats[$(this).find('notforloan').text()]+'</p>';
                }
                html += '</li>';
            });
        } else {
            html += '<li>'+dictionary['DE_NO_HOLDING']+'</li>';
        }
        html += '</ul>';
    }
    // Else, display collection status from 930 and 955 fields
    else {
        html += mx.tmp930_955();
    }
    return html;
}

// Replace blank 1*1px amazon image by default span
function replaceWrongImage() {
	jQuery('img.cover_image[src^="http://images.amazon.com"]').each(function() {
		jQuery(this).bind('load',function() {
			var img = jQuery(this);
			if ((!jQuery.browser.msie && img[0].naturalWidth == 1)
			|| (jQuery.browser.msie && getNatural(img[0]).width == 1)) {
				img.parent().append("<span class='nocover'></span>");
				img.detach();
			}
		}).attr('src',jQuery(this).attr('src'));
	});
}


// Prepare the CQL query and search page title from get parametters
function prepareQuery() {
    var typesQuery = '';
    var typesString = '';
    // Define selected types parsing bit string passed on $_GET['t'] 
    if ($_GET['t'] != undefined && $_GET['t'] != 'ALL') {
        var chosenTypes = new Array();
        var typeskeys = Object.keys(types);
        // For each $_GET['t'] string to fill chosenTypes array with coded values of selected types
        for (var i = 0 ; i < $_GET['t'].length ; i++) {
            if ($_GET['t'][i] == 1 && i < typeskeys.length) {
                chosenTypes.push(typeskeys[i]);
            }
        }
        typesString = dictionary['LI_OF'];
        // For each chosenTypes array to complete type part of the CQL query and type part of the title
        $(chosenTypes).each(function(index) {
            if (index != 0) {
                typesQuery += ' or ';
                if (index == chosenTypes.length-1) {
                    typesString += dictionary['LI_OR'];
                } else {
                    typesString += ', ';
                }
            }
            typesQuery += 'dc.itemtype='+this;
            typesString += types[this][0].toLowerCase();
        });
    } else {
        // If no type is selected, set type part of the title to "d'un document"
        typesString = dictionary['LI_A_DOCUMENT'];
    }
    var kw = '';
    var title = dictionary['LI_SEARCH_FOR'];
    // If $_GET['i'] isn't set, set to 'any'
    var i = $_GET['i'] || 'any';
    // If query value is asterisk, simply set title and query with types
    if ($_GET['q'] == '*') {
        title += typesString;
        kw = typesQuery;
    } else {
        // If no index selected set title to '<types> avec le(s) mot-clé(s) "<query>"'
        if (i == 'any') {
            title += typesString+dictionary['LI_WITH_KEYWORD']+'"'+$_GET['q']+'"';
        }
        // Else set title to '<types> ayant comme <index> "<query>"'
        else {
            title += typesString+dictionary['LI_HAVING_AS']+lcfirst(getOptionLabel($_GET['i']))+' "'+$_GET['q']+'"';
        }
        // Make CQL query and add type restriction if types selected
        kw = 'dc.'+i+' all/relevant "'+myunescape($_GET['q'])+'"';
        if (typesQuery != '')   kw += ' and ('+typesQuery+')';
    }
    // Set page title and call getRecords
    $('head title').text(titleBase+' - '+title);
    getRecords(kw);
}

// In advenced search popup, update types list title with number of selected types
function updateTypeListLabel() {
    // Count the selected types
    var n = $('#itype option[value="1"]:selected').size();
    // If 0 type is selected, set displayed counter to "None" and set title in red, else set title in default color
    if (n == 0) {
        n = dictionary['TY_NONE'];
        element_theme_refresh($('#itype .ui-collapsible-heading-toggle'),'a','g');
    } else {
        element_theme_refresh($('#itype .ui-collapsible-heading-toggle'),'g','a');
    }
    // If all types are selected, set displayed counter to "All"
    if (n == $('#itype select').size()) {
        n = dictionary['TY_ALL'];
    }
    // Replace types list title with "Types (<None|n|All>)" and refresh types list
    $('#itype h3 .ui-btn-text').text(dictionary['TY_TYPES']+' ('+n+')');
    $('#itype').trigger('create');
}

// Apply a theme to a jQm element
function element_theme_refresh( element, oldTheme, newTheme ) {
    // Update the element's new data theme.
    if( $(element).attr('data-theme') ) {
        $(element).attr('data-theme', newTheme);
    }
    if( $(element).attr('class') ) {
        // Theme classes end in "-[a-z]$", so match that
        var classPattern = new RegExp('-' + oldTheme + '$');
        newTheme = '-' + newTheme;
        var classes =  $(element).attr('class').split(' ');
        for( var key in classes ) {
            if( classPattern.test( classes[key] ) ) {
                classes[key] = classes[key].replace( classPattern, newTheme );
            }
        }
        $(element).attr('class', classes.join(' '));
    }
}
