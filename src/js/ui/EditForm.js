const domUtils = require('../utils/dom');
const templates = require('./templates');

function EditForm (messageDomEl, config, actions) {
	messageDomEl.appendChild(domUtils.toDOM(templates.editForm.render({
		keyEventEnabled: config.keyEventEnabled,
		keyText: config.keyText,
		isBlockquote: config.isBlockquote,
		message: config.message
	})));

	const domEl = messageDomEl.querySelector('.webchat-msg-editform');

	const saveButton = domEl.querySelector('.btn-save');
	const cancelButton = domEl.querySelector('.btn-cancel');
	const isKeyEventCheck = domEl.querySelector('input[name=iskeyevent]');
	const keyTextInput = domEl.querySelector('input[name="keytext"]');
	const isBlockquoteCheck = domEl.querySelector('input[name=isblockquote]');
	const messageInput = domEl.querySelector('.msgtext');

	cancelButton.addEventListener('click', () => {
		messageDomEl.removeChild(domEl);
	});

	saveButton.addEventListener('click', () => {
		saveButton.disabled = true;
		cancelButton.disabled = true;

		actions.save({
			keyText: config.keyEventEnabled && isKeyEventCheck.checked ? keyTextInput.value : '',
			isBlockquote: isBlockquoteCheck.checked,
			message: messageInput.value,
			messageId: config.messageId
		}).then((success) => {
			if (success === true) {
				messageDomEl.removeChild(domEl);
			} else {
				saveButton.disabled = false;
				cancelButton.disabled = false;
			}
		}).catch(() => {
			saveButton.disabled = false;
			cancelButton.disabled = false;
		});
	});
}

module.exports = EditForm;
