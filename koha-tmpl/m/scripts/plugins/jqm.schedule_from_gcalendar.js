(function($){
	$.fn.schedule_from_gcalendar = function(options) {
		var defaults = {
			userid : null,
			defaultdate : new Date()
		};
		options = $.extend(defaults, options);
		var token = false;
		var awaitingRequest = false;
		
		this.each(function(){
			var container = $(this);
			container.append($('<form id="daytraveler" action="" method="">'+
									'<input type="hidden" id="datepicker"/>'+
									'<div data-role="controlgroup" data-type="horizontal">'+
										'<a data-iconpos="notext" data-role="button" data-icon="arrow-l" id="previousDay">'+dictionary['CAL_PREV_DAY']+'</a>'+
										'<a data-role="button" id="datedisplay">Test</a>'+
										'<a data-iconpos="notext" data-role="button" data-icon="arrow-r" id="nextDay">'+dictionary['CAL_NEXT_DAY']+'</a>'+
									'</div>'+
								'</form>'));
			container.trigger('create');
			$('#datedisplay').addClass('ui-disabled');
			var dp = $('#datepicker');
			dp.datepicker({
				dateFormat: new String(dictionary['CAL_DATE_FORMAT'])
			});
			dp.datepicker('setDate',options.defaultdate);
			dp.change(function() {
				$('#datedisplay').find('.ui-btn-text').text(dp.val());
				var time = dp.datepicker('getDate').getTime()/1000;
				container.find('.libraryschedule').remove();
				var url = svc_dir+'gCalendar.php?userid='+options.userid+'&time='+time;
				if (token) {
					awaitingRequest = true;
				} else {
					token = true;
					container.append('<div class="myloader"><img src="styles/images/ajax-loader.gif" alt="'+dictionary['LOADING']+'"/></div>');
					$.ajax({
						type : 'GET',
						url : url,
						dataType : 'jsonp',
						success : function(data, textStatus, jqXHR) {
							var html = '';
							if (data.feed.entry) {
								html += '<ul class="libraryschedule" data-role="listview" data-inset="true" >';
								$.each(data.feed.entry,function(i,entry) {
								var str = entry.title.$t;
								html += '<li>'
									+'<div class="libraryname">'+str.substring(0,str.lastIndexOf(':'))+'</div>'
									+'<div class="openinghours">'+str.substring(str.lastIndexOf(':')+1,str.length)+'</div>'
									+'<br class="clear"/>'
									+'</li>';
								});
								html += '</ul>';
							} else {
								html += '<div class="libraryschedule">'+dictionary['CAL_NO_SCHEDULE']+'</div>';
							}
							container.find('.myloader').remove();
							container.append(html);
							container.trigger('create');
							token = false;
							if (awaitingRequest) {
								awaitingRequest = false;
								dp.change();
							}
						}
					});
				}
			}).change();
			$('#previousDay').click(function() {
				dp.datepicker('setDate',new Date(dp.datepicker('getDate').getTime()-86400000));
				dp.change();
			});
			$('#nextDay').click(function() {
				dp.datepicker('setDate',new Date(dp.datepicker('getDate').getTime()+86400000));
				dp.change();
			});
		});
		return this;
	};
})(jQuery);