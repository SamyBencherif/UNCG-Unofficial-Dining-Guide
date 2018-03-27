function TimeRange(start, end) {

	this.contains = function (val) {
		return start <= val && val <= end;
	};
}

function TimeSet(contains) {

	this.contains = contains;
	var weekdays = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

	//static method
	this.union = function () //takes n arguments
	{
		var args = arguments;
		var unionContains = function (val) {
			var res = false;
			for (var i = 0; i < args.length; i++)
				res = res || args[i].contains(val);
			return res;
		};
		return new TimeSet(unionContains);
	};

	//static method
	this.createFromDaily = function (startDOW, endDOW, startHr, endHr, startMin, endMin) {
		if (startMin == undefined) startMin = 0;
		if (endMin == undefined) endMin = 0;

		var startDOWNum = weekdays.indexOf(startDOW);
		var endDOWNum = weekdays.indexOf(endDOW);


		var TRS = [];
		for (var currDOWNum = startDOWNum; currDOWNum <= endDOWNum; currDOWNum++) {
			TRS.push(new TimeRange(currDOWNum * 1440 + startHr * 60 + startMin, currDOWNum * 1440 + endHr * 60 + endMin));
		}

		return this.union.apply(this, TRS);
	};
}

function FountainView() {

	this.live = true;
	this.sHr = 8;
	this.sMn = 20;

	var TS = (new TimeSet()); //for accessing 'static' methods

	this.breakfast = TS.createFromDaily('M', 'F', 7, 10);

	this.continental = TS.createFromDaily('M', 'F', 10, 11);

	this.lunchBrunch = TS.union(
		TS.createFromDaily('M', 'Th', 11, 14, 0, 30),
		TS.createFromDaily('F', 'F', 11, 14, 0, 0),
		TS.createFromDaily('Sa', 'Sa', 9, 14, 0, 0),
		TS.createFromDaily('S', 'S', 9, 14, 0, 0)
	);

	this.lightLunch = TS.union(
		TS.createFromDaily('M', 'F', 14, 16),
		TS.createFromDaily('S', 'S', 14, 16)
	);

	this.dinner = TS.union(
		TS.createFromDaily('M', 'Th', 16, 20, 0, 30),
		TS.createFromDaily('F', 'Sa', 16, 19, 0, 30),
		TS.createFromDaily('S', 'S', 16, 20, 0, 0)
	);

	this.service = TS.union(
		TS.createFromDaily('M', 'Th', 7, 20, 0, 30),
		TS.createFromDaily('F', 'F', 7, 19, 0, 30),
		TS.createFromDaily('Sa', 'Sa', 9, 14, 0, 0),
		TS.createFromDaily('Sa', 'Sa', 16, 19, 0, 30),
		TS.createFromDaily('S', 'S', 9, 20, 0, 0)
	);

	var DTtoTSE = function (DT) {
		var dayOfWeek = DT.getDay();
		var hour = DT.getHours();
		var minute = DT.getMinutes();
		var second = DT.getSeconds();

		return dayOfWeek * 60 * 24 + hour * 60 + minute + second / 60;
	};

	var stdTimezoneOffset = function (DT) {
		var jan = new Date(DT.getFullYear(), 0, 1);
		var jul = new Date(DT.getFullYear(), 6, 1);
		return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
	};

	var isDstObserved = function (DT) {
		return DT.getTimezoneOffset() < stdTimezoneOffset(DT);
	};

	this.getUNCGTimeAsTSE = function () {
		var now = new Date();
		var offset = -5; //UNCG's timezone.

		if (isDstObserved(now)) {
			offset += 1; //add an hour if it's DST.
		}

		var offsetTime = new Date().getTime() + offset * 3600 * 1000;
		var UTCString = new Date(offsetTime).toUTCString().replace(/ GMT$/, "");
		var uncgTimeDT = new Date(UTCString);

		//fake time for testing
		if (this.live)
			return DTtoTSE(uncgTimeDT);
		else
			return 1 * 60 * 24 + this.sHr * 60 + this.sMn;
	};

	//wrapper for convenience
	this.now = function () {
		return this.getUNCGTimeAsTSE();
	};

	//Is it Friday or Saturday?
	this.weekendNight = function () {
		return FV.now() / 60 / 24 == 5 || FV.now() / 60 / 24 == 6;
	};

	// this.getOptions = function () {

	// 	var uncgTime = getUNCGTimeAsTSE();

	// 	var opts = [];

	// 	if (breakfast.contains(uncgTime)) {
	// 		opts.push('breakfast');
	// 	}

	// 	if (continental.contains(uncgTime)) {
	// 		opts.push('continental');
	// 	}

	// 	if (lunchBrunch.contains(uncgTime)) {
	// 		opts.push('lunch / brunch');
	// 	}

	// 	if (lightLunch.contains(uncgTime)) {
	// 		opts.push('light lunch');
	// 	}

	// 	if (dinner.contains(uncgTime)) {
	// 		opts.push('dinner');
	// 	}

	// 	return opts;
	// };

	this.isOpen = function () {
		var uncgTime = this.getUNCGTimeAsTSE();

		return this.service.contains(uncgTime);
	};

	this.remaining = function (TS) {
		var uncgTime = this.getUNCGTimeAsTSE();

		var t = 0;

		while (t < 24 * 60 && TS.contains(uncgTime + t)) {
			t++;
		}

		return t - 1;
	};

	this.until = function (TS) {
		var uncgTime = this.getUNCGTimeAsTSE();

		var t = 0;

		while (t < 24 * 60 && !TS.contains(uncgTime + t)) {
			t++;
		}

		return t;
	};

	this.openFor = function () {
		return this.remaining(this.service);
	};

	this.willOpenIn = function () {
		return this.until(this.service);
	};

	this.durationPrint = function (dur) {
		var res = "";
		if (dur >= 120) {
			res += (~~(dur / 60) + " hours and ");
		} else if (dur >= 60) {
			res += ("1 hour and ");
		}

		if (dur % 60 == 1)
			res += ("1 minute");
		else res += (dur % 60 + " minutes");

		return res;
	};

}

var FV = new FountainView();

function updateStatus() {

	$('#FVClosed')[!FV.isOpen() ? 'show' : 'hide']();

	$('.FVTimeUntil').html("Opens in ");
	$('.FVTimeUntil').append(FV.durationPrint(FV.willOpenIn()));

	$('#FVOpen')[FV.isOpen() && FV.openFor() > 60 ? 'show' : 'hide']();
	$('#FVWarning')[(FV.isOpen() && FV.openFor() <= 60 && FV.openFor() > 30) ? 'show' : 'hide']();
	$('#FVClosing')[FV.isOpen() && FV.openFor() <= 30 ? 'show' : 'hide']();

	if (FV.isOpen()) {

		if (FV.openFor() == 60) {
			$('.FVTimeLeft').html("hour");
		}
		if (FV.openFor() < 60) {
			$('.FVTimeLeft').html(FV.openFor() + " minutes");
		}
		if (FV.openFor() == 1) {
			$('.FVTimeLeft').html(FV.openFor() + " minute");
		}
	}

	$('#menusTitle')[FV.isOpen() ? 'show' : 'hide']();

	$('#menusList')[FV.isOpen() ? 'show' : 'hide']();

	var timeTilTomorrow = 24 * 60 - (FV.now() % (24 * 60));

	var FVItems = [FV.breakfast, FV.continental, FV.lunchBrunch, FV.lightLunch, FV.dinner];
	var FVClassNames = ['.BreakfastTime', '.ContinentalTime', '.LunchTime', '.LLunchTime', '.DinnerTime'];

	for (var i = 0; i < FVItems.length; i++) {
		if (FVItems[i].contains(FV.now())) {
			$(FVClassNames[i]).html(FV.durationPrint(FV.remaining(FVItems[i])) + " left");
			$(FVClassNames[i]).addClass('uncg-blue-background');
		} else if (FV.until(FVItems[i]) > timeTilTomorrow) {
			$(FVClassNames[i]).removeClass('uncg-blue-background');

			if (FV.weekendNight()) //&& breakfast or continental
				$(FVClassNames[i]).html("Monday");
			else
				$(FVClassNames[i]).html("tomorrow");
		} else {
			$(FVClassNames[i]).removeClass('uncg-blue-background');

			$(FVClassNames[i]).html("in " + FV.durationPrint(FV.until(FVItems[i])));
		}
	}

}
$(document.body).ready(updateStatus);
setInterval(updateStatus, 1000);

// console.log((new FountainView()).isOpen());
// console.log((new FountainView()).getOptions());

// console.log((new FountainView()).openFor());

//quick test:

// var TS = (new TimeSet()); //for accessing 'static' methods
// var z = TS.union(
// 	TS.createFromDaily('M', 'T', 7, 10),
// 	TS.createFromDaily('F', 'F', 7, 10)
// );

// console.log(z.contains(5 * 1440 + 8 * 60));
// console.log(z.contains(0 * 1440 + 8 * 60 + 30));