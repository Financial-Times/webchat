/* global Pusher */

const Events = require('../utils/Events');

function RealTimeStream (config) {
	if (!config || !config.channel) {
		throw new Error("Channel not provided");
	}

	const events = new Events();
	let pusher;

	this.on = events.on;
	this.one = events.one;
	this.off = events.off;


	function triggerEvent (eventName, data) {
		events.trigger(eventName, data);
	}

	let connectedEventSent = false;

	function connect () {
		if (!config.pusherKey || !window.Pusher) {
			poll();
		} else {
			// Connect to pusher
			const pusherTimeout = setTimeout(function() {
				events.trigger('timeout');

				poll();
			}, 5000);

			pusher = new Pusher(config.pusherKey);
			const channel = pusher.subscribe(config.channel);

			channel.bind('msg', (data) => {
				triggerEvent('msg', data);
			});
			channel.bind('editmsg', (data) => {
				triggerEvent('editmsg', data);
			});
			channel.bind('block', (data) => {
				triggerEvent('block', data);
			});
			channel.bind('delete', (data) => {
				triggerEvent('delete', data);
			});
			channel.bind('end', (data) => {
				triggerEvent('end', data);
			});
			channel.bind('startSession', (data) => {
				triggerEvent('startSession', data);
			});
			channel.bind('postSaved', (data) => {
				triggerEvent('postSaved', data);
			});

			pusher.connection.bind('connected', function() {
				if (!connectedEventSent) {
					connectedEventSent = true;
					triggerEvent('connected');
				}

				clearTimeout(pusherTimeout);
				stopPolling();
			});
			pusher.connection.bind('failed', function() {
				triggerEvent('failed');

				clearTimeout(pusherTimeout);
				poll();
			});
			pusher.connection.bind('unavailable', function() {
				triggerEvent('unavailable');

				poll();
			});
		}
	}

	let pollTimer;
	function poll () {
		if (config.articleId) {
			if (!connectedEventSent) {
				connectedEventSent = true;
				triggerEvent('connected');
			}

			config.api.poll(config.articleId).then((events) => {
				for (let i = 0, s = events.length; i < s; i++) {
					if (events[i].channel === config.channel) {
						if (events[i].event === 'msg') {
							triggerEvent('msg', events[i].data);
						} else if (events[i].event === 'editmsg') {
							triggerEvent('editmsg', events[i].data);
						} else if (events[i].event === 'block') {
							triggerEvent('block', events[i].data);
						} else if (events[i].event === 'end') {
							triggerEvent('end', events[i].data);
						} else if (events[i].event === 'startSession') {
							triggerEvent('startSession', events[i].data);
						}
					}
				}
			});

			pollTimer = setTimeout(poll, (config.pollInterval || 3) * 1000);
		}
	}

	function stopPolling () {
		clearTimeout(pollTimer);
	}


	this.stop = function () {
		stopPolling();

		if (pusher) {
			pusher.unsubscribe(config.channel);
		}
	}

	connect();
}

module.exports = RealTimeStream;
