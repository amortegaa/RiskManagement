sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"ConsumoMatnr/zppconsumomatnr/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("ConsumoMatnr.zppconsumomatnr.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			window.AppId = this.getMetadata().getManifest()["sap.app"].id;

            if (window.location.href.indexOf("applicationstudio.cloud.sap") > -1) {

                window.RootPath = "";

            } else {

                window.RootPath = jQuery.sap.getModulePath(window.AppId);

            }

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		}
	});
});