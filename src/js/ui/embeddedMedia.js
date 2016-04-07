/* global BrightcoveFT, brightcove */

const domUtils = require('../utils/dom');
const base64 = require('../utils/base64');

function convertTweet (embeddedTweetElement) {
	return new Promise((resolve) => {
		const tweetUrl = embeddedTweetElement.textContent;

		embeddedTweetElement.setAttribute('data-converted', 1);

		let callbackName;
		do {
			callbackName = "embeddedTweetCallback"+Math.floor(Math.random() * 100000000000);
		} while (typeof window[callbackName] !== "undefined");

		window[callbackName] = function(resp) {
			embeddedTweetElement.innerHTML = resp.html;
			domUtils.addScript('http://platform.twitter.com/widgets.js');

			setTimeout(resolve, 100);
		};

		domUtils.addScript('https://api.twitter.com/1/statuses/oembed.json', {
			"url": tweetUrl,
			"omit_script": 1,
			"callback": callbackName
		});
	});
}

function convertFTVideo (embeddedFtVideoElement) {
	return new Promise((resolve) => {
		let width;
		let height;
		let videoId;
		let replacementHtml;

		embeddedFtVideoElement.setAttribute("data-converted", 1);

		// Extract width, height, videoID from element classes
		width = embeddedFtVideoElement.className.match(/ftvideowidth([0-9]+)/)[1];
		height = embeddedFtVideoElement.className.match(/ftvideoheight([0-9]+)/)[1];
		videoId = embeddedFtVideoElement.className.match(/ftvideovideoid([0-9]+)/)[1];

		// Build HTML to embed
		replacementHtml = "";
		replacementHtml += "<object width='"+width+"' height='"+height+"'>";
		replacementHtml += "<param name='wmode' value='transparent' />";
		replacementHtml += "<param name='movie' value='http://c.brightcove.com/services/viewer/federated_f9?isVid=1&isUI=1' />";
		replacementHtml += "<param name='flashVars' value='wmode=transparent&@videoPlayer="+videoId+"&playerID=590314128001&playerKey=AQ%2E%2E,AAAACxbljZk%2E,eD0zYozylZ3KmYvlyzd8myNVJz2Gttzx&domain=embed&dynamicStreaming=true' />";
		replacementHtml += "<param name='base' value='http://admin.brightcove.com' />";
		replacementHtml += "<param name='seamlesstabbing' value='false' />";
		replacementHtml += "<param name='allowFullScreen' value='true' />";
		replacementHtml += "<param name='swLiveConnect' value='true' />";
		replacementHtml += "<param name='allowScriptAccess' value='always' />";
		replacementHtml += "<embed src='http://c.brightcove.com/services/viewer/federated_f9?isVid=1&isUI=1' flashVars='wmode=transparent&@videoPlayer="+videoId+"&playerID=590314128001&playerKey=AQ%2E%2E,AAAACxbljZk%2E,eD0zYozylZ3KmYvlyzd8myNVJz2Gttzx&domain=embed&dynamicStreaming=true' base='http://admin.brightcove.com' width='"+width+"' height='"+height+"' seamlesstabbing='false' type='application/x-shockwave-flash' allowFullScreen='true' allowScriptAccess='always' swLiveConnect='true' wmode='transparent'>"
		replacementHtml += "</embed>";
		replacementHtml += "</object>";

		embeddedFtVideoElement.innerHTML = replacementHtml;

		setTimeout(resolve, 100);
	});
}


function convertYoutubeVideo (embeddedYoutubeVideoElement) {
	return new Promise((resolve) => {
		let encodedReplacementHtml;
		let replacementHtml;

		embeddedYoutubeVideoElement.setAttribute("data-converted", 1);

		encodedReplacementHtml = embeddedYoutubeVideoElement.className.match(/youtubeembedcode([ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\+\/=]+)/);
		if (encodedReplacementHtml && encodedReplacementHtml.length >= 2 && encodedReplacementHtml[1]) {
			encodedReplacementHtml = encodedReplacementHtml[1];
		} else {
			resolve();
			return;
		}
		replacementHtml = base64.decode(encodedReplacementHtml);

		embeddedYoutubeVideoElement.innerHTML = replacementHtml;

		setTimeout(resolve, 100);
	});
}

function convertBrightcoveVideo (brightcoveEmbed) {
	return new Promise((resolve) => {
		// Brightcove is a CDN that takes care of all the videos at videos.ft.com.
		// To get videos to load, you need to call their 'createExperience' function.
		// That function is located in a js file that's in the FT Wrapper code.
		if (typeof BrightcoveFT !== "undefined" && typeof BrightcoveFT.Init !== "undefined" && typeof BrightcoveFT.Init.createExperience !== "undefined") {
			// Once BrightcoveFT.Init.createExperience is executed, the
			// brightcove object becomes available. As additional videos are
			// initialised, they're added to brightcove.experiences.

			brightcoveEmbed.setAttribute("data-converted", 1);
			if (typeof brightcove === "undefined" || typeof brightcove.experiences === "undefined" || typeof brightcove.experiences[brightcoveEmbed.id] === "undefined") {
				BrightcoveFT.Init.createExperience(brightcoveEmbed.id);
			}
		}

		setTimeout(resolve, 100);
	});
}


function convertEmbeds(container, selector, fn) {
	const allEmbeds = container.querySelectorAll(selector);

	const promises = [];
	for (let i = 0; i < allEmbeds.length; i++) {
		const embed = allEmbeds[i];
		const convertedAttribute = embed.getAttribute('data-converted');
		const converted = (convertedAttribute && convertedAttribute === 1);

		if (converted) {
			continue;
		}

		promises.push(fn.apply(window, [embed]));
	}

	return Promise.all(promises);
}

function convertEmbeddedVideos(container) {
	return Promise.all([
		convertEmbeds(container, "p.embeddedtweet", convertTweet),
		convertEmbeds(container, "p.embeddedftvideo", convertFTVideo),
		convertEmbeds(container, "p.embeddedyoutubevideo", convertYoutubeVideo),
		convertEmbeds(container, ".video-container-ftvideo .BrightcoveExperience", convertBrightcoveVideo)
	]);
}

exports.convert = convertEmbeddedVideos;
