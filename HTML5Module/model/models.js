sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createCenterModel: function () {
			var center = {results:[{
				centro: "1000",
				descripcion:"Centro Ate",
				planificador:[{
					codigo:"101",
					descripcion:"Planif. UHT"
				},{
					codigo:"102",
					descripcion:"Planif. Cárnicos"
				},{
					codigo:"103",
					descripcion:"Planif. Lácticos"
				},{
					codigo:"C01",
					descripcion:"MRP ATE"
				}]
			}, {
				centro: "2000",
				descripcion:"Centro Arequipa",
				planificador:[{
					codigo:"201",
					descripcion:"Planif. Arequipa"
				},{
					codigo:"C02",
					descripcion:"MRP Arequipa"
				}]
			}, {
				centro: "3000",
				descripcion:"Centro Majes",
				planificador:[{
					codigo:"301",
					descripcion:"Planif. Majes"
				},{
					codigo:"C03",
					descripcion:"MRP Majes"
				}]
			}]};
			var oModel = new JSONModel(center);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		}

	};
});