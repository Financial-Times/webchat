const embeddedMedia = require('./embeddedMedia');
const Scroller = require('../utils/Scroller');
const domUtils = require('../utils/dom');
const Delegate = require('dom-delegate');
const BlockOption = require('./BlockOption');
const EditForm = require('./EditForm');

function ContentContainer (webchat, actions) {
	const self = this;

	let isParticipant = false;
	let isEditor = false;
	let enableEditDelete = false;
	let contentOrder;
	let insertKeyText;


	const contentDomContainer = webchat.getDomContainer().querySelector('.webchat-content');
	const contentDelegate = new Delegate(contentDomContainer);

	const scroller = new Scroller(contentDomContainer, function () {});

	contentDelegate.on('click', '.msg span.block', (evt) => {
		const blockElement = evt.target || evt.originalTarget || evt.srcElement;
		const messageEl = domUtils.getParents(blockElement, '.msg')[0];
		const messageId = messageEl.getAttribute('data-mid');

		actions.blockMessage({
			messageId: messageId
		}).then((success) => {
			if (success === true) {
				webchat.populateMessageField(messageEl.getAttribute("data-rawmessage"));
			}
		});
	});


	this.blockMessage = function (messageId, blockedBy) {
		const messageEl = self.findMessage(messageId);

		if (messageEl && !messageEl.classList.contains("blocked")) {
			messageEl.classList.add("blocked");
			messageEl.appendChild(domUtils.toDOM(`<span class="blocknotice">(blocked by ${blockedBy})</span>`));

			const blockElement = messageEl.querySelector('.block');
			if (blockElement) {
				blockElement.parentNode.removeChild(blockElement);
			}
		}
	};


	function isScrollAtTheEnd () {
		if (contentOrder === 'descending') {
			return scroller.getPosition() === 'top';
		} else {
			return scroller.getPosition() === 'bottom';
		}
	}
	function scrollToLast () {
		if (contentOrder === 'descending') {
			scroller.scrollToTop();
		} else {
			scroller.scrollToBottom();
		}
	}

	this.addSysMessage = function (details) {
		if (!details.customClass) {
			details.customClass = '';
		}

		let scrollAtTheEnd = false;
		if (isScrollAtTheEnd()) {
			scrollAtTheEnd = true;
		}

		const messageHtml = `<div class="msg sysmsg ${details.customClass}" data-mid="${details.messageId}" id="webchat-msg-${details.messageId}"><div>${details.html}</div></div>`;

		if (contentOrder === 'descending') {
			contentDomContainer.insertBefore(domUtils.toDOM(messageHtml), contentDomContainer.firstChild);
		} else {
			contentDomContainer.appendChild(domUtils.toDOM(messageHtml));
		}

		if (scrollAtTheEnd || details.forceScrollToTheEnd) {
			scrollToLast();
		}

		return self.findMessage(details.messageId);
	}


	this.addMessage = function (details) {
		let scrollAtTheEnd = false;
		if (isScrollAtTheEnd()) {
			scrollAtTheEnd = true;
		}

		let messageEl = self.findMessage(details.messageId);

		if (messageEl && (typeof dateModified === "undefined" || messageEl.getAttribute("data-datemodified") < details.dateModified)) {
			messageEl.parentNode.replaceChild(domUtils.toDOM(details.html), messageEl);
			messageEl = self.findMessage(details.messageId);
		} else {
			if (contentOrder === 'descending') {
				contentDomContainer.insertBefore(domUtils.toDOM(details.html), contentDomContainer.firstChild);
			} else {
				contentDomContainer.appendChild(domUtils.toDOM(details.html));
			}
			messageEl = self.findMessage(details.messageId);
		}

		if (isEditor) {
			addEditDeleteOptions(messageEl);
		}

		if (isParticipant && details.blockable) {
			new BlockOption(webchat, messageEl);
		}

		if (scrollAtTheEnd || details.forceScrollToTheEnd) {
			scrollToLast();

			const images = messageEl.querySelectorAll('img');

			for (let i = 0; i < images.length; i++) {
				const image = images[i];
				image.addEventListener('load', function () {
					scrollToLast();
				});
			}
		}

		embeddedMedia.convert(messageEl).then(() => {
			if (scrollAtTheEnd || details.forceScrollToTheEnd) {
				scrollToLast();
			}
		});
	}

	this.deleteMessage = function (messageId) {
		const messageEl = self.findMessage(messageId);
		if (messageEl) {
			messageEl.parentNode.removeChild(messageEl);
		}
	};

	function addEditDeleteOptions (el) {
		const messageHeaders = el.querySelectorAll('.messageheader');
		for (let i = 0; i < messageHeaders.length; i++) {
			const messageHeader = messageHeaders[i];

			if (enableEditDelete) {
				messageHeader.insertBefore(
					domUtils.toDOM(
						`<div class="participant-options">
							<a href="javascript:void(0)" class="participant-option-edit">Edit</a>
							<a href="javascript:void(0)" class="participant-option-delete">Delete</a>
						</div>`
					),
					messageHeader.firstChild
				);
			}
		}
	}


	function onEdit (evt) {
		const clickedButton = evt.target || evt.originalTarget || evt.srcElement;
		const messageEl = domUtils.getParents(clickedButton, '.msg')[0];
		const messageId = messageEl.getAttribute('data-mid');

		// Prevent two edit forms being added to the same message
		if (messageEl.querySelectorAll(".webchat-msg-editform").length) {
			return;
		}

		const keyText = messageEl.getAttribute("data-keytext");
		const message = messageEl.getAttribute("data-rawmessage");
		const isBlockquote = messageEl.classList.contains("blockquote");

		new EditForm(messageEl, {
			keyEventEnabled: insertKeyText ? true : false,
			keyText: keyText,
			isBlockquote: isBlockquote,
			message: message,
			messageId: messageId
		}, {
			save: (editData) => {
				return actions.editMessage(editData);
			}
		});
	}

	function onDelete (evt) {
		if (!confirm('Really delete message?')) {
			return;
		}

		const clickedButton = evt.target || evt.originalTarget || evt.srcElement;

		const messageEl = domUtils.getParents(clickedButton, '.msg')[0];
		const messageId = messageEl.getAttribute('data-mid');

		messageEl.classList.add('delete-progress');

		actions.deleteMessage({
			messageId: messageId
		}).then((success) => {
			if (success !== true) {
				messageEl.classList.remove('delete-progress');
			}
		}).catch(() => {
			messageEl.classList.remove('delete-progress');
		});
	}

	function enableParticipantOptions () {
		contentDomContainer.classList.add('show-participant-options');

		contentDelegate.on('click', '.participant-option-edit', onEdit);
		contentDelegate.on('click', '.participant-option-delete', onDelete);
	};

	this.disableParticipantOptions = function () {
		contentDomContainer.classList.remove('show-participant-options');

		contentDelegate.off('click', '.participant-option-edit', onEdit);
		contentDelegate.off('click', '.participant-option-delete', onDelete);
	}


	this.init = function (sessionConfig) {
		contentOrder = sessionConfig.contentOrder;
		enableEditDelete = sessionConfig.allowEditAndDeletePreviousMessages === true ? true : false;
		isParticipant = sessionConfig.isParticipant === true ? true : false;
		isEditor = sessionConfig.isEditor === true ? true : false;
		insertKeyText = sessionConfig.insertKeyText;

		if (enableEditDelete && isEditor) {
			enableParticipantOptions();
		}

		scrollToLast();
	};

	this.getDomContainer = function () {
		return contentDomContainer;
	};

	this.setFixedHeight = function (heightPx) {
		if (!contentDomContainer.classList.contains('fixed-height')) {
			contentDomContainer.classList.add('fixed-height');
		}

		contentDomContainer.classList.add('fixed-height');
		contentDomContainer.style.height = heightPx + 'px';
	};

	this.findMessage = function (messageId) {
		return contentDomContainer.querySelector('#webchat-msg-' + messageId);
	};
}

module.exports = ContentContainer;
