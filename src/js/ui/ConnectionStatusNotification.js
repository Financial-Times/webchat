const domUtils = require('../utils/dom');

function ConnectionStatusNotification (webchat) {
	const contentContainerEl = webchat.getDomContainer().querySelector('.webchat-content-container');

	const webchatConnectionStatusClass = 'webchat-connection-status';
	const connectionStatusDom = domUtils.toDOM(`<div class="${webchatConnectionStatusClass}"></div>`);
	contentContainerEl.appendChild(connectionStatusDom);
	const connectionStatusEl = contentContainerEl.querySelector(`.${webchatConnectionStatusClass}`);

	let connectionStatus = 'notconnected';

	this.onConnecting = function () {
		if (connectionStatus !== 'connecting') {
			connectionStatus = 'connecting';
		}

		connectionStatusEl.innerHTML = 'Connecting ...';
		connectionStatusEl.style.display = 'block';
	};

	this.onConnected = function () {
		if (connectionStatus !== 'connected') {
			connectionStatus = 'connected';
		}

		connectionStatusEl.style.display = 'none';
	};

	let ticker;
	this.onReconnecting = function (data) {
		if (connectionStatus !== 'reconnecting') {
			connectionStatus = 'reconnecting';
		}

		let timeout = data.retryTimeout / 1000;
		connectionStatusEl.innerHTML = `Connection lost. Reconnecting in ${timeout} seconds.`;
		connectionStatusEl.style.display = 'block';

		clearTimeout(ticker);

		const tickerFunction = () => {
			if (connectionStatus === 'reconnecting') {
				if (timeout > 0) {
					timeout--;
					connectionStatusEl.innerHTML = `Connection lost. Reconnecting in ${timeout} seconds.`;

					ticker = setTimeout(tickerFunction, 1000);
				} else {
					ticker = setTimeout(() => {
						connectionStatusEl.innerHTML = `An error occurred while reconnecting. Please try to refresh the page.`;
					}, 2000);
				}
			}
		};

		ticker = setTimeout(tickerFunction, 1000);
	};
}

module.exports = ConnectionStatusNotification;
