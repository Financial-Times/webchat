const domUtils = require('../utils/dom');

function BlockOption (webchat, messageEl) {
	const blockGrace = 5;

	messageEl.appendChild(domUtils.toDOM(`<span class="block">Block</span>`));

	function tick () {
		if (!messageEl.classList.contains("blocked")) {
			const messageTimestamp = parseInt(messageEl.getAttribute('data-timestamp'), 10);
			if (messageTimestamp < (webchat.serverTime() + blockGrace)) {
				messageEl.classList.remove("prepub");
			} else {
				messageEl.querySelector(".block").innerHTML = `Block (${Math.ceil(messageTimestamp - webchat.serverTime() - blockGrace)})`;
				setTimeout(tick, 1000);
			}
		}
	};

	tick();
}

module.exports = BlockOption;
