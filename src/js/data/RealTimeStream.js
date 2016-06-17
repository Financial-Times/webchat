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


	let connectionNumber = 1;


	function connectToPusher (connNumber) {
		return new Promise((resolve, reject) => {
			if (!config.pusherKey || !window.Pusher) {
				reject();
			} else {
				const unsubscribeConnectionEvents = function () {
					pusher.connection.unbind('failed', pusherConnectionFailed);
					pusher.connection.unbind('unavailable', pusherConnectionFailed);
					pusher.connection.unbind('disconnected', pusherConnectionFailed);
					pusher.connection.unbind('connected', pusherConnected);
				};

				const pusherConnectionFailed = function () {
					console.log(connNumber, 'Pusher failed');

					unsubscribeConnectionEvents();

					console.log(connNumber, 'manually disconnect pusher');
					pusher.unsubscribe(config.channel);
					pusher.disconnect();

					clearTimeout(pusherTimeout);
					reject();
				};

				const pusherConnected = function () {
					console.log(connNumber, 'Pusher connected');

					unsubscribeConnectionEvents();

					clearTimeout(pusherTimeout);
					resolve(channel);
				};

				// Connect to pusher
				const pusherTimeout = setTimeout(pusherConnectionFailed, 5000);

				console.log(connNumber, 'pusher obj created');
				pusher = new Pusher(config.pusherKey, {
					disableStats: true,
					activity_timeout: 30000,
					pong_timeout: 15000
				});
				const channel = pusher.subscribe(config.channel);

				pusher.connection.bind('connected', pusherConnected);

				pusher.connection.bind('failed', pusherConnectionFailed);
				pusher.connection.bind('unavailable', pusherConnectionFailed);
				pusher.connection.bind('disconnected', pusherConnectionFailed);
			}
		});
	}

	function addPusherEvents (connNumber, channel) {
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


		const pusherConnectionFailed = function () {
			console.log(connNumber, 'Pusher failed');

			pusher.connection.unbind('failed', pusherConnectionFailed);
			pusher.connection.unbind('unavailable', pusherConnectionFailed);
			pusher.connection.unbind('disconnected', pusherConnectionFailed);

			console.log(connNumber, 'manually disconnect pusher');
			pusher.unsubscribe(config.channel);
			pusher.disconnect();

			connectionFailed(connNumber);
		};

		pusher.connection.bind('failed', pusherConnectionFailed);
		pusher.connection.bind('unavailable', pusherConnectionFailed);
		pusher.connection.bind('disconnected', pusherConnectionFailed);
	}

	function connectToPolling (connNumber) {
		console.log(connNumber, 'poll fallback');
		return poll(connNumber);
	}


	let retryTimeout = 5500;
	function connectionFailed (connNumber) {
		console.log('connectionFailed', connNumber, connectionNumber);
		if (connNumber === connectionNumber) {
			connectionNumber++;
			console.log(connNumber, 'connection failed, retry in ' + (retryTimeout/1000) + ' seconds');

			triggerEvent('reconnecting', {
				retryTimeout: retryTimeout
			});

			if (retryTimeout === 5500) {
				connect(connectionNumber);
			} else {
				setTimeout(() => {
					connect(connectionNumber);
				}, retryTimeout);
			}
		}
	}


	function connect (connNumber) {
		triggerEvent('connecting');

		connectToPusher(connNumber).then((channel) => {
			triggerEvent('connected');
			console.log(connNumber, 'Connected with Pusher');

			addPusherEvents(connNumber, channel);

			retryTimeout = 5500;
		}).catch(() => {
			connectToPolling(connNumber).then(() => {
				triggerEvent('connected');
				console.log(connNumber, 'Connected with Polling');

				retryTimeout = 5500;
			}).catch(() => {
				console.log(connNumber, 'Connection failed');

				if (retryTimeout < 30000) {
					retryTimeout += retryTimeout;

					if (retryTimeout > 30000) {
						retryTimeout = 30000;
					}
				}
			});
		});
	}

	let pollTimer;
	function poll (connNumber) {
		return config.api.poll(config.articleId).then((events) => {
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

			pollTimer = setTimeout(() => {
				poll(connNumber);
			}, (config.pollInterval || 10) * 1000);
		}).catch((e) => {
			console.log(connNumber, "Poll failed");
			connectionFailed(connNumber);

			throw e;
		});
	}

	function stopPolling () {
		clearTimeout(pollTimer);
	}


	this.stop = function () {
		console.log('stop polling');
		stopPolling();

		if (pusher) {
			console.log('pusher unsubscribe and disconnect');

			pusher.unsubscribe(config.channel);
			pusher.disconnect();
		}
	};

	if (config.articleId) {
		connect(connectionNumber);
	}
}

module.exports = RealTimeStream;
