const domUtils = require('../utils/dom');
const templates = require('./templates');

function ParticipantContainer (webchat) {
	const participantDomContainer = webchat.getDomContainer().querySelector('.webchat-participants');

	const participantListTemplate = templates.participantList;
	const participantTemplate = templates.participant;

	participantDomContainer.appendChild(domUtils.toDOM(participantListTemplate.render()));

	this.addParticipant = function (details) {
		const noParticipants = participantDomContainer.querySelector(".no-participants");
		if (noParticipants) {
			noParticipants.parentNode.removeChild(noParticipants);
		}

		if (!details.color && details.color !== 0) {
			details.color = participantDomContainer.querySelectorAll(".webchat-participant-list li").length + 1;
		}

		participantDomContainer.querySelector(".webchat-participant-list").appendChild(domUtils.toDOM(participantTemplate.render({
			id: getParticipantElementId(details.shortName),
			color: details.color,
			displayName: (details.displayStyle === "initials" ? details.shortName : details.fullName),
			fullName: (details.displayStyle === "initials" ? details.fullName : "")
		})));
	};

	this.containsParticipant = function (key) {
		const participantId = getParticipantElementId(key);
		try {
			return (participantDomContainer.querySelectorAll('#' + participantId).length !== 0);
		} catch (e) {
			return false;
		}
	};

	this.getDomContainer = function () {
		return participantDomContainer;
	};


	function makeid () {
		let text = "";
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (let i = 0; i < 5; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return text;
	}

	const participantKeys = {};
	function getParticipantElementId (key) {
		if (participantKeys[key]) {
			return participantKeys[key];
		}

		let sanitizedKey = domUtils.sanitizeHtmlId(key);
		if (!sanitizedKey) {
			sanitizedKey = makeid();
		}

		if (participantDomContainer.querySelector('#webchat-par-' + sanitizedKey)) {
			sanitizedKey += makeid();
		}

		participantKeys[key] = sanitizedKey;
		return "webchat-par-" + sanitizedKey;
	}
}

module.exports = ParticipantContainer;
