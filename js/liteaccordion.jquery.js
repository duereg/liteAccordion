/*************************************************
*	project:  	liteAccordion - horizontal accordion plugin for jQuery
*	author:   	Nicola Hibbert
*	url:	  	http://nicolahibbert.com/horizontal-accordion-jquery-plugin
*	demo:	  	http://www.nicolahibbert.com/demo/liteAccordion
*
*	Version:  	1.1.5
*	Copyright: 	(c) 2010-2011 Nicola Hibbert
*   1.1.4:      Added Resizing Ability
*   1.1.5:      Added Left to Right OR Right to Left alignment of control
*   http://www.linkedin.com/pub/matt-blair/10/74a/345 
/*************************************************/
;(function($) {

	// core utility and animation methods
	function utils(target, options) {
			
		// defaults
		var defaults = {
			containerWidth : 960,
			containerHeight : 320,
			headerWidth : 48,
			
			firstSlide : 1, 
			onActivate : function() {},
			slideSpeed : 800,
			slideCallback : function() {},			
			
			autoPlay : false,
			pauseOnHover : false, 
			cycleSpeed : 6000,

			theme : 'basic', // basic, light*, dark, stitch*
			rounded : false,
			enumerateSlides : false,
            align: 'right'  // right, left
		};
	
		var $accordion 	= $(target);
		var data 		= $accordion.data("liteAccordion");
		if(!data){
			data = {};
			data.settings = $.extend({}, defaults, options);
			data.$slides 		 = $accordion.children('ol').children('li');
			data.$header 		 = data.$slides.children('h2');
			data.slideLen		 = data.$slides.length;
			data.playing 		 = 0;
            data.sentinel 		 = false;
        } else {
			//extend old settings with any new changes
			data.settings = $.extend(data.settings, options);
		}

        data.slideWidth = data.settings.containerWidth - (data.slideLen * data.settings.headerWidth);
        $accordion.data("liteAccordion", data);
		
		this.setCss = function() {
			data = $accordion.data("liteAccordion");
		
			// set container theme & corner style
			$accordion 
				.addClass(data.settings.theme)
				.addClass(data.settings.rounded && 'rounded');
			
			//set whether this accordion is left or right aligned
			$accordion.addClass(data.settings.align);
					
			//add enumeration if necessary
			if(data.settings.enumerateSlides && data.$header.find("b.es").length === 0)
			{
				data.$header.each(function(index) {
					var $this = $(this);
					// add number to bottom of tab
					$this.append($('<b>')
									.attr("id", "es" + (index + 1))
									.addClass("es")
									.append(index + 1)
								);
				});
			}
			
			// selected class
			data.$header
				.eq(data.settings.firstSlide - 1)
				.addClass('selected');	
		
			// ie :(
			if ($.browser.msie) {
				if ($.browser.version.substr(0,1) > 8) {
					data.$header.css('filter', 'none');
				} else if ($.browser.version.substr(0,1) < 7) {
					return false;
				}
			} 
		};
		
		this.dimension = function(newDimensions) { 
			//reload data from storage
			data = $accordion.data("liteAccordion");
			
			$accordion
				.height(data.settings.containerHeight)
				.width(data.settings.containerWidth);
				
			data.$header
				.width(data.settings.containerHeight)
				.height(data.settings.headerWidth)
				.next()
				.width(data.slideWidth);
				
			if(data.settings.align === "right"){
				data
					.$header
					.next()
					.css("padding-left", data.settings.headerWidth);
			} else { 
				data
					.$header
					.next()
					.css("padding-right", data.settings.headerWidth);
			}
		};
		
		this.positionElements = function() {
			//reload data from storage
			data = $accordion.data("liteAccordion");
			var selectedIndex = data.$header.index(data.$slides.find("h2.selected"));
			
			data.$header.each(function(index) {
				var $this = $(this);
				var left = index * data.settings.headerWidth;
				
				if(data.settings.align === "right"){
					if (index > selectedIndex) left += data.slideWidth;
					
					$this.css('left', left)
						 .next() 
						 .css('left', left); 
				} else { 
					if (index >= selectedIndex) left += data.slideWidth;
					
					$this.css('left', left)
						 .css('z-index', data.slideLen * 2 + 1 )
						 .next() 
						 .css('left', left - data.slideWidth)
						 .css('z-index', data.slideLen + 1 - index);
				}
				
						
			}); 
		};
		  
		this.handleEvents = function() {
			handleHover();
			handleClick();
		};
		
		this.remove = function () { 
			data.$header.unbind("click.liteAccordion");
			$accordion.unbind("hover.liteAccordion");
			$accordion.removeData('liteAccordion');
		};
		
		function handleHover () {
			// pause on hover			
			if (data.settings.pauseOnHover) {
				$accordion.bind("hover.liteAccordion", function() {
					pause();
				}, function() {
					//reload data from storage
					data = $accordion.data("liteAccordion");
					
					play(data.$header.index(data.$header.filter('.selected')));
				});
			}
					
			// start autoplay, call methods with no args = start from firstSlide
			data.settings.autoPlay && play();
		};
		
		function handleClick () { 
	
			// bind event handler for activating slides
			data.$header.bind("click.liteAccordion", function(e) {
				//reload data from storage
				data = $accordion.data("liteAccordion");
				
				var $clicked = $(this),
					$currSelected 	= data.$slides.find("h2.selected"),
					clickedIndex = data.$header.index($clicked),
					selectedIndex = data.$header.index($currSelected);
				
				//a different item has been selected that the currently selected item
				if (clickedIndex != selectedIndex) {	
					var $next = $clicked.next();
					var $group = null;
					var newPos = 0; 
										
					// set animation direction
					if(data.settings.align === "right"){

						if (clickedIndex < selectedIndex) {
							newPos = data.slideWidth;
							$group = data.$header.slice(clickedIndex + 1, selectedIndex + 1);
						} else  {
							newPos = -data.slideWidth;
							$group = data.$header.slice(selectedIndex + 1, clickedIndex + 1);
						}
					} else {

						if (clickedIndex < selectedIndex) {
							newPos = data.slideWidth;
							$group = data.$header.slice(clickedIndex, selectedIndex );
						} else  {
							newPos = -data.slideWidth;
							$group = data.$header.slice(selectedIndex, clickedIndex );
						}
					}
					
					// check if animation in progress
					if (!data.$header.is(':animated')) {

						// activate onclick callback with slide div as context		
						if (e.originalEvent) {
							if (data.sentinel === this) return false;
							data.settings.onActivate.call($next);
							data.sentinel = this;
						} else {
							data.settings.onActivate.call($next);
							data.sentinel = false;
						}

						// remove, then add selected class
						data.$header.removeClass('selected')
								    .filter($clicked)
								    .addClass('selected');
					
						// get group of tabs & animate			
						$group
							.animate({ left : '+=' + newPos }, 
								data.settings.slideSpeed, 
								function() { 		
									data.settings.slideCallback.call($next) 
								}
							)
							.next()
							.animate({ left : '+=' + newPos }, data.settings.slideSpeed);
					}
				} 
			});
		};
		
		function nextSlide (slideIndex) { 
			var slide = slideIndex + 1 || data.settings.firstSlide;

			// get index of next slide
			return function() {
				return slide++ % data.slideLen;
			}
		};
		
		function pause() {
			//reload data from storage
			data = $accordion.data("liteAccordion");
			
			clearInterval(data.playing);
		};
		
		function play (slideIndex) {
			//reload data from storage
			data = $accordion.data("liteAccordion");
			
			var getNext = nextSlide((slideIndex) ? slideIndex : ''), // create closure
				start = function() {
					data.$header.eq(getNext()).trigger("click.liteAccordion");
				};
			
			data.playing = setInterval(start, data.settings.cycleSpeed);			
		};
	};		
	
	// core utility and animation methods
	var	methods = {
		
		init : function(options) {	 
			return this.each(function() {  
				// merge defaults with options in new data.settings object				
				var horAccordion = new utils(this, options);
				
				//Set basic properties (classes, etc)
				horAccordion.setCss();
									
				//Set height and width of containers and headers
				horAccordion.dimension();
				
				//set initial header & slide positions
				horAccordion.positionElements();
				
				//Setup click, hover event handlers
				horAccordion.handleEvents();
			}); 
		},
		dimension : function(options) {
			return this.each(function() {  
				// merge defaults with options in new data.settings object				
				var horAccordion = new utils(this, options);
				
				//Set height and width of containers and headers
				horAccordion.dimension();  
				
				//set header & slide positions
				horAccordion.positionElements();
			});
		}
	};		
	
	$.fn.liteAccordion = function(method) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.liteAccordion' );
		}    			
	};
	
})(jQuery);