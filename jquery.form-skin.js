/**
* @license
* jQuery Form skinning
*
* Copyright (c) 2011 Boomworks <http://boomworks.com.au/>
* Author: Lindsay Evans
* Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
*/
(function($) {

	$.fn.skin = function(opts){

		// Merge user supplied options with defaults
		var options = $.extend({}, $.fn.skin.defaults, opts);

		this.each(function(){

			var $this = $(this),
					type = $this.attr('type'),
					field_class, field_role,
					$skinned, inner_html = ''
			;

			if($this.is('select')){
				type = 'select';
			}

			if(type === 'checkbox'){
				field_class = 'ui-checkbox';
				field_role = 'checkbox';
			}else if(type === 'radio'){
				field_class = 'ui-radio';
				field_role = 'radio';
			}else if(type === 'select'){
				field_class = 'ui-select';
				field_role = 'listbox';
			}

			// Render skinned element
			$skinned = $('<div class="' + field_class + '" role="' + field_role + '" tabindex="0"/>').insertAfter($this);

			// Add options to select
			if(type === 'select'){
				inner_html += '<div class="ui-select-label">' + $this.find('option:selected').text() + '</div>';
				inner_html += '<ul class="ui-list-options">';
				$this.find('option').each(function(i){
					inner_html += '<li class="ui-list-option" role="option" data-value="' +  $(this).attr('value') + '">' + $(this).html() + '</li>';
				});
				inner_html += '</ul>';
				$(inner_html).appendTo($skinned);

				$skinned.css({width: $skinned.find('.ui-list-options').width() + 46});
				$skinned.find('.ui-list-options').css({width: $skinned.width() - 33});

			}

			// Fix for IE7 not supporting inline-block
			if(document.all && !document.querySelectorAll){
				$skinned.css({zoom: 1, display: 'inline'});
			}

			$skinned.attr('data-for', $this.attr('id'));
			$skinned.attr('data-group', $this.attr('name'));

			// Hide field
			//$this.hide();
			$this.css({position: 'absolute', left: -9999}).attr('tabindex', '-1');

			// Bind various events to target field
			$skinned
				.bind('now click ui:click keydown ui:keydown', function(e){
					switch(type){
						case 'checkbox':
							handle_checkbox_events($this, $skinned, e);
							break;
						case 'radio':
							handle_radio_events($this, $skinned, e);
							break;
						case 'select':
							handle_select_events($this, $skinned, e);
							break;
					}
				})

				.bind('focus ui:focus', function(e){
					switch(type){
						case 'radio':
							handle_radio_focus($this, $skinned, e);
							break;
					}
				})

				// Trigger now event to set initial state etc
				.trigger('now')
			;

			// Bind click to associated label
			// FIXME: Is propagating in IE7
			$('label[for=' + $this.attr('id') + ']')
				.removeAttr('for')
				.bind('click', function(e){
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
					$skinned.trigger('click').trigger('focus');
				})
			;

		});

		return this;
	};

	function handle_checkbox_events($radio, $skinned, e){
		var $radio_group = $(':checkbox[name=' + $radio.attr('name') + ']'),
				$skinned_group = $('[data-group=' + $radio.attr('name') + ']')
		;

		e.stopPropagation();

		switch(e.type){
			case 'click':
				if($radio.is(':checked')){
					$radio.removeAttr('checked');
					$radio[0].checked = false;
				}else{
					$radio.attr('checked', 'checked');
				}
				break;

			case 'keydown':
				// Change state on spacebar press
				if(e.keyCode === 32){
					e.preventDefault();
					e.stopImmediatePropagation();
					if($radio.is(':checked')){
						$radio.removeAttr('checked');
					}else{
						$radio.attr('checked', 'true');
					}
				}

				// Focus next/previous checkbox on arrow press
				var new_radio;
				if(e.keyCode === 37 || e.keyCode === 38){
					// Previous
					$radio_group.each(function(i){
						if($(this).attr('id') == $radio.attr('id')){
							if(i === 0){
								new_radio = $radio_group[$radio_group.length - 1];
							}else{
								new_radio = $radio_group[i - 1];
							}
							return;
						}
					});
				}else if(e.keyCode === 39 || e.keyCode === 40){
					// Next
					$radio_group.each(function(i){
						if($(this).attr('id') == $radio.attr('id')){
							if(i === $radio_group.length - 1){
								new_radio = $radio_group[0];
							}else{
								new_radio = $radio_group[i + 1];
							}
							return;
						}
					});
				}

				if(new_radio){
					e.preventDefault();
					e.stopImmediatePropagation();
					$('[data-for=' + $(new_radio).attr('id') + ']').trigger('focus');
					return;
				}

				break;

		}

		// Set class & attributes based on state			
		if($radio.is(':checked')){
			$skinned.addClass('ui-checked');
			$skinned.attr('aria-checked', 'true');
		}else{
			$skinned.removeClass('ui-checked');
			$skinned.attr('aria-checked', 'false');
		}

	}

	function handle_radio_events($radio, $skinned, e){

		var $radio_group = $(':radio[name=' + $radio.attr('name') + ']'),
				$skinned_group = $('[data-group=' + $radio.attr('name') + ']')
		;

		e.stopPropagation();

		switch(e.type){
			case 'click':
				if(!$radio.is(':checked')){
					$radio.attr('checked', 'checked');
					$radio.trigger('change');
				}
				break;

			case 'keydown':

				// Skip over radio group on tab/shift tab
				// - cycles focus through when none checked in group
				if(e.keyCode === 9){

					var same_group = false, tabbable = $(':visible:tabbable').toArray(), tabbable_length = tabbable.length, i = 0;

					if(e.shiftKey){
						tabbable = tabbable.reverse();
					}

					for(i; i < tabbable_length; i++){
						var $this = $(tabbable[i]);
						if(!same_group && $this.attr('data-group') === $skinned.attr('data-group')){
							same_group = true;
						}
						if(same_group && $this.attr('data-group') !== $skinned.attr('data-group')){
							$this.focus();
							e.preventDefault();
							return false;
						}
					}

				}

				// Select currently focused radio button on space
				if(e.keyCode === 32){
					if(!$radio.is(':checked')){
						$radio.attr('checked', 'checked');
						$radio.trigger('change');
					}
				}

				// Set state & focus next/previous radio on arrow press
				var new_radio;
				if(e.keyCode === 37 || e.keyCode === 38){
					// Previous
					$radio_group.each(function(i){
						if($(this).attr('id') == $radio.attr('id')){
							if(i === 0){
								new_radio = $radio_group[$radio_group.length - 1];
							}else{
								new_radio = $radio_group[i - 1];
							}
							return;
						}
					});
				}else if(e.keyCode === 39 || e.keyCode === 40){
					// Next
					$radio_group.each(function(i){
						if($(this).attr('id') == $radio.attr('id')){
							if(i === $radio_group.length - 1){
								new_radio = $radio_group[0];
							}else{
								new_radio = $radio_group[i + 1];
							}
							return;
						}
					});
				}

				if(new_radio){
					e.preventDefault();
					e.stopImmediatePropagation();
					$('[data-for=' + $(new_radio).attr('id') + ']').trigger('click').trigger('focus');
					return;
				}

				break;

		}

		if(e.type !== 'now'){
			// Remove checked attr from non-checked radios in group
			$radio_group
				.not($radio)
				.removeAttr('checked')
			;

			$skinned_group
				.not($skinned)
				.removeClass('ui-checked')
				.attr('aria-checked', 'false')
			;
		}

		// Set class & attributes based on state			
		if($radio.is(':checked')){
			$skinned.addClass('ui-checked');
			$skinned.attr('aria-checked', 'true');
		}else{
			$skinned.removeClass('ui-checked');
			$skinned.attr('aria-checked', 'false');
		}

	}

	function handle_radio_focus($radio, $skinned, e){

		var $radio_group = $(':radio[name=' + $radio.attr('name') + ']'),
				$skinned_group = $('[data-group=' + $radio.attr('name') + ']')
		;

		//e.stopPropagation();

		//console.log(e)

	}
	
	function handle_select_events($select, $skinned, e){

		var $clone;

		switch(e.type){
			case 'click':

				$('.ui-select.ui-expanded').removeClass('ui-expanded');
				$('body > .ui-list-options').remove();

				$clone = $skinned
					.find('.ui-list-options')
					.clone()
					.appendTo('body')
					.css({
						top: $skinned.offset().top + $skinned.height() + parseInt($skinned.css('padding-top')) + parseInt($skinned.css('padding-bottom')), 
						left: $skinned.offset().left
					})
					.show()
				;

				$skinned.addClass('ui-expanded');

				$('body').click(function(e){
					if($(e.target).is(':not(.ui-select-label)')){
						$skinned.removeClass('ui-expanded');
						$('body > .ui-list-options').remove();
						$('body').unbind('click');
					}
				});

				break;

			case 'keydown':
				// TODO: space = open, enter = close ???? (See UI guidelines)
				if(e.keyCode === 37 || e.keyCode === 38){
					// Previous

					// Display options list
					$('.ui-select.ui-expanded').removeClass('ui-expanded');
					$('body > .ui-list-options').remove();

					$clone = $skinned
						.find('.ui-list-options')
						.clone()
						.appendTo('body')
						.css({
							top: $skinned.offset().top + $skinned.height() + parseInt($skinned.css('padding-top')) + parseInt($skinned.css('padding-bottom')), 
							left: $skinned.offset().left
						})
						.show()
					;

					$skinned.addClass('ui-expanded');

					$('body').click(function(e){
						if($(e.target).is(':not(.ui-select-label)')){
							$skinned.removeClass('ui-expanded');
							$('body > .ui-list-options').remove();
							$('body').unbind('click');
						}
					});
					$skinned.blur(function(e){
						$skinned.removeClass('ui-expanded');
						$('body > .ui-list-options').remove();
					});

					// Highlight next field
					var next_option = $clone.find('[data-value='+$select.find('option:selected').val()+']').prev('.ui-list-option');
					if(!next_option.length){
						next_option = $clone.find('.ui-list-option:last-child');
					}
					next_option.addClass('ui-hover');
					$skinned.find('.ui-select-label').text(next_option.text());

					// Set select value
					var idx = next_option.index();
					$select.find('option:eq('+idx+')').attr('selected', 'selected');


					// Scroll select to selected option
					$clone.scrollTop(next_option.position().top - $clone.height() + next_option.height() + 15);

					// Stop page from scrolling
					e.preventDefault();
					e.stopImmediatePropagation();
					return;
				}else if(e.keyCode === 39 || e.keyCode === 40){
					// Next

					// Display options list
					$('.ui-select.ui-expanded').removeClass('ui-expanded');
					$('body > .ui-list-options').remove();

					$clone = $skinned
						.find('.ui-list-options')
						.clone()
						.appendTo('body')
						.css({
							top: $skinned.offset().top + $skinned.height() + parseInt($skinned.css('padding-top')) + parseInt($skinned.css('padding-bottom')), 
							left: $skinned.offset().left
						})
						.show()
					;

					$skinned.addClass('ui-expanded');

					$('body').click(function(e){
						if($(e.target).is(':not(.ui-select-label)')){
							$skinned.removeClass('ui-expanded');
							$('body > .ui-list-options').remove();
							$('body').unbind('click');
						}
					});
					$skinned.blur(function(e){
						$skinned.removeClass('ui-expanded');
						$('body > .ui-list-options').remove();
					});

					// Highlight next field
					var next_option = $clone.find('[data-value='+$select.find('option:selected').val()+']').next('.ui-list-option');
					if(!next_option.length){
						next_option = $clone.find('.ui-list-option:first-child');
					}
					next_option.addClass('ui-hover');
					$skinned.find('.ui-select-label').text(next_option.text());

					// Set select value
					var idx = next_option.index();
					$select.find('option:eq('+idx+')').attr('selected', 'selected');

					// Scroll select to selected option
					$clone.scrollTop(next_option.position().top - $clone.height() + next_option.height() + 15);

					// Stop page from scrolling
					e.preventDefault();
					e.stopImmediatePropagation();
					return;
				}

				break;

		}

		if($clone){
			$clone.find('.ui-list-option').bind('click', function(e){
				var value = $(this).data('value');
				$select.find('option[value='+value+']').attr('selected', 'selected');
				$skinned.find('.ui-select-label').html($(this).html());
			});
		}

	}


	// Default settings
	$.fn.skin.defaults = {
	};

})(jQuery);
