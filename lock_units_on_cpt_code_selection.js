function lockUnitFieldOnCptSelection(executionContext) {
    var formContext = executionContext.getFormContext()
    var unitsControl = formContext.getControl('imperium_units')
    var unitsField = formContext.getAttribute('imperium_units')

    var cptCodeLookup = formContext.getAttribute("imperium_cptcode").getValue();

    if (cptCodeLookup) {
        var cptCodeId = cptCodeLookup[0].id.replace("{", "").replace("}", "");

        var apiUrl = Xrm.Page.context.getClientUrl() + "/api/data/v9.2/cr8aa_codableconcepts(" + cptCodeId + ")?$select=cr8aa_name&$expand=imperium_Category($select=imperium_name;)";
        var req = new XMLHttpRequest();
        var categoryName = ""
        req.open("GET", apiUrl, true);
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status === 200) {

                    var response = JSON.parse(this.response);
                    categoryName = response['imperium_Category']['imperium_name']
                    categoryName = categoryName.toLowerCase();


                    if (categoryName.includes("visit")) {
                        console.log("Visit found")
                        unitsControl.setDisabled(true);
                        unitsField.setValue(1)
                    }
                    else {
                        console.log("Visit not found")
                        unitsControl.setDisabled(false);
                        unitsField.setValue(null)
                    }

                }
                else {
                    alert("Error: " + this.statusText);
                }

            }
        };
        req.send();
    }
    else {
        console.log("No CPT Code selected.");
        unitsControl.setDisabled(false)
        unitsField.setValue(null)
    }
}