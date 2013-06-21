(function( $, window, undefined ) {
    function queryStringToObject( qstr ) {
        var result = {},
        nvPairs = (( qstr || "" ).replace( /^\?/, "" ).split( /&/ )), i, pair, n, v;
        for ( i = 0; i < nvPairs.length; i++ ) {
            var pstr = nvPairs[ i ];
            if ( pstr ) {
                pair = pstr.split( /=/ );
                n = pair[ 0 ];
                v = pair[ 1 ];
                if ( result[ n ] === undefined ) {
                    result[ n ] = v;
                } else {
                    if ( typeof result[ n ] !== "object" ) {
                        result[ n ] = [ result[ n ] ];
                    }
                    result[ n ].push( v );
                }
            }
        }
        
        return result;
    }
    $( document ).bind( "pagebeforechange", function( e, data ) {
        if ( typeof data.toPage === "string" ) {
            var u = $.mobile.path.parseUrl( data.toPage );
            if ( $.mobile.path.isEmbeddedPage( u ) ) {
                var u2 = $.mobile.path.parseUrl( u.hash.replace( /^#/, "" ) );
                if ( u2.search ) {
                    if ( !data.options.dataUrl ) {
                        data.options.dataUrl = data.toPage;
                    }
                    data.options.pageData = queryStringToObject( u2.search );
                    data.toPage = u.hrefNoHash + "#" + u2.pathname;
                }
            }
        }
    });
})( jQuery, window );
