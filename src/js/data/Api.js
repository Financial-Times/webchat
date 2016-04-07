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
			url: baseUrl + '/init',
			dataType: 'json',
			query: queryStr
		});
	};

	this.poll = function () {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.get({
			url: baseUrl + '/poll',
			dataType: 'json',
			query: queryStr
		});
	};

	this.catchup = function (query) {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.get({
			url: baseUrl + '/catchup',
			query: merge(queryStr, query, {
				format: 'json'
			}),
			dataType: 'json'
		});
	};

	this.session = {};
	this.session.start = function () {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl + '/session/start',
			dataType: 'json',
			query: queryStr
		});
	};

	this.session.end = function () {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl + '/session/end',
			dataType: 'json',
			query: queryStr
		});
	};

	this.message = {};
	this.message.send = function (postData) {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl + '/message/send',
			body: postData,
			dataType: 'json',
			query: queryStr
		});
	};

	this.message.block = function (postData) {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl + '/message/block',
			body: postData,
			dataType: 'json',
			query: queryStr
		});
	};

	this.message.edit = function (postData) {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl + '/message/edit',
			body: postData,
			dataType: 'json',
			query: queryStr
		});
	};

	this.message.delete = function (postData) {
		const queryStr = parseQuery(document.location.search);

		return httpRequest.post({
			url: baseUrl + '/message/delete',
			body: postData,
			dataType: 'json',
			query: queryStr
		});
	};

}

module.exports = Api;
