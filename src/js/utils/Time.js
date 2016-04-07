"use strict";

function Time (serverTime) {
	let self = this;

	this.localTime = function (milliseconds) {
		let timeNow = new Date();
		return (milliseconds) ? timeNow.getTime() : Math.round(timeNow.getTime() / 1000);
	};

	let serverTimeOffset = serverTime - this.localTime();

	this.serverTime = function (milliseconds) {
		let timeNow = self.localTime(milliseconds);
		return timeNow + serverTimeOffset;
	};
}

module.exports = Time;
