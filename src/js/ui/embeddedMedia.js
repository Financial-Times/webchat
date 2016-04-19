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
		convertEmbeds(container, ".video-container-ftvideo [data-asset-source='Brightcove']", convertBrightcoveVideo)
	]).then(() => {
		const opts = {
			selector: '.webchat-video-brightcove'
		};
		nVideo.init(opts);
	});
}

exports.convert = convertEmbeddedVideos;
