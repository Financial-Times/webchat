const Delegate = require('dom-delegate');
const domUtils = require('../utils/dom');
const templates = require('./templates');
const AlertOverlay = require('./AlertOverlay');
const FormOverlay = require('./FormOverlay');

function EditorContainer (webchat, actions) {
	const self = this;

	const editorDomContainer = webchat.getDomContainer().querySelector('.webchat-editor');
	const editorDelegate = new Delegate(editorDomContainer);

	let sessionConfig;

	let messageField;
	let sendButton;
	let sendOnEnterOpt;
	let blockquoteCheck;
	let keyCheck;
	let keyTextField;
	let sessionControlButton;
	let sessionStatus;
	let inviteContributorButton;

	let editorStatus = true; // enabled

	const emoticonList = ['thumbs_down','thumbs_up','teeth_smile','cry_smile','omg_smile','embarassed_smile','censored','angry_smile','devil_smile','wink_smile','lightbulb','bandit1','bandit2','bandit3','bandit4','bandit5','bandit6','bandit7','bandit8','bandit9','bandit10','bear','bull','buy','sell','cash','danger','deadcat','feltcollaredsource','financier','rocket','scorchedfingers','swag','tinhat','separator','breaking_news'];
	const emoticons = [];
	emoticonList.forEach((emoticonClass) => {
		emoticons.push({
			code: emoticonClass
		});
	});


	this.init = function (sessionConf) {
		sessionConfig = sessionConf;

		sessionStatus = sessionConfig.sessionStatus;

		if (sessionStatus !== 'closed') {
			editorDomContainer.appendChild(domUtils.toDOM(templates.editor.render({
				isEditor: sessionConfig.isEditor,
				invitationEnabled: sessionConfig.invitationToken,
				sessionInProgress: sessionStatus === 'inprogress' ? true : false,
				keyTextEnabled: sessionConfig.insertKeyText ? true : false,
				insertKeyText: sessionConfig.insertKeyText,
				emoticons: emoticons,
				uuid: sessionConfig.uuid,
				tagmeUrl: sessionConfig.tagmeUrl
			})));

			messageField = editorDomContainer.querySelector('textarea.new-msg');
			sendButton = editorDomContainer.querySelector('button.submit');
			sendOnEnterOpt = editorDomContainer.querySelector(".opt-send-on-enter");
			blockquoteCheck = editorDomContainer.querySelector('.opt-quote');
			sessionControlButton = editorDomContainer.querySelector('.session-control');
			inviteContributorButton = editorDomContainer.querySelector('.webchat--invite-participant');

			// Send message on keypress or button click, disable default form submit
			messageField.addEventListener('keypress', (e) => {
				if (sendOnEnterOpt.checked && e.keyCode === 13) {
					onSend();
				}
			});
			sendButton.addEventListener('click', onSend);

			editorDelegate.on('click', '.webchat-emoticons .webchat-emoticon', (evt) => {
				const emoticon = evt.target || evt.originalTarget || evt.srcElement;

				messageField.value += "{" + emoticon.getAttribute('data-code') + "}";
				messageField.focus();
			});

			if (sessionConfig.isEditor) {
				sessionControlButton.addEventListener('click', (evt) => {
					evt.preventDefault();

					if (editorStatus) {
						if (sessionStatus === 'comingsoon') {
							actions.startSession();
						} else if (sessionStatus === 'inprogress') {
							actions.endSession().then((success) => {
								if (success) {
									document.location.href = document.location.href.replace(document.location.hash, "");
								}
							});
						}
					}
				});
			}

			if (sessionConfig.insertKeyText) {
				keyCheck = editorDomContainer.querySelector('.key-event-check');
				keyTextField = editorDomContainer.querySelector("input.key-text");

				keyCheck.addEventListener('change', () => {
					keyTextField.classList.toggle('webchat-hidden');
				});
			}

			if (sessionConfig.isEditor && inviteContributorButton) {
				inviteContributorButton.addEventListener('click', onInviteRequest);
			}
		}
	};


	function onSend () {
		let message = messageField.value;
		let keyText = '';

		if (sessionConfig.insertKeyText && keyCheck.checked) {
			keyText = keyTextField.value;
		}

		if (message.length === 0) {
			webchat.showAlert("Blank message cannot be sent.");
			return;
		}

		if (message.length > 4096) {
			webchat.showAlert("Sorry, your message is too long.");
			return;
		}

		// Strip all spans, as they may carry nasty MS Word formatting
		let tempString = "";
		while (tempString.toString() !== message.toString()) {
			tempString = message;
			message = message.replace(/<span(.*?)>(.*?)<\/span>/i, "$2");
		}

		let isBlockquote;
		if (blockquoteCheck.checked) {
			isBlockquote = true;
			blockquoteCheck.checked = false;
		} else {
			isBlockquote = false;
		}

		self.disable();

		actions.sendMessage({
			message: message,
			keyText: keyText ? keyText : '',
			isBlockquote: isBlockquote
		}).then((success) => {
			self.enable();

			if (success === true) {
				messageField.value = '';

				if (keyTextField) {
					keyTextField.value = '';
				}

				messageField.focus();
			} else {
				messageField.value = message;

				if (keyTextField) {
					keyTextField.value = keyText;
				}

				messageField.focus();
			}
		});
	}

	function onInviteRequest () {
		if (sessionConfig.invitationToken) {
			new FormOverlay({
				title: 'Invitation',
				fields: [
					{
						type: 'text',
						label: 'Copy this URL and send to the invited person',
						name: 'invitation-url',
						value: `${window.location.protocol}//${window.location.host}${window.location.pathname}?invitation-token=${sessionConfig.invitationToken}`
					}
				]
			});
		} else {
			new AlertOverlay('You do not have permission to invite people');
		}
	}


	this.sessionStarted = function () {
		editorDomContainer.classList.add('webchat--session-on');
		sessionControlButton.innerHTML = sessionControlButton.innerHTML.replace('Start', 'End');
		sessionStatus = 'inprogress';
	};

	this.sessionEnded = function () {
		editorDomContainer.classList.add('webchat-hidden');
		editorDomContainer.classList.remove('webchat--session-on');
		sessionStatus = 'closed';
	};


	this.disable = function () {
		editorStatus = false;

		if (messageField) {
			messageField.blur();
			messageField.disabled = true;
			sendButton.disabled = true;

			if (sessionControlButton) {
				sessionControlButton.classList.add('disabled');
			}

			if (keyTextField) {
				keyTextField.disabled = true;
			}
		}
	};

	this.enable = function () {
		editorStatus = true;

		if (messageField) {
			messageField.disabled = false;
			sendButton.disabled = false;

			if (sessionControlButton) {
				sessionControlButton.classList.remove('disabled');
			}

			if (keyTextField) {
				keyTextField.disabled = false;
			}
		}
	};


	this.getDomContainer = function () {
		return editorDomContainer;
	};

	this.populateMessageField = function (value) {
		messageField.value = value;
	};
}

module.exports = EditorContainer;
