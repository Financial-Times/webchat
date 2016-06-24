const httpRequest = require('../utils/httpRequest');
const merge = require('../utils/merge');

const consideredQueryParams = ['participant_token'];
function getPageQueryString (qstr) {
	const query = {};
	const a = qstr.substr(1).split('&');

	for (let i = 0; i < a.length; i++) {
		if (a[i] !== "") {
			const b = a[i].split('=');
			if (consideredQueryParams.indexOf(b[0]) !== -1) {
				query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
			}
		}
	}

	return query;
}

const commonQueryParams = {
	v: 2
};

function Api (baseUrl) {
	this.init = function () {
		const queryStr = getPageQueryString(document.location.search);

		return httpRequest.get({
			url: baseUrl,
			query: merge({}, queryStr, commonQueryParams, {
				action: 'init',
				format: 'json'
			}),
			dataType: 'json'
		}).then((response) => {
			const normalizedResponse = merge({}, response);
			delete normalizedResponse.data;

			normalizedResponse.data = {
				allowEditAndDeletePreviousMessages: response.data.alloweditanddeletepreviousmessages,
				authorNameStyle: response.data.authornamestyle,
				channel: response.data.channel,
				connectionNotification: response.data.connection_notification,
				contentOrder: response.data.content_order,
				fixedHeight: response.data.fixed_height === true ? true : false,
				isParticipant: response.data.isparticipant === true ? true : false,
				isEditor: response.data.iseditor === true ? true : false,
				participants: [],
				sessionStatus: response.data.status,
				pusherKey: response.data.pusherkey,

				post: {
					excerpt: response.post_excerpt,
					title: response.post_title
				},

				initialPollingWaitTime: response.data.initial_polling_wait_time,
				pollInterval: response.data.pollInterval,

				time: response.data.time
			};

			if (response.data.participants && response.data.participants.length) {
				response.data.participants.forEach((participant) => {
					normalizedResponse.data.participants.push({
						userId: participant.user_id,
						displayName: participant.display_name,
						email: participant.email,
						initials: participant.initials,
						isWpUser: participant.is_wp_user === true ? true : false,
						token: participant.token,
						headshot: participant.headshot
					});
				});
			}

			return normalizedResponse;
		});
	};

	this.poll = function () {
		const queryStr = getPageQueryString(document.location.search);

		return httpRequest.get({
			url: baseUrl,
			dataType: 'json',
			query: merge(queryStr, commonQueryParams, {
				action: 'poll',
				format: 'json'
			})
		});
	};

	this.catchup = function (query) {
		const queryStr = getPageQueryString(document.location.search);

		return httpRequest.get({
			url: baseUrl,
			query: merge(queryStr, commonQueryParams, query, {
				action: 'catchup',
				format: 'json'
			}),
			dataType: 'json'
		});
	};

	this.session = {};
	this.session.start = function () {
		const queryStr = getPageQueryString(document.location.search);

		return httpRequest.post({
			url: baseUrl,
			dataType: 'json',
			query: merge(queryStr, commonQueryParams, {
				action: 'startSession',
				format: 'json'
			})
		});
	};

	this.session.end = function () {
		const queryStr = getPageQueryString(document.location.search);

		return httpRequest.post({
			url: baseUrl,
			dataType: 'json',
			query: merge(queryStr, commonQueryParams, {
				action: 'end',
				format: 'json'
			})
		});
	};

	this.message = {};
	this.message.send = function (postData) {
		const queryStr = getPageQueryString(document.location.search);

		const translatedPostData = {
			msg: postData.message,
			keytext: postData.keyText || '',
			isblockquote: postData.isBlockquote === true ? 1 : 0
		};

		return httpRequest.post({
			url: baseUrl,
			body: translatedPostData,
			dataType: 'json',
			query: merge(queryStr, commonQueryParams, {
				action: 'sendmsg',
				format: 'json'
			})
		});
	};

	this.message.block = function (postData) {
		const queryStr = getPageQueryString(document.location.search);

		const translatedPostData = {
			messageid: postData.messageId
		};

		return httpRequest.post({
			url: baseUrl,
			body: translatedPostData,
			dataType: 'json',
			query: merge(queryStr, commonQueryParams, {
				action: 'block',
				format: 'json'
			})
		});
	};

	this.message.edit = function (postData) {
		const queryStr = getPageQueryString(document.location.search);

		const translatedPostData = {
			messageid: postData.messageId,
			newtext: postData.message,
			keytext: postData.keyText,
			isblockquote: postData.isBlockquote === true ? 1 : 0
		};

		return httpRequest.post({
			url: baseUrl,
			body: translatedPostData,
			dataType: 'json',
			query: merge(queryStr, commonQueryParams, {
				action: 'editmsg',
				format: 'json'
			})
		});
	};

	this.message.delete = function (postData) {
		const queryStr = getPageQueryString(document.location.search);

		const translatedPostData = {
			messageid: postData.messageId
		};

		return httpRequest.post({
			url: baseUrl,
			body: translatedPostData,
			dataType: 'json',
			query: merge(queryStr, commonQueryParams, {
				action: 'deletemsg',
				format: 'json'
			})
		});
	};

}

module.exports = Api;
