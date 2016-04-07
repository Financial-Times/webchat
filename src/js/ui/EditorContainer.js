const Delegate = require('dom-delegate');
const domUtils = require('../utils/dom');
const templates = require('./templates');
const oAssets = require('o-assets');

function EditorContainer (webchat, actions) {
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

	const emoticonList = ['thumbs_down','thumbs_up','teeth_smile','cry_smile','omg_smile','embarassed_smile','censored','angry_smile','devil_smile','wink_smile','lightbulb','bandit1','bandit2','bandit3','bandit4','bandit5','bandit6','bandit7','bandit8','bandit9','bandit10','bear','bull','buy','sell','cash','danger','deadcat','feltcollaredsource','financier','rocket','scorchedfingers','swag','tinhat','separator','breaking_news'];
	const emoticons = [];
	emoticonList.forEach((emoticon) => {
		emoticons.push({
			url: oAssets.resolve(emoticon + '.gif', 'webchat')
		});
	});


	this.init = function (sessionConf) {
		sessionConfig = sessionConf;

		sessionStatus = sessionConfig.sessionStatus;

		editorDomContainer.appendChild(domUtils.toDOM(templates.editor.render({
			isEditor: sessionConfig.isEditor,
			sessionInProgress: sessionStatus === 'inprogress' ? true : false,
			keyTextEnabled: sessionConfig.insertKeyText ? true : false,
			insertKeyText: sessionConfig.insertKeyText,
			emoticons: emoticons
		})));

		messageField = editorDomContainer.querySelector('textarea.new-msg');
		sendButton = editorDomContainer.querySelector('button.submit');
		sendOnEnterOpt = editorDomContainer.querySelector(".opt-send-on-enter");
		blockquoteCheck = editorDomContainer.querySelector('.opt-quote');
		sessionControlButton = editorDomContainer.querySelector('.session-control');

		// Send message on keypress or button click, disable default form submit
		messageField.addEventListener('keypress', (e) => {
			if (sendOnEnterOpt.checked && e.keyCode === 13) {
				onSend();
			}
		});
		sendButton.addEventListener('click', onSend);

		editorDelegate.on('click', '.emoticons img', (evt) => {
			const img = evt.srcElement;

			if (img.title) {
				messageField.value += img.title;
			} else {
				messageField.value += "{" + img.src.substring((img.src.lastIndexOf("/") + 1), img.src.lastIndexOf(".")) + "}";
			}
			messageField.focus();
		});

		if (sessionConfig.isEditor) {
			sessionControlButton.addEventListener('click', (evt) => {
				evt.preventDefault();

				if (sessionStatus === 'comingsoon') {
					actions.startSession();
				} else if (sessionStatus === 'inprogress') {
					actions.endSession();
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
	}


	function onSend () {
		let message = messageField.value;
		let keyText = '';

		if (sessionConfig.insertKeyText && keyCheck.checked) {
			keyText = keyTextField.value;
		}

		if (message.length === 0) {
			webchat.showMessage("Blank message cannot be sent.");
			return;
		}

		if (message.length > 4096) {
			webchat.showMessage("Sorry, your message is too long. Please restrict messages to four thousand characters.");
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

		messageField.blur();
		messageField.disabled = true;
		sendButton.disabled = true;
		if (keyTextField) {
			keyTextField.disabled = true;
		}

		actions.sendMessage({
			message: message,
			keyText: keyText ? keyText : '',
			isBlockquote: isBlockquote
		}).then((success) => {
			messageField.disabled = false;
			sendButton.disabled = false;
			if (keyTextField) {
				keyTextField.disabled = false;
			}

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


	this.sessionStarted = function () {
		sessionControlButton.innerHTML = sessionControlButton.innerHTML.replace('Start', 'End');
		sessionStatus = 'inprogress';
	};

	this.sessionEnded = function () {
		editorDomContainer.classList.add('webchat-hidden');
		sessionStatus = 'closed';
	};


	this.getDomContainer = function () {
		return editorDomContainer;
	};

	this.populateMessageField = function (value) {
		messageField.value = value;
	};
}

module.exports = EditorContainer;
