const httpRequest = require('../utils/httpRequest');
const merge = require('../utils/merge');

function parseQuery (qstr) {
	const query = {};
	const a = qstr.substr(1).split('&');

	for (let i = 0; i < a.length; i++) {
		if (a[i] !== "") {
			const b = a[i].split('=');
			query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
		}
	}

	return query;
}

function Api (baseUrl) {
	this.init = function () {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.get({
			url: baseUrl,
			query: merge({}, queryStr, {
				action: 'init',
				format: 'json'
			}),
			dataType: 'json'
		}).then((response) => {
			const normalizedResponse = {
				allowEditAndDeletePreviousMessages: response.alloweditanddeletepreviousmessages,
				authorNameStyle: response.authornamestyle,
				channel: response.channel,
				connectionNotification: response.connection_notification,
				contentOrder: response.content_order,
				fixedHeight: response.fixed_height === true ? true : false,
				isParticipant: response.isparticipant === true ? true : false,
				isEditor: response.iseditor === true ? true : false,
				participants: [],
				sessionStatus: response.status,
				pusherKey: response.pusherkey,

				initialPollingWaitTime: response.initial_polling_wait_time,
				pollInterval: response.pollInterval,

				time: response.time
			};

			if (response.participants && response.participants.length) {
				response.participants.forEach((participant) => {
					normalizedResponse.participants.push({
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
		const queryStr = parseQuery(document.location.search);

		return httpRequest.get({
			url: baseUrl,
			dataType: 'json',
			query: merge(queryStr, {
				action: 'poll',
				format: 'json'
			})
		});
	};

	this.catchup = function (query) {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.get({
			url: baseUrl,
			query: merge(queryStr, query, {
				action: 'catchup',
				format: 'json'
			}),
			dataType: 'json'
		});
	};

	this.session = {};
	this.session.start = function () {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl,
			dataType: 'json',
			query: merge(queryStr, {
				action: 'startSession',
				format: 'json'
			})
		});
	};

	this.session.end = function () {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl,
			dataType: 'json',
			query: merge(queryStr, {
				action: 'end',
				format: 'json'
			})
		});
	};

	this.message = {};
	this.message.send = function (postData) {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl,
			body: postData,
			dataType: 'json',
			query: merge(queryStr, {
				action: 'sendmsg',
				format: 'json'
			})
		});
	};

	this.message.block = function (postData) {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl,
			body: postData,
			dataType: 'json',
			query: merge(queryStr, {
				action: 'block',
				format: 'json'
			})
		});
	};

	this.message.edit = function (postData) {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl,
			body: postData,
			dataType: 'json',
			query: merge(queryStr, {
				action: 'editmsg',
				format: 'json'
			})
		});
	};

	this.message.delete = function (postData) {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl,
			body: postData,
			dataType: 'json',
			query: merge(queryStr, {
				action: 'deletemsg',
				format: 'json'
			})
		});
	};

}

module.exports = Api;
