const Overlay = require('o-overlay');
const Delegate = require('dom-delegate');

function AlertOverlay (title, text) {
	const overlayInstance = new Overlay("webchat_alert", {
		html: `
			<div class="webchat-overlay-text">${text}</div>
			<div class="webchat-overlay-buttons">
				<button type="button" class="webchat-overlay-ok o-buttons o-buttons--standout">OK</button>
			</div>
		`,
		modal: false,
		heading: {
			title: title || 'Alert',
			shaded: true
		}
	});

	overlayInstance.open();

	const confirmOverlayDelegate = new Delegate(overlayInstance.wrapper);

	confirmOverlayDelegate.on('click', '.webchat-overlay-ok', () => {
		overlayInstance.close();
	});
}

module.exports = AlertOverlay;
