const domUtils = require('../utils/dom');
const templates = require('./templates');

function HeaderContainer (webchat) {
	const headerDomContainer = webchat.getDomContainer().querySelector('.webchat-header');
	headerDomContainer.appendChild(domUtils.toDOM(templates.header.render()));

	const excerptContainer = headerDomContainer.querySelector('.webchat-excerpt');
	const titleContainer = headerDomContainer.querySelector('.webchat-title');
	const lozengeContainer = headerDomContainer.querySelector('.webchat-lozenge');
	const keyPointsContainer = headerDomContainer.querySelector('.webchat-keypoints ul');

	this.setExcerpt = function (excerpt) {
		excerptContainer.innerHTML = '<h2>'+ excerpt +'</h2>';
	};

	this.setTitle = function (title) {
		titleContainer.innerHTML = '<h2>' + title + '</h2>';
	};

	this.setLozenge = function (status) {
		switch(status) {
			case 'comingsoon':
				lozengeContainer.classList.remove('closed');
				lozengeContainer.classList.remove('inprogress');
				lozengeContainer.classList.add('comingsoon');

				lozengeContainer.innerHTML = 'Coming soon';
				break;

			case 'inprogress':
				lozengeContainer.classList.remove('comingsoon');
				lozengeContainer.classList.remove('closed');
				lozengeContainer.classList.add('inprogress');

				lozengeContainer.innerHTML = 'In progress';
				break;

			case 'closed':
				lozengeContainer.classList.remove('comingsoon');
				lozengeContainer.classList.remove('inprogress');
				lozengeContainer.classList.add('closed');

				lozengeContainer.innerHTML = 'Closed';
				break;
		}
	};

	this.addKeypoint = function (details) {
		keyPointsContainer.appendChild(domUtils.toDOM(`<li data-msg-id="${details.id}"><a href="#webchat-msg-${details.id}">${details.keyText}</a></li>`));
	};

	this.removeKeypoint = function (id) {
		const keypoint = keyPointsContainer.querySelector(`[data-msg-id="${id}"]`);
		if (keypoint) {
			keypoint.parentNode.removeChild(keypoint);
		}
	};
}

module.exports = HeaderContainer;
