const hogan = require('hogan.js');

module.exports = {
	container: hogan.compile(requireText('../../templates/container.mustache')),
	header: hogan.compile(requireText('../../templates/header.mustache')),
	editForm: hogan.compile(requireText('../../templates/editForm.mustache')),
	editor: hogan.compile(requireText('../../templates/editor.mustache')),
	participant: hogan.compile(requireText('../../templates/participant.mustache')),
	participantList: hogan.compile(requireText('../../templates/participantList.mustache')),
};
