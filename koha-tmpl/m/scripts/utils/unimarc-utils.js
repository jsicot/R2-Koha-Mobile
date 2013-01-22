var ElectreRegex = /electre/ig;

function MarcXML(marcxml) {
    this.mx = marcxml ;
    var mx2 = marcxml ;
    this.tmp01X = function(tag, label) {
        var toReturn = '';
        if ($(this.mx).find('[tag="'+tag+'"] [code="a"]').size() > 0) {
            toReturn += '<div class="ui-block-a">'+label+'</div>'+
                        '<div class="ui-block-b">';
            $(this.mx).find('[tag="'+tag+'"]').each(function() {
                $(this).find('[code="a"]').each(function() {
                    toReturn += '<div class="'+label+'">'+$(this).text()+'</div>';
                    if (!$(this).next()) {
                        toReturn += ' ; ';
                    }
                });
            });
            toReturn += '</div>';
        }
        return toReturn;
    };
    this.tmp200 = function() {
        var toReturn = '';
        $(this.mx).find('[tag="200"]').each(function() {
            toReturn += '<h2>'+$(this).find('[code="a"]').first().text();
            if ($(this).find('[code="e"]').size() > 0) {
                $(this).find('[code="e"]').each(function() {
                    if ($(this).prevAll('[code="d"]').size() == 0) {
                        toReturn += ' : '+$(this).text();
                    }
                });
            }
            if ($(this).find('[code="d"]').size() > 0) {
                $(this).find('[code="d"]').each(function() {
                    toReturn += ' = '+$(this).text();
                    if ($(this).nextAll('[code="e"]').size > 0 && $(this).nextAll('[code="d"]').size > 0) {
                        $(this).nextAll('[code="e"]').each(function() {
                            if ($(this).nextAll('[code="d"]')) {
                                toReturn += ' : '+$(this).text();
                            }
                        });
                    }
                });
            }
            if ($(this).find('[code="h"]').size() > 0) {
                $(this).find('[code="h"]').each(function() {
                    toReturn += '. '+$(this).text();
                    if ($(this).next('[code="i"]').size() > 0) {
                        toReturn += ', '+$(this).next('[code="i"]').text();
                    }
                });
            }
            if ($(this).find('[code="i"]').size() > 0) {
                $(this).find('[code="i"]').each(function() {
                    if ($(this).prev('[code="h"]').size() == 0) {
                        toReturn += '. '+$(this).text();
                    }
                });
            }
            toReturn += '</h2>';
        })
        return toReturn;
    };
    this.tmp205 = function() {
        var toReturn = '';
        if ($(this.mx).find('[tag="205"] [code="a"]').size() > 0) {
            $(this.mx).find('[tag="205"]').each(function() {
                toReturn += '<div class="ui-block-a">'+dictionary['FD_ED_STAT']+'</div>'+
                        '<div class="ui-block-b">';
                if ($(this).find('[code="a"]').size() > 0) {
                    toReturn += $(this).find('[code="a"]').text();
                }
                if ($(this).find('[code="f"]').size() > 0) {
                    if ($(this).find('[code="a"]').size() > 0) {
                        toReturn += ' / ';
                    }
                    toReturn += $(this).find('[code="f"]').text();
                }
                toReturn += '</div>';
            });
        }
        return toReturn;
    };
    this.tmp210 = function() {
        var toReturn = '';
        if ($(this.mx).find('[tag="210"] [code="c"]').size() > 0) {
            var datepubli = $(this.mx).find('[tag="100"] [code="a"]').text().substring(9,13);
            toReturn += '<div class="ui-block-a">'+dictionary['FD_PUBLISHER']+(($(this.mx).find('[tag="210"]').size() > 1)?'s':'')+'</div>'+
                        '<div class="ui-block-b">';
            $(this.mx).find('[tag="210"]').each(function() {
                toReturn += '<div class="subjectline">'+$(this).find('[code="a"]').text();
                if ($(this).find('[code="c"]').size() > 0) {
                    if ($(this).find('[code="a"]').size() > 0) {
                        toReturn += ' : ';
                    }
                    var s = '';
                    $(this).find('[code="c"]').each(function() {
                        s += $(this).text()+' ';
                    });
                    s = s.substring(0,s.length-1);
                    toReturn += '<a data-direction="reverse" href="/m/#result?i=publisher&q='+myescape(s)+'">'+s+'</a>';
                }
                if ($(this).find('[code="d"]').size() > 0) {
                    if ($(this).find('[code="a"],[code="c"]').size() > 0) {
                        toReturn += ', ';
                    }
                    toReturn += datepubli;
                }
                toReturn += '</div>';
            });
            toReturn += '</div>';
        }
        return toReturn;
    };
    this.tmp410 = function() {
        var toReturn = '';
        if ($(this.mx).find('[tag="410"]').size() > 0) {
            toReturn += '<div class="ui-block-a">'+dictionary['FD_SERIES']+'</div>'+
                        '<div class="ui-block-b">';
            $(this.mx).find('[tag="410"]').each(function() {
                toReturn += '<div class="subjectline">';
                if ($(this).find('[code="t"]').size() > 0) {
                    toReturn += '<a href="/m/#result?i=serie&q='+myescape($(this).find('[code="t"]').text())+'" tittle="'+dictionary['DE_COLL_LINK']+'">'+$(this).find('[code="t"]').text()+'</a>';
                }
                if ($(this).find('[code="v"]').size() > 0) {
                    $(this).find('[code="v"]').each(function() {
                        toReturn += ', n°'+$(this).text();
                    });
                }
                toReturn += '</div>';
            });
            toReturn += '</div>';
        }
        return toReturn;
    };
    this.tmp6XX = function() {
        var toReturn = '';
        if ($(this.mx).find('[tag="600"],[tag="601"],[tag="606"],[tag="607"],[tag="610"]').size() > 0) {
            toReturn += '<div data-role="collapsible" data-theme="e" data-content-theme="a">\
                            <h3>'+dictionary['FD_SUBJECT']+'s</h3>\
                            <div class="sujets">';
            $(this.mx).find('[tag="600"],[tag="601"],[tag="606"],[tag="607"],[tag="610"]').each(function() {
                var gluLink = '';
                toReturn += '<div>';
                $(this).find('[code="a"],'+(($(this).attr('tag') != '600')?'[code="b"],':'')+'[code="j"],[code="x"],[code="y"],[code="z"]').each(function() {
                    var value = '';
                    if ($(this).parent().attr('tag') == '600' && $(this).attr('code') == 'a' && $(this).next().attr('code') == 'b')
                        value += $(this).next().text()+' ';
                    value += $(this).text();
                    if ($(this).parent().attr('tag') == '600' && $(this).attr('code') == 'a' && $(this).nextAll('[code="f"]').size() > 0)
                        value += ' ('+$(this).nextAll('[code="f"]').text()+')';
                    if (gluLink != '')
                        gluLink += ' ';
                    gluLink += removeSpecChar(value);
                    toReturn += '<div data-role="controlgroup" data-type="horizontal" data-mini="true">';
                    var prevCount = $(this).prevAll('[code="a"],[code="j"],[code="x"],[code="y"],[code="z"]').size();
                    if (prevCount > 0) {
                        toReturn += '<a data-role="button" data-icon="plus" data-iconpos="notext" data-inline="true" class="glu" style="margin-left:'+((prevCount-1)*23)+'px" href="/m/#result?i=subject&amp;q='+myescape(gluLink)+'" title="'+dictionary['DE_LAUNCH_SRCH_ON']+' '+dictionary['DE_SUBJECTS']+' : '+gluLink+'">+</a> ';
                    }
                    toReturn += '<a data-role="button" data-inline="true" style="max-width:'+($(window).width()-64-(prevCount*23))+'px" href="/m/#result?i=subject&amp;q='+myescape(removeSpecChar(value))+'" title="'+dictionary['DE_LAUNCH_SRCH_ON']+' '+dictionary['DE_SUBJECT']+' : '+value+'">'+value+'</a> ';
                    toReturn += '</div>';
                });
                toReturn += '</div>';
            });
            toReturn += '</div></div>';
        }
        return toReturn;
    };
    this.tmp7XX = function(tag) {
        var toReturn = '';
        if ($(this.mx).find('[tag="'+tag+'"]').size() > 0) {
            toReturn += '<span class="value">';
            $(this.mx).find('[tag="'+tag+'"]').each(function() {
                toReturn += '<div><a data-direction="reverse" href="/m/#result?i=author&q='+
                        myescape($(this).find('[code="a"]').text()+' '+$(this).find('[code="b"]').text())+'">';
                //var filter = '[code="a"],[code="b"],[code="4"],[code="c"],[code="d"],[code="f"],[code="g"],[code="p"]';
                var filter = '[code="a"],[code="b"],[code="c"],[code="d"],[code="f"],[code="g"],[code="p"]';
                $(this).find(filter).each(function() {
                   /* if ($(this).attr('code') == 4) {
                        toReturn += qualif[$(this).text()];
                    } else {*/
                        toReturn += $(this).text();
                   /* }*/
                    if ($(this).nextAll(filter).size() > 0) {
                        toReturn += ', ';
                    }
                });
                toReturn += '</a></div>'
            });
            toReturn += '</span>';
        }
        return toReturn;
    };
    this.tmp856 = function() {
        var toReturn = '';
        if ($(this.mx).find('[tag="856"]').size() > 0) {
            toReturn += '<ul id="detail-exemplaire" data-role="listview" data-inset="true" data-theme="c">'
            var selector = '';
            if ($(this.mx).find('[tag="856"] [code="u"]:contains("scdbases.uhb.fr")').size() > 0) {
                selector = '[tag="856"]:has([code="u"]:contains("scdbases.uhb.fr"))';
            } else if ($(this.mx).find('[tag="856"] [code="5"]').size() > 0) {
                selector = '[tag="856"]:has([code="5"])';
            } else {
                selector = '[tag="856"]';
            }
            $(this.mx).find(selector).each(function() {
                var url = $(this).find('[code="u"]').text();
                if (ElectreRegex.test(url) == 0){
                    var label = $(this).find('[code="z"]').text() || dictionary['DE_CONSULT_ONLINE'];
                    toReturn += '<li><a href="'+$(this).find('[code="u"]').text()+'"  title="'+label+'" target="_blank">'+label+'</a></li>';
                }
            });
            toReturn += '</ul>';
        }
        return toReturn;
    };
    this.tmp930_955 = function() {
        toReturn = '';
        if ($(this.mx).find('[tag="930"] [code="a"]').size() > 0) {
            toReturn += '<ul id="detail-exemplaire" data-role="listview" data-inset="true">'+
                            '<li data-role="list-divider">'+dictionary['DE_SERIES_STATE']+'</li>';
            $(this.mx).find('[tag="930"]').each(function() {
                var aRCR =$(this).find('[code="b"]').text();
                toReturn += '<li><h3>'+RCR[aRCR]+'</h3>';
                if ($(this).find('[code="a"]').size() > 0)  toReturn += '<p>Cote : <strong>'+$(this).find('[code="a"]').text()+'</strong></p>';
                $(mx2).find('[tag="955"]').each(function() {
                //alert(aRCR);
                var ilnRCR = $(this).find('[code="5"]').text();
                if(ilnRCR.indexOf(aRCR) == 0){
                    if ($(this).find('[code="r"]').text() != '')    toReturn += '<p class="collection">'+$(this).find('[code="r"]').text()+'</p>';
                }
               });
                toReturn += '</li>';
            });
            toReturn += '</ul>';
        }
        return toReturn;
    };
    this.director7xxSurname = function() {
        return $(this.mx).find('[tag="700"]:has([code="4"]:contains("300")),'+
                            '[tag="710"]:has([code="4"]:contains("300")),'+
                            '[tag="720"]:has([code="4"]:contains("300")),'+
                            '[tag="701"]:has([code="4"]:contains("300")),'+
                            '[tag="711"]:has([code="4"]:contains("300")),'+
                            '[tag="721"]:has([code="4"]:contains("300")),'+
                            '[tag="702"]:has([code="4"]:contains("300")),'+
                            '[tag="712"]:has([code="4"]:contains("300")),'+
                            '[tag="722"]:has([code="4"]:contains("300")),'+
                            '[tag="716"]:has([code="4"]:contains("300"))').find('[code="a"]').first().text();
    };
    this.director7xxFirstname = function() {
        return $(this.mx).find('[tag="700"]:has([code="4"]:contains("300")),'+
                            '[tag="710"]:has([code="4"]:contains("300")),'+
                            '[tag="720"]:has([code="4"]:contains("300")),'+
                            '[tag="701"]:has([code="4"]:contains("300")),'+
                            '[tag="711"]:has([code="4"]:contains("300")),'+
                            '[tag="721"]:has([code="4"]:contains("300")),'+
                            '[tag="702"]:has([code="4"]:contains("300")),'+
                            '[tag="712"]:has([code="4"]:contains("300")),'+
                            '[tag="722"]:has([code="4"]:contains("300")),'+
                            '[tag="716"]:has([code="4"]:contains("300"))').find('[code="b"]').first().text();
    };
}
