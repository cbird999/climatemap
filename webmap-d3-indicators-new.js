var activeIndicator = 'dengue',
	indicators = ['dengue', 'heat', 'ozoneragweed', 'waterhigh', 'waterlow'],
	opacityLevel = 0.75,
	isAnimationRunning = false,
	fadeInDuration = 1000,
	fadeOutDuration = 1000,
	initialDelay = 0,
	layerClasses = {
		us: {
			data: {},
			class: 'states',
			field: 'postal'
		},
		dengue: {
			data: {},
			class: 'dengue',
			field: 'cat'
		},
		heat: {
			data: {},
			class: 'heat',
			field: 'catOver90Y'
		},
		ozoneragweed: {
			data: {},
			class: 'ozoneragweed',
			field: 'cat'
		},
		waterhigh: {
			data: {},
			class: 'waterhigh',
			field: 'catAvg95'
		},
		waterlow: {
			data: {},
			class: 'waterlow',
			field: 'catAvg5'
		},
		intro: {
		}
	};

// colors for indicator classes
var dengue0 = '#ddd'
 dengue1 = '#fdae6b'
 dengue2 = '#e6550d';
// heat
var heat0 = '#ddd'
 heat1 = '#fb6a4a'
 heat2 = '#de2d26'
 heat3 = '#a50f15';
// ozoneragweed
var ozoneragweed0 = '#ddd'
 ozoneragweed1 = '#9e9ac8'
 ozoneragweed2 = '#756bb1'
 ozoneragweed3 = '#54278f';
// waterhigh
var waterhigh0 = '#ddd'
 waterhigh1 = '#6baed6'
 waterhigh2 = '#3182bd'
 waterhigh3 = '#08519c';
// waterlow
var waterlow0 = '#ddd'
 waterlow1 = '#fd8d3c'
 waterlow2 = '#f03b20'
 waterlow3 = '#bd0026';

// add to legend information to layerClasses, i.e. 'category' and 'colors'
layerClasses.dengue.legend = {
  category: {
    0: 'None',
    1: 'Areas very vulnerable to infectious disease',
    2: 'High incidence of infectious diseases'
  },
  colors: {
    0: dengue0,
    1: dengue1,
    2: dengue2
  }
}
layerClasses.heat.legend = {
  category: {
		0: 'No data',
    1: 'Vulerability present but relatively low',
    2: 'Moderate threats from heat',
    3: 'Dangerously excessive heat'
  },
  colors: {
		0: heat0,
    1: heat1,
    2: heat2,
    3: heat3
  }
}
layerClasses.ozoneragweed.legend = {
  category: {
		0: 'No data',
    1: 'Vulerability present but relatively low',
    2: 'Moderate threats from ragweed and ozone',
    3: 'Dangerously high ragweed and ozone present'
  },
  colors: {
		0: ozoneragweed0,
    1: ozoneragweed1,
    2: ozoneragweed2,
    3: ozoneragweed3
  }
}
layerClasses.waterlow.legend = {
  category: {
		0: 'No data',
    1: 'Vulerability present but relatively low',
    2: 'Moderate threats from drought',
    3: 'Dangerously excessive drought'
  },
  colors: {
		0: waterlow0,
    1: waterlow1,
    2: waterlow2,
    3: waterlow3
  }
}
layerClasses.waterhigh.legend = {
  category: {
		0: 'No data',
    1: 'Vulerability present but relatively low',
    2: 'Moderate threats from flooding',
    3: 'Dangerously excessive flooding'
  },
  colors: {
		0: waterhigh0,
    1: waterhigh1,
    2: waterhigh2,
    3: waterhigh3
  }
}

// create SVG element and set width and height equal to its container's width and height...
var svg = d3.select('#map1').append('svg');
var width = parseInt(d3.select('#map1').style('width'));
var height = parseInt(d3.select('#map1').style('height'));
svg
  .style('width', width + 'px')
  .style('height', height + 'px');
	
var g = svg.append('g');

// create the tooltip container and subcontainers...
var tooltip = d3.select('body')
	.append('div')
	.style('visibility', 'hidden')
	.attr('class', 'tooltip');
tooltip
  .append('a')
  .attr('class', 'popup-close-button')
  .attr('href', '#close')
  .text('×');
var pcw = tooltip
  .append('div')
  .attr('class', 'popup-content-wrapper');
pcw
  .append('div')
  .attr('class', 'popup-title');
pcw
  .append('div')
  .attr('class', 'popup-content');

// temporary global variables for troubleshooting...
var us_diss_features,
	us_ak_features,
	us_hi_features,
	akBounds,
	hiBounds,
	path,
	dengue_features,
	heat_features,
	ozoneragweed_features,
	waterhigh_features,
	waterlow_features;

// starts initializing the map on page load...
var initViz = function () {
	$.when(
    $.getJSON('./json/web/us-topo.json'),
    $.getJSON('./json/web/dengue-topo.json'),
    $.getJSON('./json/web/heat-topo.json'),
    $.getJSON('./json/web/ozoneragweed-topo.json'),
    $.getJSON('./json/web/waterhigh-topo.json'),
    $.getJSON('./json/web/waterlow-topo.json')
	).done(function (us, dengue, heat, ozoneragweed, waterhigh, waterlow) {
    if (us[1] !== 'success') {						// check for more errors?!
      console.log('Error!', error);			// how to handle more nicely?!
    } else {
			console.log(us);
			createMap(us, dengue, heat, ozoneragweed, waterhigh, waterlow);
		}
	});
}; // end initViz

function createMap(us, dengue, heat, ozoneragweed, waterhigh, waterlow) {
	us_diss_features = topojson.feature(us[0], us[0].objects.us_albers_contiguous_diss).features;
	var width = parseInt(d3.select('#map1').style('width')),
		height = parseInt(d3.select('#map1').style('height'));
	var projection = d3.geo.albers();
	path = d3.geo.path()
		.projection(projection);
	projection
		.scale(1)
		.translate([0, 0]);
	var b = path.bounds(us_diss_features[0]);
	var b_s = b[0][1],
		b_n = b[1][1],
		b_w = b[0][0],
		b_e = b[1][0],
		b_height = Math.abs(b_n - b_s),
		b_width = Math.abs(b_e - b_w),
		s = 0.95 / Math.max(b_width / width, (b_height / height)),
		t = [(width - s * (b_e + b_w)) / 2, (height - s * (b_n + b_s)) / 2];
	projection
		.scale(s)
		.translate(t);
	
	layerClasses.us.data.contiguous = topojson.feature(us[0], us[0].objects.us_albers_contiguous).features;
	layerClasses.us.data.ak = topojson.feature(us[0], us[0].objects.us_albers_ak).features;
	layerClasses.us.data.hi = topojson.feature(us[0], us[0].objects.us_albers_hi).features;
	layerClasses.dengue.data['contiguous'] = topojson.feature(dengue[0], dengue[0].objects.dengue_contiguous).features;
	layerClasses.dengue.data['ak'] = '';
  layerClasses.dengue.data['hi'] = '';
	layerClasses.heat.data['contiguous'] = topojson.feature(heat[0], heat[0].objects.heat_contiguous).features;
	layerClasses.heat.data['ak'] = topojson.feature(heat[0], heat[0].objects.heat_ak).features;
	layerClasses.heat.data['hi'] = topojson.feature(heat[0], heat[0].objects.heat_hi).features;
	layerClasses.ozoneragweed.data['contiguous'] = topojson.feature(ozoneragweed[0], ozoneragweed[0].objects.ozoneragweed_contiguous).features;
	layerClasses.ozoneragweed.data['ak'] = topojson.feature(ozoneragweed[0], ozoneragweed[0].objects.ozoneragweed_ak).features;
	layerClasses.ozoneragweed.data['hi'] = topojson.feature(ozoneragweed[0], ozoneragweed[0].objects.ozoneragweed_hi).features;
	layerClasses.waterhigh.data['contiguous'] = topojson.feature(waterhigh[0], waterhigh[0].objects.waterhigh_contiguous).features;
	layerClasses.waterhigh.data['ak'] = topojson.feature(waterhigh[0], waterhigh[0].objects.waterhigh_ak).features;
	layerClasses.waterhigh.data['hi'] = topojson.feature(waterhigh[0], waterhigh[0].objects.waterhigh_hi).features;
	layerClasses.waterlow.data['contiguous'] = topojson.feature(waterlow[0], waterlow[0].objects.waterlow_contiguous).features;
	layerClasses.waterlow.data['ak'] = topojson.feature(waterlow[0], waterlow[0].objects.waterlow_ak).features;
	layerClasses.waterlow.data['hi'] = topojson.feature(waterlow[0], waterlow[0].objects.waterlow_hi).features;
	
	
	Object.keys(layerClasses.us.data).forEach(function(layerClass) {
		g.selectAll('.path')
		.data(layerClasses.us.data[layerClass])
		.enter()
		.append('path')
		.attr('class', function(d) { return 'states ' + layerClass + ' ' + d.properties.postal; })
		.attr('d', path)
		.on('mouseover', function(d,i) { hover(d, true); })
		.on('mouseout', function(d,i) { hover(d, false); })
		.on('click', function(d,i) {
			$('.tooltip .popup-title').html(tipTitle);
			$('.tooltip .popup-content').html(tipMsg);
			$('.tooltip .popup-content-wrapper').scrollTop(0);
			//var tt_width = $('.tooltip').width();
			//var tt_height = $('.tooltip').height();
			console.log(d3.event.pageX, d3.event.pageY);
			tooltip
				.style('top', (d3.event.pageY+5)+'px')
				.style('left',(d3.event.pageX+5)+'px')
				.style('opacity', '1')
				.style('visibility', 'visible');
			//$( 'html,body' ).animate( {
			//	scrollTop: $( '.tooltip' ).offset().top,
			//	}, 'slow' );
		});
	}); // end Object.keys(layerClasses.us.data).forEach
		
	indicators.forEach(function(lyr) {
		var thisLayer = layerClasses[lyr];
    // thisData refers to the object that holds the layer's data, e.g. layerClasses.dengue.data
    var thisData = thisLayer.data;
		Object.keys(thisData).forEach(function(layerDatum) {
			// thisDatum refers to each datum for the indicator, e.g. 'ak', 'hi', 'contiguous'
			var thisDatum = thisData[layerDatum];
      g.selectAll('.path')
				.data(thisDatum)
				.enter()
				.append('path')
				.attr('class', function(d) { 
					var newClasses = 'indicator ' + layerDatum + ' ' + thisLayer.class + ' ' +  thisLayer.class + '-cat-' + d.properties[thisLayer.field];
					return newClasses;
				})
				.attr('indicatorType', function() { return thisLayer.class; })
				.attr('animateState', 'none')
				.style('visibility', 'visible')
				.style('opacity', 0)
				.style('fill', function (d,i) { return thisLayer.legend.colors[d.properties[thisLayer.field]]; })
				.attr('d', path);
		}); //end Object.keys(thisData).forEach
	}); //end indicators.forEach
	
	akBounds = path.bounds(layerClasses.us.data['ak'][0]);
	hiBounds = path.bounds(layerClasses.us.data['hi'][0]);
	//console.log(path.bounds( d3.select('.TX')));
	//d3.selectAll('.ak').attr('transform', 'translate(50,460)scale(.5)');
  //d3.selectAll('.hi').attr('transform', 'translate(600,175)scale(1.1)');
} // end createMap

function startAnimation() {
  // Upon 'map view', startAnimation will  be triggered...
	// First show dengue with no delay; set duration for show/fade
	// Next layers will show/fade in sequence
	// Finally show dengue layer
	// Intro link in toggle menu will also trigger animation
	setTimeout(function() {isAnimationRunning = true;}, 500);
	startIndicatorAnimation();
	startHTMLAnimation();
} // end startAnimation

var postAnimationTimer,
		toggleTimers = {};
function startIndicatorAnimation() {
	// first set opacity of all indicator layers to 0 (immediately)
	// filter path objects for an opacity value != 0
	var visible = d3.selectAll('.indicator')
		.filter(function() {
			return window.getComputedStyle(this, null).getPropertyValue('opacity') != 0;
		});
	visible
		.style('opacity', '0')
		.attr('animateState', 'none');
	// obtain reference to each toggle link...
	var toggleLinks = $('.map1-toggle-menu a:not([name=\'intro\']').next();
	// then begin animation with each indicator layer in succession
	var layerCount = 0;
	var totalLayerDuration = fadeInDuration + fadeOutDuration;
	var fadeInDelay = 0,
			fadeOutDelay = 0;
	indicators.forEach(function(lyr) {
		var toggleLink = $('.map1-toggle-menu a[name=' + lyr + ']');
		var lyrClass = '.' + lyr;
		fadeInDelay = initialDelay + totalLayerDuration * layerCount;
    fadeOutDelay = fadeInDelay + fadeInDuration;
		toggleTimers[lyr] = {};
		toggleTimers[lyr]['start'] = setTimeout( 
			function() { toggleLink.addClass('active'); 
		}, fadeInDelay);
		toggleTimers[lyr]['end'] = setTimeout( function() { 
			toggleLink.removeClass('active'); 
		}, (fadeInDelay + fadeInDuration + fadeOutDuration));
    d3.selectAll(lyrClass)
      .transition()
      .delay(fadeInDelay)
      .duration(fadeInDuration)
      .style('opacity', opacityLevel)
			.attr('animateState', 'show')
			.transition()
			.delay(fadeOutDelay)
			.duration(fadeOutDuration)
			.style('opacity', 0)
			.attr('animateState', 'fade');
		layerCount++;
	});
	fadeInDelay = initialDelay + totalLayerDuration * layerCount;
  fadeOutDelay = fadeInDelay + fadeInDuration;
	d3.selectAll('.dengue')
		.transition()
		.delay(fadeInDelay)
		.duration(fadeInDuration)
		.style('opacity', opacityLevel)
		.attr('animateState', 'show')
	toggleTimers['dengue']['final'] = setTimeout(function() { 
		$('.map1-toggle-menu a[name=dengue]').addClass('active');
		$('.map1-toggle-menu a[name=intro]').removeClass('active');
		activeIndicator = 'dengue';
	}, fadeInDelay);
	postAnimationTimer = setTimeout(function() { 
		isAnimationRunning = false; 
	}, (fadeInDelay + fadeInDuration));

} //end startIndicatorAnimation

function startHTMLAnimation() {
	
} // end startHTMLAnimation

function stopAnimation() {
	// kill the post animation timer (which sets the isAnimationStopped boolean)...
	window.clearTimeout(postAnimationTimer);
	// kill all of the toggle timers
	Object.keys(toggleTimers).forEach(function (linkType) {
		Object.keys(toggleTimers[linkType]).forEach(function (t) {
			window.clearTimeout(toggleTimers[linkType][t]);
		});
	});
	// remove 'active' class from all toggle links...
	$('.map1-toggle-menu a').removeClass('active');
	// interrupt all transitions ocurring and scheduled on all indicator layers...
	d3.selectAll('.indicator')
		.interrupt()
		.transition()
		.delay(0);
	// get the layer that was paused; it should have an opacity > 0 (doesn't work!!!)...
	var activeLayer = d3.selectAll('.indicator')
		.filter(function() {
			return window.getComputedStyle(this, null).getPropertyValue('opacity') != 0;
		});
	// set opactiy of active layer to full...
	activeLayer
		.style('opacity', opacityLevel);
	// set global boolean to false...
	isAnimationRunning = false;	
	/// get the name of the active layer...
	activeIndicator = activeLayer.attr('indicatorType');
	console.log('the active layer is:', activeIndicator);
	// populate sidebar
	setSidebarHTML(activeIndicator);
	// set appropriate toggle link...
	$('.map1-toggle-menu a[name=' + activeIndicator + ']').addClass('active');
} // stopAnimation

function setSidebarHTML(activeIndicator) {
	$('.map1-sidebar .title').html(
		layerClasses[activeIndicator].title
	);
	$('.map1-sidebar .body').html(
		layerClasses[activeIndicator].body
	);
	if (activeIndicator != 'intro') {
		var legend = makeLegend(layerClasses[activeIndicator].legend);
	} else {
		var legend = '<h4 class=\'legend-text\'>No legend shown during animation</h4>';
	}
	$('.map1-sidebar .legend').html(
		legend
	);
} //end setSidebarHTML

function makeLegend(legendObject) {
	console.log(legendObject);
  var legendHTML = '';
  Object.keys(legendObject.category).forEach(function(val, i) {
    console.log(i, val, legendObject.colors[i]);
    legendHTML += '<div><i style="background:' + legendObject.colors[val] + '"></i>' +
			'<span class="legend-text">' + legendObject.category[val] + '</span></div>';
  });
  legendHTML += '</div>';
  return legendHTML;
} // end makeLegend

// events and misc functions
function hover(d, active) {
  var statePostal = d.properties.postal;
  console.log("hover event!", statePostal, d);
  var this_sel = d3.select("." + statePostal);
  if (active) {
    this_sel.classed({ 'hover': true })
    this_sel.moveToFront();        
  } else {
    this_sel.classed({ 'hover': false });
    this_sel.moveToBack(); 
  }
}

$('.map1-toggle-menu a').click(function(event) {
	event.preventDefault();
	console.log($(this)[0].name);
	var linkName = $(this)[0].name;
	if (linkName != activeIndicator) {
		$(this).addClass('active');
		$('.map1-toggle-menu a[name=' + activeIndicator + ']').removeClass('active');
		//Turn off activeIndicator layer
		d3.selectAll('.' + activeIndicator)
		.transition()
		.duration(500)
		.style('opacity', 0);
		//Turn on user-chosen class
		d3.selectAll('.' + linkName)
		.transition()
		.duration(500)
		.style('opacity', opacityLevel);
		activeIndicator = linkName;
		setSidebarHTML(activeIndicator)
	}
});

$(document).click(function(event) {
	if (isAnimationRunning === true) {
		console.log('stopping animation!')
			stopAnimation(); 
	} else {
		console.log('nothing to stop now!');
	}
	//console.log(event);
	//console.log(event.target.localName);
	//console.log(event.target.localName != 'path')    //g[0][0]);
	//if (event.originalTarget.parentNode != g[0][0]) {
	if (event.target.localName != 'path') {
		tooltip
			.style('opacity', '0')
			.style("visibility", "hidden");
	} else {

	}
});

$('#intro').on('click', function (event) {
	event.preventDefault();
	setSidebarHTML('intro');
	startAnimation();
});

$('.popup-close-button').on('click', function(event) {
	event.preventDefault();
	tooltip
		.style('opacity', '0')
		.style('visibility', 'hidden');
});

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() { 
  return this.each(function() { 
    var firstChild = this.parentNode.firstChild; 
    if (firstChild) { 
      this.parentNode.insertBefore(this, firstChild); 
    } 
  }); 
};

layerClasses.dengue.title = '<h4>Infectious Diseases: Dengue Fever, West Nile Virus, and Lyme Disease</h4>';
layerClasses.dengue.body = '<h5>While many infectious diseases were once all but eliminated from the United States, there\'s evidence that climate change is a factor that could help them expand their range and make a comeback.</h5>' +
  '<h5>Mosquitoes capable of carrying and transmitting diseases like Dengue Fever, for example, now live in at least 28 states. As temperatures increase and rainfall patterns change - and summers become longer - these insects can remain active for longer seasons and in wider areas, greatly increasing the risk for people who live there.</h5>';
layerClasses.heat.title = '<h4>Heat heat heat...Dengue Fever, West Nile Virus, and Lyme Disease</h4>';
layerClasses.heat.body = '<h5>While many infectious diseases were once all but eliminated from the United States, there\'s evidence that climate change is a factor that could help them expand their range and make a comeback.</h5>' +
  '<h5>Mosquitoes capable of carrying and transmitting diseases like Dengue Fever, for example, now live in at least 28 states. As temperatures increase and rainfall patterns change - and summers become longer - these insects can remain active for longer seasons and in wider areas, greatly increasing the risk for people who live there.</h5>';
layerClasses.ozoneragweed.title = '<h4>Air Pollution......ver, West Nile Virus, and Lyme Disease</h4>';
layerClasses.ozoneragweed.body = '<h5>While many infectious diseases were once all but eliminated from the United States, there\'s evidence that climate change is a factor that could help them expand their range and make a comeback.</h5>' +
  '<h5>Mosquitoes capable of carrying and transmitting diseases like Dengue Fever, for example, now live in at least 28 states. As temperatures increase and rainfall patterns change - and summers become longer - these insects can remain active for longer seasons and in wider areas, greatly increasing the risk for people who live there.</h5>';
layerClasses.waterhigh.title = '<h4>Flooding flooding .....ver, West Nile Virus, and Lyme Disease</h4>';
layerClasses.waterhigh.body = '<h5>While many infectious diseases were once all but eliminated from the United States, there\'s evidence that climate change is a factor that could help them expand their range and make a comeback.</h5>' +
  '<h5>Mosquitoes capable of carrying and transmitting diseases like Dengue Fever, for example, now live in at least 28 states. As temperatures increase and rainfall patterns change - and summers become longer - these insects can remain active for longer seasons and in wider areas, greatly increasing the risk for people who live there.</h5>';
layerClasses.waterlow.title = '<h4>Drought drought .....Fever, West Nile Virus, and Lyme Disease</h4>';
layerClasses.waterlow.body = '<h5>While many infectious diseases were once all but eliminated from the United States, there\'s evidence that climate change is a factor that could help them expand their range and make a comeback.</h5>' +
  '<h5>Mosquitoes capable of carrying and transmitting diseases like Dengue Fever, for example, now live in at least 28 states. As temperatures increase and rainfall patterns change - and summers become longer - these insects can remain active for longer seasons and in wider areas, greatly increasing the risk for people who live there.</h5>';
layerClasses.intro.title = '<h4 class=\'title-text\'>This is the static page seen on \'map view\' and when the animation is run manually.</h4>';
layerClasses.intro.body = '<h5 class=\'body-text\'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque eu elementum lacus. Ut vel mauris ornare ex porttitor laoreet sed a nulla. Aenean eget est sed dui accumsan mattis in a est. Cras sapien purus, feugiat sed magna eu, vehicula sodales lectus. Maecenas malesuada erat eros, in eleifend enim consectetur vel. In pretium condimentum urna at egestas. Vivamus nec dapibus magna. In hac habitasse platea dictumst. Donec pharetra sapien enim, sed pretium tellus eleifend fermentum.Vivamus pellentesque nibh convallis porttitor scelerisque. In pellentesque facilisis tempor. Nunc molestie neque ac sem egestas, porttitor porta turpis mollis.</h5>';
	
var tipTitle = "<h3>Louisiana's Changing Climate</h3>";
var tipMsg = '' +
  "<ul>" +
  "<li>Average temperatures are already increasing, along with the frequency of extreme heat, storms, and dry summers.</li>" +
  "<li>In the future, with climate change, temperatures are projected to rise 4.5-9.0°F (3-5°C).</li>" +
  "<li>Residents can expect to see more public health risks from storms, flooding and waterborne illnesses, drought, extreme heat waves, and declining air quality.</li>" +
  "<li>Louisiana does not have a statewide plan to prepare for the health impacts of climate change.</li>" +
  "</ul>";