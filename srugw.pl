#!/usr/bin/perl
# Simple SRU gateway
# Stefano Bargioni 2011-06-20 - Pontificia Università della Santa Croce - Rome

# This is free software; you can redistribute it and/or modify it under the
# terms of the GNU General Public License as published by the Free Software
# Foundation; either version 2 of the License, or (at your option) any later
# version.
#
# It is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with Koha; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

use strict;
use URI::Escape;
use CGI::Pretty ":standard";

# Change these values depending on your SRU server
my $server = ''; #example : opac.library.university.edu
my $server_port = '9998';

my $w = new CGI;
my $version 		= $w->param('version') || '1.2';
my $operation 		= $w->param('operation') || 'searchRetrieve';
my $query 			= $w->param('query') || die();
my $startRecord		= $w->param('startRecord');
my $maximumRecords 	= $w->param('maximumRecords');
my $recordPacking 	= $w->param('recordPacking');
my $recordSchema 	= $w->param('recordSchema');
my $recordXPath 	= $w->param('recordXPath');
my $resultSetTTL	= $w->param('resultSetTTL');
my $sortKeys 		= $w->param('sortKeys');
my $stylesheet 		= $w->param('stylesheet');
my $extraRequestData= $w->param('extraRequestData');
my $recordIdentifier= $w->param('recordIdentifier'); # verion 1.2 only

my $preserveNamespace = $w->param('preserveNamespace') || 0; # set it to 1 to preserve zs namespace

$query				= uri_escape($query);
$startRecord		= "&startRecord=$startRecord" if ($startRecord);
$maximumRecords		= "&maximumRecords=$maximumRecords" if ($maximumRecords);
$recordPacking		= "&recordPacking=$recordPacking" if ($recordPacking);
$recordSchema		= "&recordSchema=$recordSchema" if ($recordSchema);
$recordXPath		= "&recordXPath=$recordXPath" if ($recordXPath);
$resultSetTTL		= "&resultSetTTL=$resultSetTTL" if ($resultSetTTL);
$sortKeys			= "&sortKeys=$sortKeys" if ($sortKeys);
$stylesheet			= "&stylesheet=$stylesheet" if ($stylesheet);
$extraRequestData	= "&extraRequestData=$extraRequestData" if ($extraRequestData);
$recordIdentifier	= "&recordIdentifier=$recordIdentifier" if ($recordIdentifier);

print $w->header('text/xml; charset=utf-8');
my $xml = `/usr/bin/curl -s 'http://$server:$server_port/biblios?version=$version&operation=$operation&query=$query$startRecord$maximumRecords$recordPacking$recordSchema$recordXPath$resultSetTTL$sortKeys$stylesheet$extraRequestData$recordIdentifier'`;
if ($preserveNamespace==0) {
	$xml =~ s/zs://g; # in some cases can be useful to remove the namespace
	$xml =~ s/ xmlns:zs="http:\/\/www.loc.gov\/zing\/srw\/"//;
}
print $xml;
