"use strict";

module.exports = (function($) {




	// Convert embedded videos on page load, or now, whichever is sooner
	convertEmbeddedVideos();
	if (!$.isReady) {
		$(function() {
			convertEmbeddedVideos();
		});
	}

	return {
		"convertEmbeddedVideos": convertEmbeddedVideos
	};

}($));
