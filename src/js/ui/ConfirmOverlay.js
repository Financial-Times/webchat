import Overlay from 'o-overlay';
import Delegate from 'ftdomdelegate';

function ConfirmOverlay (title, text) {
	if (!text) {
		text = title;
		title = null;
	}

	return new Promise((resolve) => {
		const overlayInstance = new Overlay("webchat_confirm", {
			html: `
				<div class="webchat-overlay-text">${text}</div>
				<div class="webchat-overlay-buttons">
					<button type="button" class="webchat-overlay-ok o-buttons o-buttons--primary">OK</button>
					<button type="button" class="webchat-overlay-cancel o-buttons o-buttons--secondary">Cancel</button>
				</div>
			`,
			modal: true,
			heading: {
				title: title || 'Confirmation',
				shaded: true
			}
		});

		overlayInstance.open();

		const confirmOverlayDelegate = new Delegate(overlayInstance.wrapper);

		confirmOverlayDelegate.on('click', '.webchat-overlay-ok', () => {
			resolve(true);
			overlayInstance.close();
		});
		confirmOverlayDelegate.on('click', '.webchat-overlay-cancel', () => {
			resolve(false);
			overlayInstance.close();
		});

		const onDestroy = function () {
			overlayInstance.wrapper.removeEventListener('oOverlay.destroy', onDestroy);
			confirmOverlayDelegate.destroy();
		};
		overlayInstance.wrapper.addEventListener('oOverlay.destroy', onDestroy);
	});
}

module.exports = ConfirmOverlay;
