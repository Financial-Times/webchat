"use strict";

function ScrollMonitor (el, callback) {
	let self = this;

	let elToListen = el;
	let elToReadPosition = el;
	if (el === document.body || el === document.getElementsByTagName('html')[0] || el === window) {
		elToReadPosition = [document.body, document.getElementsByTagName('html')[0]];
		elToListen = window;
	}

	let started = false;


	let lastTime = 0;
	let throttle = 200;
	let lastScrollPosition;
	let lastScrollPositionCheck;
	let i;


	function getAttributeValue (attribute) {
		let value;

		if (elToReadPosition instanceof Array) {
			value = 0;
			for (i = 0; i < elToReadPosition.length; i++) {
				if (elToReadPosition[i][attribute] > 0) {
					value = elToReadPosition[i][attribute];
				}
			}
		} else {
			value = elToReadPosition[attribute];
		}

		return value;
	}

	function setScrollTop (value) {
		if (elToReadPosition instanceof Array) {
			for (i = 0; i < elToReadPosition.length; i++) {
				elToReadPosition[i].scrollTop = value;
			}
		} else {
			elToReadPosition.scrollTop = value;
		}
	}


	function onValidScroll (force) {
		const scrollPosition = getAttributeValue('scrollTop');

		if (force || lastScrollPosition !== scrollPosition) {
			lastScrollPosition = scrollPosition;
			callback(scrollPosition);
		}
	}


	function onScroll () {
		clearTimeout(lastScrollPositionCheck);
		lastScrollPositionCheck = setTimeout(function () {
			onValidScroll();
		}, throttle);

		if (new Date().getTime() - lastTime > throttle) {
			lastTime = new Date().getTime();

			onValidScroll(true);
		}
	}

	this.start = function () {
		if (!started) {
			started = true;

			elToListen.addEventListener('scroll', onScroll);
		}
	};

	this.stop = function () {
		if (started) {
			started = false;

			elToListen.removeEventListener('scroll', onScroll);
		}
	};

	this.getPosition = function () {
		if (getAttributeValue('scrollTop') === 0) {
			return 'top';
		} else if (getAttributeValue('scrollTop') >= getAttributeValue('scrollHeight') - getAttributeValue('clientHeight')) {
			return 'bottom';
		} else {
			return 'middle';
		}
	};

	this.scrollToTop = function () {
		setScrollTop(0);
	};

	this.scrollToBottom = function () {
		setScrollTop(getAttributeValue('scrollHeight'));
	};

	this.destroy = function () {
		this.stop();

		elToListen = null;
		elToReadPosition = null;

		started = null;
		lastTime = null;
		throttle = null;
		lastScrollPosition = null;
		lastScrollPositionCheck = null;
		i = null;
	};

	this.start.call(this);
}
module.exports = ScrollMonitor;
