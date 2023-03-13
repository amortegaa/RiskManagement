sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
		getFormatDate: function (sDate) {
			if (sDate) {
				var oDate = new Date(sDate);
				if (oDate.getFullYear() === -1) {
					return "";
				}
				var fecha = sDate.split("T")[0];
				fecha = fecha.split("-");
				var sFormatDate = fecha[2] + "/" + this.formatter.paddZeroes(fecha[1], 2) + "/" + fecha[0];
				return sFormatDate; // + " - " + sTime;
			} else {
				return "";

			}
		},

		paddZeroes: function (number, size) {
			number = number.toString();
			while (number.length < size) number = "0" + number;
			return number;
		},
		formatValue: function (value) {
			if (value) {
				value = value.toString().replace(",", "");
				value = parseFloat(value).toFixed(3);
				var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
					maxFractionDigits: 3,
					groupingEnabled: true,
					groupingSeparator: ",",
					decimalSeparator: "."
				});

				return oNumberFormat.format(value);
			}
		},
		formatValuePer: function (value) {
			value = parseFloat(value).toFixed(2);
			var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: "",
				decimalSeparator: "."
			});
			return oNumberFormat.format(value);
		},
		Time: function (val) {
			if (val) {
				val = val.replace(/^PT/, '').replace(/S$/, '');
				val = val.replace('H', ':').replace('M', ':');

				var multipler = 60 * 60;
				var result = 0;
				val.split(':').forEach(function (token) {
					result += token * multipler;
					multipler = multipler / 60;
				});
				var timeinmiliseconds = result * 1000;

				// var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
				// 	pattern: "KK:mm:ss a"
				// });	

				var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
					pattern: "HH:mm:ss a"
				});

				var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
				return timeFormat.format(new Date(timeinmiliseconds + TZOffsetMs));
			}
			return null;
		},

		formatUMB: function (umB, umCW) {
			var um;
			if (umCW) {
				um = umCW;
			} else {
				um = umB;
			}
			return (um);
		}
	};

});