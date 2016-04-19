const nVideo = require('n-video');

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
			domUtils.addScript('https://platform.twitter.com/widgets.js');

			setTimeout(resolve, 100);
		};

		domUtils.addScript('https://api.twitter.com/1/statuses/oembed.json', {
			"url": tweetUrl,
			"omit_script": 1,
			"callback": callbackName
		});
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

function convertFTVideo (embeddedFtVideoElement) {
	return new Promise((resolve) => {
		let videoId;
		let replacementHtml;

		embeddedFtVideoElement.setAttribute("data-converted", 1);

		videoId = embeddedFtVideoElement.className.match(/ftvideovideoid([0-9]+)/)[1];

		replacementHtml = `<div class="webchat-video-brightcove" data-n-component="n-video"
			data-n-video-source="brightcove"
			data-n-video-id="${videoId}"></div>`;

		embeddedFtVideoElement.innerHTML = replacementHtml;

		setTimeout(resolve, 100);
	});
}

function convertBrightcoveVideo (brightcoveEmbed) {
	return new Promise((resolve) => {
		brightcoveEmbed.setAttribute("data-converted", 1);

		const videoId = brightcoveEmbed.getAttribute('data-asset-ref');

		const replacementHtml = `<div class="webchat-video-brightcove" data-n-component="n-video"
			data-n-video-source="brightcove"
			data-n-video-id="${videoId}"></div>`;

		brightcoveEmbed.innerHTML = replacementHtml;

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
		convertEmbeds(container, ".video-container-ftvideo [data-asset-source='Brightcove']", convertBrightcoveVideo)
	]).then(() => {
		const opts = {
			selector: '.webchat-video-brightcove'
		};
		nVideo.init(opts);
	});
}

exports.convert = convertEmbeddedVideos;
