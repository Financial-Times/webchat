const Api = require('./data/Api');
const domUtils = require('./utils/dom');
const RealTimeStream = require('./data/RealTimeStream');
const Time = require('./utils/Time');
const httpRequest = require('./utils/httpRequest');
const queryString = require('./utils/queryString');

const EditorContainer = require('./ui/EditorContainer');
const ContentContainer = require('./ui/ContentContainer');
const ParticipantContainer = require('./ui/ParticipantContainer');
const HeaderContainer = require('./ui/HeaderContainer');
const templates = require('./ui/templates');
const AlertOverlay = require('./ui/AlertOverlay');
const ConfirmOverlay = require('./ui/ConfirmOverlay');
const FormOverlay = require('./ui/FormOverlay');
const ConnectionStatusNotification = require('./ui/ConnectionStatusNotification');

function Webchat (rootEl, config) {
	let widgetEl;
	let self;

	self = this;

	try {
		if (!rootEl) {
			widgetEl = document.body;
		} else if (!(rootEl instanceof HTMLElement)) { // could throw exception in IE
			widgetEl = document.querySelector(rootEl);
		} else {
			widgetEl = rootEl;
		}
	} catch (e) {
		let el;
		if (typeof rootEl === 'string') {
			el = document.querySelector(rootEl);
		}

		if (el) {
			widgetEl = el;
		} else {
			widgetEl = document.body;
		}
	}

	/**
	 * Validation of the initial configuration object.
	 */
	if (!config) {
		throw new Error("No config provided");
	}

	if (!config.articleId) {
		if (!config.articleid) {
			throw new Error("Article ID is not provided.");
		} else {
			config.articleId = config.articleid;
		}
	}

	if (!config.apiUrl) {
		throw new Error("API URL is not provided.");
	}

	this.getDomContainer = function () {
		return widgetEl;
	};



	const api = new Api(config.apiUrl);

	let time;
	let stream;
	let sessionConfig = {};


	if (!httpRequest.hasSupportForCors()) {
		widgetEl.classList.add('webchat-no-cors-support');
	}


	function failedResponse (err) {
		console.log('An error occured, error:', err);

		return {
			success: false,
			reason: 'System is temporarily unavailable. Please try again later.'
		};
	}

	function unsuccessfulActionRequest (response) {
		if (response && typeof response === 'object') {
			self.showAlert('Alert', response.reason);
		} else {
			self.showAlert('Alert', 'Action failed, unknown reason.');
		}
	}

	function missingUserInfo (firstName = '', lastName = '') {
		const fields = [{
			type: 'static-text',
			label: 'We have some missing info about you. Please complete them to finish your join request.'
		}];

		if (!firstName) {
			fields.push({
				type: 'text',
				label: 'First name',
				name: 'first_name',
				value: firstName,
				attributes: {
					required: 'required'
				}
			});
		}

		if (!lastName) {
			fields.push({
				type: 'text',
				label: 'Last name',
				name: 'last_name',
				value: lastName,
				attributes: {
					required: 'required'
				}
			});
		}

		return new FormOverlay({
			title: 'Joining ML - missing details',
			submitLabel: 'Save',
			fields: fields
		}).then(formData => {
			if (formData) {
				return checkInvitation(Object.assign({
					first_name: firstName,
					last_name: lastName
				}, formData));
			}
		});
	}


	function checkInvitation (userDetails) {
		let qs = {};
		if (window.location.search) {
			qs = queryString.parse(window.location.search);
		}

		if (qs['invitation-token']) {
			return api.invitation.join(qs['invitation-token'], userDetails || {})
				.then(response => {
					if (response.success === true) {
						const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;

						if (history.replaceState) {
							window.history.replaceState({
								path: newUrl
							}, '', newUrl);
						} else {
							window.location.href = newUrl;

							return false;
						}
					} else {
						if (!response.reason && response.data && (!response.data.firstName || !response.data.lastName)) {
							return missingUserInfo(response.data.firstName, response.data.lastName);
						} else {
							new AlertOverlay(response && response.reason ? response.reason : 'Failed to join.');
						}
					}
				})
				.catch(e => {
					console.error(e);

					return;
				});
		}

		return Promise.resolve();
	}


	this.init = function () {
		checkInvitation()
			.then(shouldContinue => {
				if (shouldContinue === false) {
					return;
				}

				api.init().catch(failedResponse).then((initResponse) => {
					if (initResponse.success !== true) {
						unsuccessfulActionRequest(initResponse);
						return;
					}

					sessionConfig = initResponse.data;

					sessionConfig.tagmeUrl = config.tagmeUrl;

					if (!sessionConfig.contentOrder || ['ascending', 'descending'].indexOf(sessionConfig.contentOrder) === -1) {
						sessionConfig.contentOrder = 'descending';
					}

					widgetEl.appendChild(domUtils.toDOM(templates[`container_${sessionConfig.contentOrder}`].render()));

					self.headerContainer = new HeaderContainer(self);
					self.headerContainer.setLozenge(sessionConfig.sessionStatus);

					if (sessionConfig.post.excerpt) {
						self.headerContainer.setExcerpt(sessionConfig.post.excerpt);
					} else {
						self.headerContainer.setExcerpt('Live markets commentary from FT.com');
					}

					if (sessionConfig.post.title) {
						self.headerContainer.setTitle(sessionConfig.post.title);
					} else {
						self.headerContainer.setTitle('Markets live');
					}


					self.contentContainer = new ContentContainer(self, {
						blockMessage: blockMessage,
						deleteMessage: deleteMessage,
						editMessage: editMessage
					});
					self.editorContainer = new EditorContainer(self, {
						sendMessage: sendMessage,
						startSession: startSession,
						endSession: endSession
					});
					self.participantContainer = new ParticipantContainer(self);

					time = new Time(sessionConfig.time);

					if (sessionConfig.isParticipant === true) {
						self.editorContainer.init(sessionConfig);
					}

					sessionConfig.participants.forEach((participant) => {
						self.participantContainer.addParticipant({
							color: participant.color,
							fullName: participant.displayName,
							shortName: participant.initials,
							displayStyle: sessionConfig.authorNameStyle
						});
					});

					self.contentContainer.init(sessionConfig);


					api.catchup({
						direction: (sessionConfig.contentOrder === "descending" ? "reverse" : "") + "chronological"
					}).catch(failedResponse).then((catchupResponse) => {
						if (catchupResponse.success !== true) {
							unsuccessfulActionRequest(catchupResponse);
						}

						const messages = [];
						const findMessageIndex = function (id) {
							for (let i = 0; i < messages.length; i++) {
								if (messages[i].mid === id) {
									return i;
								}
							}

							return null;
						};
						let messageIndex;

						if (catchupResponse.data && catchupResponse.data.length) {
							catchupResponse.data.forEach((evt) => {
								switch (evt.event) {
									case 'msg':
										messages.push(evt.data);
										break;

									case 'editmsg':
										messageIndex = findMessageIndex(evt.data.mid);
										if (messageIndex) {
											messages[messageIndex] = evt.data;
										}
										break;

									case 'delete':
										messageIndex = findMessageIndex(parseInt(evt.data.messageid, 10));
										if (messageIndex) {
											messages.splice(messageIndex, 1);
										}
										break;

									case 'end':
										onEndSession();
										break;
								}
							});

							messages.forEach((message) => {
								onMessage(message, true);
							});
						}

						if (sessionConfig.fixedHeight) {
							resize();
							self.contentContainer.scrollToLast();
						}
						window.addEventListener('resize', resize);
						document.addEventListener('o.DOMContentLoaded', resize);
						window.addEventListener('load', resize);

						if (sessionConfig.sessionStatus === 'inprogress') {
							widgetEl.classList.add('webchat-live');
						}

						if (sessionConfig.sessionStatus !== 'closed') {
							initStream(sessionConfig);
						}
					});
				});
			});
	};

	this.serverTime = function () {
		return time.serverTime();
	};

	this.scrollToLast = function () {
		if (self.contentContainer) {
			self.contentContainer.scrollToLast();
		}
	};


	let documentHeightPollingInterval;
	let documentHeightPollingActive = false;
	let lastDocumentHeight;


	function documentHeightPolling () {
		const documentHeight = document.body.clientHeight;

		if (documentHeight !== lastDocumentHeight) {
			setFixedHeight();
		}
	}

	function setFixedHeight () {
		const viewportHeight = domUtils.windowSize().height;

		const bodyHeightBefore = document.body.clientHeight;
		const temporaryContentHeight = Math.max(viewportHeight, bodyHeightBefore) + 1000;

		self.contentContainer.getDomContainer().style.overflow = "visible";
		self.contentContainer.getDomContainer().style.height = temporaryContentHeight + 'px';

		const bodyHeightAfter = document.body.clientHeight;
		const chatHeight = widgetEl.scrollHeight;
		const nonChatHeight = bodyHeightAfter - chatHeight;
		const nonContentHeight = chatHeight - temporaryContentHeight;

		let targetHeight = viewportHeight - nonChatHeight - nonContentHeight;

		if (targetHeight + nonContentHeight < 200) {
			targetHeight = 200 - nonContentHeight;
		}

		self.contentContainer.setFixedHeight(targetHeight - 5); // to avoid the scrollbar to appear/disappear

		setTimeout(() => {
			lastDocumentHeight = document.body.clientHeight;
		}, 50);

		if (!documentHeightPollingActive) {
			documentHeightPollingActive = true;
			documentHeightPollingInterval = setInterval(documentHeightPolling, 1000);
		}
	}
	this.setFixedHeight = setFixedHeight;


	function removeFixedHeight () {
		self.contentContainer.removeFixedHeight();
		clearInterval(documentHeightPollingInterval);
		documentHeightPollingActive = false;
	}

	function resize () {
		if (sessionConfig.fixedHeight) {
			setFixedHeight();
		} else {
			removeFixedHeight();
		}
	}


	function blockMessage (data) {
		return api.message.block(data).catch(failedResponse).then((response) => {
			if (response.success === true) {
				return true;
			} else {
				unsuccessfulActionRequest(response);
				return false;
			}
		});
	}

	function deleteMessage(data) {
		return api.message.delete(data).catch(failedResponse).then((response) => {
			if (response.success === true) {
				return true;
			} else {
				unsuccessfulActionRequest(response);
				return false;
			}
		});
	}

	function sendMessage (data) {
		return api.message.send(data).catch(failedResponse).then((response) => {
			if (response.success === true) {
				return true;
			} else {
				unsuccessfulActionRequest(response);
				return false;
			}
		});
	}

	function editMessage (data) {
		return api.message.edit(data).catch(failedResponse).then((response) => {
			if (response.success === true) {
				return true;
			} else {
				unsuccessfulActionRequest(response);
				return false;
			}
		});
	}

	function startSession () {
		return new ConfirmOverlay('Start session', 'The session will be started immediately (there will be no delay). Once started, there is no way to go back to the "Coming soon" state.<br/><br/>Are you sure you want to start the session now?')
			.then((answer) => {
				if (answer === true) {
					return api.session.start().catch(failedResponse).then((response) => {
						if (response.success === true) {
							return true;
						} else {
							unsuccessfulActionRequest(response);
							return false;
						}
					});
				} else {
					return false;
				}
			});
	}

	function endSession() {
		return new ConfirmOverlay('End session', 'Do you want to end the session now?')
			.then((answer) => {
				if (answer === true) {
					return api.session.end().catch(failedResponse).then((response) => {
						if (response.success === true) {
							return true;
						} else {
							unsuccessfulActionRequest(response);
							return false;
						}
					});
				} else {
					return false;
				}
			});
	}



	function onMessage (data, catchup) {
		if (data.author) {
			self.participantContainer.addParticipant({
				color: data.authorcolour,
				fullName: data.authordisplayname,
				shortName: data.author,
				displayStyle: sessionConfig.authorNameStyle
			});
		}

		self.contentContainer.addMessage({
			html: data.html,
			messageId: data.mid,
			dateModified: data.datemodified,
			blockable: catchup === true ? false : true,
			forceScrollToTheEnd: catchup === true ? true : false
		});

		if (sessionConfig.insertKeyText && data.keytext) {
			self.headerContainer.addKeypoint({
				keyText: data.keytext,
				id: data.mid
			});
		}
	}

	function onBlockMessage (data) {
		self.contentContainer.blockMessage(data.msgblocked, data.blockedby);
	}

	function onDeleteMessage (data) {
		self.contentContainer.deleteMessage(data.messageid);

		if (sessionConfig.insertKeyText) {
			self.headerContainer.removeKeypoint(data.messageid);
		}
	}

	function onStartSession () {
		sessionConfig.sessionStatus = 'inprogress';

		self.contentContainer.addSysMessage({
			messageId: 'webchat-msg-session-started',
			html: 'This session is now in progress.',
			forceScrollToTheEnd: true
		});

		self.editorContainer.sessionStarted();
		self.headerContainer.setLozenge(sessionConfig.sessionStatus);
		widgetEl.classList.add('webchat-live');
	}

	function onEndSession () {
		sessionConfig.sessionStatus = 'closed';

		if (stream) {
			stream.stop();
		}

		let participants = "";
		self.participantContainer.getParticipants().forEach((participant, index) => {
			if (index === 0) {
				participants += participant.fullName;
			} else if (index === sessionConfig.participants.length - 1) {
				participants += ` and ${participant.fullName}`;
			} else {
				participants += `, ${participant.fullName}`;
			}
		});

		self.contentContainer.addEndSessionMessage(
			`This Market Live Session with ${participants} has finished`
		);

		self.contentContainer.disableParticipantOptions();
		self.editorContainer.sessionEnded();
		self.headerContainer.setLozenge(sessionConfig.sessionStatus);
		widgetEl.classList.remove('webchat-live');

		resize();
	}



	this.showAlert = function (title, message) {
		new AlertOverlay(title, message);
	};

	function initStream () {
		const connectionStatusNotification = new ConnectionStatusNotification(self);

		stream = new RealTimeStream({
			channel: sessionConfig.channel,
			pusherKey: sessionConfig.pusherKey,
			articleId: config.articleId,
			api: api
		});

		stream.on('connecting', connectionStatusNotification.onConnecting);
		stream.on('connected', () => {
			widgetEl.classList.remove('webchat-no-connection');
			connectionStatusNotification.onConnected();
			self.editorContainer.enable();
		});
		stream.on('reconnecting', (data) => {
			widgetEl.classList.add('webchat-no-connection');
			connectionStatusNotification.onReconnecting(data);
			self.editorContainer.disable();
		});

		stream.on('msg', onMessage);
		stream.on('editmsg', onMessage);
		stream.on('block', onBlockMessage);
		stream.on('delete', onDeleteMessage);
		stream.on('end', onEndSession);
		stream.on('startSession', onStartSession);
	}

	this.populateMessageField = function (value) {
		self.editorContainer.populateMessageField(value);
	};


	if (config.autoInit !== false) {
		self.init();
	}
}

module.exports = Webchat;
