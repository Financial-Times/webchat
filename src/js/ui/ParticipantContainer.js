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
		return (participantDomContainer.querySelectorAll('#'+participantId).length !== 0);
	};

	this.getDomContainer = function () {
		return participantDomContainer;
	};

	function getParticipantElementId (key) {
		return "webchat-par-" + domUtils.sanitizeHtml(key);
	}
}

module.exports = ParticipantContainer;
