/* global twttr */
import oVideo from 'o-video';

const domUtils = require('../utils/dom');

function convertTweet (embeddedTweetElement) {
	return new Promise((resolve) => {
		const tweetUrl = embeddedTweetElement.textContent;

		embeddedTweetElement.setAttribute('data-converted', 1);

		let callbackName;
		do {
			callbackName = "embeddedTweetCallback" + Math.floor(Math.random() * 100000000000);
		} while (typeof window[callbackName] !== "undefined");

		window[callbackName] = function(resp) {
			embeddedTweetElement.innerHTML = resp.html;
			domUtils.addScript('https://platform.twitter.com/widgets.js').then(() => {
				twttr.events.bind('rendered', (evt) => {
					const containerElements = domUtils.getParents(evt.target, 'p.embeddedtweet');

					if (containerElements && containerElements.length && containerElements[0] === embeddedTweetElement) {
						resolve();
					}
				});

				setTimeout(() => {
					resolve();
				}, 2000);
			});
		};

		domUtils.addScript('https://api.twitter.com/1/statuses/oembed.json', {
			"url": tweetUrl,
			"callback": callbackName
		});
	});
}

function convertBrightcoveVideo (brightcoveEmbed) {
	return new Promise((resolve) => {
		brightcoveEmbed.setAttribute("data-converted", 1);

		const videoId = brightcoveEmbed.getAttribute('data-asset-ref');

		const replacementHtml = `<div class="webchat-video-brightcove" data-o-component="o-video o-video--large"
			data-o-video-placeholder="true"
			data-o-video-id="${videoId}"></div>`;

		brightcoveEmbed.innerHTML = replacementHtml;

		setTimeout(() => {
			oVideo.init(brightcoveEmbed);

			resolve();
		}, 100);
	});
}

function convertFTVideo (ftVideoEmbed) {
	return new Promise((resolve) => {
		ftVideoEmbed.setAttribute("data-converted", 1);

		const videoId = ftVideoEmbed.getAttribute('data-asset-ref');

		const replacementHtml = `<div class="webchat-video-ftvideo" data-o-component="o-video o-video--large"
			data-o-video-placeholder="true"
			data-o-video-id="${videoId}"></div>`;

		ftVideoEmbed.innerHTML = replacementHtml;

		setTimeout(() => {
			oVideo.init(ftVideoEmbed);

			resolve();
		}, 100);
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

function convertEmbeddedMedia(container) {
	return Promise.all([
		convertEmbeds(container, "p.embeddedtweet", convertTweet),
		convertEmbeds(container, ".video-container-ftvideo [data-asset-source='Brightcove']", convertBrightcoveVideo),
		convertEmbeds(container, ".video-container-ftvideo [data-asset-source='FTVideo']", convertFTVideo)
	]);
}

exports.convert = convertEmbeddedMedia;
