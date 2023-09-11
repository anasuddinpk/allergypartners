var _rowCount = 0;
function onLoad() {

    var funtionName = "onLoad";

    try {

        //setting timeout beacuse subgid take some time to load after the form is loaded
        console.log("THIS IS WORKING!!");

        setTimeout(function () {

            //validating to check if the sub grid is present on the form

            if (Xrm.Page != null && Xrm.Page != undefined && Xrm.Page.getControl("estimate_code_subgrid") != null && Xrm.Page.getControl("estimate_code_subgrid") != undefined) {

                //stores the row count of subgrid on load event of CRM Form

                _rowCount = Xrm.Page.getControl("estimate_code_subgrid").getGrid().getTotalRecordCount();

                //registering refreshform function onload event of subgrid

                Xrm.Page.getControl("estimate_code_subgrid").addOnLoad(onGridLoad);

            }

        }, 5000);

    } catch (e) {

        Xrm.Utility.alertDialog(functionName + "Error: " + (e.message || e.description));

    }

}
function onGridLoad(executionContext) {
    var formContext = executionContext.getFormContext();
    var functionName = " onGridLoad ";

    var currentRowCount = null;

    try {

        //setting timeout beacuse subgrid take some time to load after the form is loaded

        setTimeout(function () {

            //validating to check if the sub grid is present on the form

            if (Xrm.Page != null && Xrm.Page != undefined && Xrm.Page.getControl("estimate_code_subgrid") != null && Xrm.Page.getControl("estimate_code_subgrid") != undefined) {

                //stores the row count of subgrid on load event of CRM Form

                currentRowCount = Xrm.Page.getControl("estimate_code_subgrid").getGrid().getTotalRecordCount();

                if (currentRowCount > _rowCount) {

                    //call the intended function which we want to call only when records are added to the grid
                    // alert("Row added");

                    var x = onLoadRefreshRollupField(executionContext);
                    if (x) {
                        x.then(
                            function (res) {
                                console.log(res);
                                PatientLiabilityCalculations(executionContext);
                            }
                        )
                    } else {
                        PatientLiabilityCalculations(executionContext);
                    }

                    //set current row count to the global row count

                    _rowCount = currentRowCount;

                }

                else if (currentRowCount < _rowCount) {

                    //call the intended function which we want to call only when records are removed from the grid
                    // alert("Row deleted");
                    var x = onLoadRefreshRollupField(executionContext);
                    if (x) {
                        x.then(
                            function (res) {
                                console.log(res);
                                PatientLiabilityCalculations(executionContext);
                            }
                        )
                    } else {
                        PatientLiabilityCalculations(executionContext);
                    }

                    //set current row count to the global row count

                    _rowCount = currentRowCount;

                }

            }

        }, 1500);

    } catch (e) {

        Xrm.Utility.alertDialog(functionName + "Error: " + (e.message || e.description));

    }

}
function refreshRollupField(executionContext, entityName, entityIdSchemaName, entityId, rollup_fieldName) {
    'use strict';

    var formContext = executionContext.getFormContext();
    // var clientUrl = formContext.context.getClientUrl();


    var Sdk = window.Sdk || {};
    debugger;
    Sdk.CalculateRollupFieldRequest = function (entityName, rollup_fieldName) {
        this.Target = entityName;
        this.FieldName = rollup_fieldName;
    };

    Sdk.CalculateRollupFieldRequest.prototype.getMetadata = function () {
        return {
            boundParameter: null,
            parameterTypes: {
                "Target": {
                    "typeName": "mscrm.crmbaseentity",
                    "structuralProperty": 5
                },
                "FieldName": {
                    "typeName": "Edm.String",
                    "structuralProperty": 1
                }
            },
            operationType: 1, // This is a function. Use '0' for actions and '2' for CRUD
            operationName: "CalculateRollupField"
        };
    };

    // Create variables to point to a quote record and to a specific field

    var projectId = {};

    projectId["@odata.type"] = "Microsoft.Dynamics.CRM." + entityName

    projectId[entityIdSchemaName] = entityId;




    // Create variable calculateRollupFieldRequest and pass those variables created above
    var calculateRollupFieldRequest = new Sdk.CalculateRollupFieldRequest(projectId, rollup_fieldName);

    // Use the request object to execute the function
    return Xrm.WebApi.online.execute(calculateRollupFieldRequest).then(
        function (response) {
            debugger;
            console.log("Status: %s %s", response.status, response.statusText);
            formContext.data.refresh();


            return response.json()
            // var globalContext = Xrm.Utility.getGlobalContext(); 
            // var systemuserid = globalContext.userSettings.userId;
            // var systemuserid_refined = systemuserid.replace("{", "").replace("}", "");
            // var notificationRecord = {
            //     "title": "Success",
            //     "body": "Line Sum has been updated",
            //     "ownerid@odata.bind": "/systemusers(" + systemuserid_refined + ")",
            //     "icontype": 100000001, // info
            //     "toasttype": 200000000 // timed
            // };
            // // Create notification record
            // Xrm.WebApi.createRecord("appnotification", notificationRecord).
            // then(
            //     function success(result) {
            //         console.log("notification created with ID: " + result.id);
            //     },
            //     function (error) {
            //         console.log(error.message);
            //         // handle error conditions
            //     }
            // );
            // Use response.json() to access the content of the response body.
            // response.json().then(
            //     function (responseBody) { //Do something with the response
            //         console.log(responseBody);
            //     });
        },
        function (error) {
            debugger;
            console.log(error.message);
            // handle error conditions
        });

};
function onLoadRefreshRollupField(executionContext) {
    debugger;
    'use strict';
    var formContext = executionContext.getFormContext();
    var formType = formContext.ui.getFormType();
    if (formType > 1) {
        var entityId = formContext.data.entity.getId();
        //var projectLookUpId = formContext.getAttribute("imd_project");
        if (entityId) {
            entityId = formContext.data.entity.getId().replace("{", "").replace("}", "");
            return refreshRollupField(executionContext, "imperium_patientestimate", "imperium_patientestimateid", entityId, "imperium_linesum");
        }
    }
};

function PatientLiabilityCalculations(executionContext) {
    debugger
    let formContext = executionContext.getFormContext();

    //Show Line OR Total without Deduct/Coins/Copay
    let showLine = formContext.getAttribute("imperium_showline").getValue()

    //Line Sume OR Total Allowed Amount ($)
    let lineSum = formContext.getAttribute("imperium_linesum").getValue()

    //Estimated Patient Liability
    let estimatedPatientLiabilityField = formContext.getAttribute("imperium_estimatedpatientliability")

    if (showLine == '0') {

        //Deductile Calculations
        let deductibleMax = formContext.getAttribute("imperium_deductible").getValue()
        let deductibleMet = formContext.getAttribute("imperium_deductibleamountmet").getValue()
        let deductible = 0

        //Coinsurance
        let coinsurance = formContext.getAttribute("imperium_coinsurance").getValue() / 100

        //Copay
        let copay = formContext.getAttribute("imperium_officecopay").getValue()

        //Actual Copay
        let actualCopay = 0

        let outOfPocketMax_MOOP_Max = formContext.getAttribute("imperium_outofpocketmax").getValue()
        let outOfPocketMet_MOOP_Met = formContext.getAttribute("imperium_outofpocketamountmet").getValue()
        let amountLeft_MOOP = outOfPocketMax_MOOP_Max - outOfPocketMet_MOOP_Met

        let estimatedPatientLiability = 0
        let serviceCategory = ""

        //Total Allowed Amount
        let totalAllowedAmount = 0

        //Sum of Non-Visit Line Amounts
        let sumOfNonVisitLineAmounts = 0

        //Sum of All Line Amounts
        let sumOfAllLineAmounts = 0

        //Patient Responsibility
        let patientResponsibility = 0

        let CurrentGuid = Xrm.Page.data.entity.getId();

        let product_lookup = CurrentGuid.replace("{", "").replace("}", "");

        let fetchXml = "?fetchXml="
            + "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>"
            + "<entity name='imperium_estimatecode'>"
            + "<attribute name='imperium_procedureprice' />"
            + "<attribute name='imperium_lineamount' />"
            + "<attribute name='imperium_perunitcontractrate' />"
            + "<link-entity name='cr8aa_codableconcept' from='cr8aa_codableconceptid' to='imperium_cptcode' link-type='inner'>"
            + "<link-entity name='imperium_servicecategory' link-type='inner' from='imperium_servicecategoryid' to='imperium_category'>"
            + "<attribute name='imperium_name' />"
            + "</link-entity>"
            + "</link-entity>"
            + "<filter type='and'>"
            + "<condition attribute='imperium_estimate' operator='eq' uiname='' uitype='imperium_patientestimate' value='{" + product_lookup + "}' />"
            + "</filter>"
            + "</entity>"
            + "</fetch>";

        Xrm.WebApi.retrieveMultipleRecords("imperium_estimatecode", fetchXml).then(
            function success(result) {
                debugger
                if (result.entities.length > 0) {

                    if (copay != 0 && copay != null) {

                        console.log("- Copay = " + copay)

                        for (let i = 0; i < result.entities.length; i++) {

                            console.log(">> Iterations # " + i + 1 + "!!")

                            serviceCategory = result.entities[i]["imperium_servicecategory2.imperium_name"];
                            serviceCategory = serviceCategory.toLowerCase();

                            if (serviceCategory.includes("office visit") || serviceCategory.includes("consultation visit")) {

                                console.log("- Office / Consultation Visit!")

                                if (copay < result.entities[i].imperium_lineamount) {

                                    estimatedPatientLiability = copay
                                }
                                else {
                                    estimatedPatientLiability = result.entities[i].imperium_lineamount
                                }

                                console.log("- Estimated Patient Liability (Visit) = " + estimatedPatientLiability)
                            }
                            else {

                                console.log("- No Office / Consultation Visit!")
                                sumOfNonVisitLineAmounts += parseFloat(result.entities[i].imperium_lineamount);

                            }

                            serviceCategory = ""
                        }

                        totalAllowedAmount = sumOfNonVisitLineAmounts
                        console.log("Total Allowed Amount = " + totalAllowedAmount)

                        //PatientResponsibility
                        patientResponsibility = returnPatientResponsibilityAfterDeductibleValidation(deductible, deductibleMax, deductibleMet, totalAllowedAmount, coinsurance)
                        patientResponsibility += estimatedPatientLiability

                        estimatedPatientLiability += returnPatientLiabilityAfterMOOPValidation(amountLeft_MOOP, estimatedPatientLiability, patientResponsibility, estimatedPatientLiabilityField)
                        console.log("Final Liability = " + estimatedPatientLiability)

                    }
                    else if (copay == 0 || copay == null) {

                        console.log("- Copay = " + copay)

                        for (let i = 0; i < result.entities.length; i++) {

                            console.log(">> Iterations # " + i + 1 + "!!")

                            sumOfAllLineAmounts += parseFloat(result.entities[i].imperium_lineamount);

                            console.log("- Sum of All Line Amounts (Including Visit) = " + sumOfAllLineAmounts)

                        }

                        totalAllowedAmount = sumOfAllLineAmounts
                        console.log("Total Allowed Amount = " + totalAllowedAmount)

                        //PatientResponsibility
                        patientResponsibility = returnPatientResponsibilityAfterDeductibleValidation(deductible, deductibleMax, deductibleMet, totalAllowedAmount, coinsurance)
                        patientResponsibility += estimatedPatientLiability

                        estimatedPatientLiability += returnPatientLiabilityAfterMOOPValidation(amountLeft_MOOP, estimatedPatientLiability, patientResponsibility, estimatedPatientLiabilityField)
                        console.log("Final Liability = " + estimatedPatientLiability)

                    }
                }
                else {
                    console.log(">> No Iterations!!")
                    console.log("- Estimated Patient Liability = " + estimatedPatientLiability)
                    estimatedPatientLiability = 0
                }

                // NEW CODE START - Mustafa
                // estimatedPatientLiability *= 100;
                // estimatedPatientLiability = Math.ceil(estimatedPatientLiability);
                // estimatedPatientLiability /= 100;
                // NEW CODE END

            },
            function (error) {

                console.log(error.message);
            }
        );


    }
    else if (showLine == '1') {
        lineSum *= 100;
        lineSum = Math.ceil(lineSum);
        lineSum /= 100;

        estimatedPatientLiabilityField.setValue(lineSum);
    }

}

function returnPatientResponsibilityAfterDeductibleValidation(deductible, deductibleMax, deductibleMet, totalAllowedAmount, coinsurance) {
    debugger

    if (deductibleMax > 0) {

        deductible = deductibleMax - deductibleMet;

        if (deductible > totalAllowedAmount) {
            patientResponsibility = totalAllowedAmount;
            console.log("- Patient Responsibility = " + patientResponsibility)
        }
        else if (deductible < totalAllowedAmount) {
            patientResponsibility = deductible + (totalAllowedAmount - deductible) * (assignOne(coinsurance))
            console.log("- Patient Responsibility = " + patientResponsibility)
        }
        else if (deductible == 0 || deductible == null) {
            patientResponsibility = totalAllowedAmount * assignOne(coinsurance)
            console.log("- Patient Responsibility = " + patientResponsibility)

        }
    }
    else {
        patientResponsibility = 0
    }

    return patientResponsibility
}

function returnPatientLiabilityAfterMOOPValidation(amountLeft_MOOP, estimatedPatientLiability, patientResponsibility, estimatedPatientLiabilityField) {

    console.log("Inside: amountLeft_MOOP = " + amountLeft_MOOP + ",  estimatedPatientLiability = " + estimatedPatientLiability + ",  patientResponsibility = " + patientResponsibility)

    if (amountLeft_MOOP == 0) {
        estimatedPatientLiability += 0;
        console.log("- Estimated Patient Liability (Non- Visit) = " + 0)
    }
    else if (amountLeft_MOOP > patientResponsibility) {
        //estimatedPatientLiability = parseFloat(patientResponsibility) + parseFloat(actualCopay);
        estimatedPatientLiability = parseFloat(patientResponsibility)
        console.log("- Estimated Patient Liability (Non- Visit) = " + patientResponsibility)
    }
    else if (amountLeft_MOOP <= patientResponsibility) {
        function PatientLiabilityCalculations(executionContext) {
            debugger
            let formContext = executionContext.getFormContext();

            //Show Line OR Total without Deduct/Coins/Copay
            let showLine = formContext.getAttribute("imperium_showline").getValue()

            //Line Sume OR Total Allowed Amount ($)
            let lineSum = formContext.getAttribute("imperium_linesum").getValue()

            //Estimated Patient Liability
            let estimatedPatientLiabilityField = formContext.getAttribute("imperium_estimatedpatientliability")

            if (showLine == '0') {

                //Deductile Calculations
                let deductibleMax = formContext.getAttribute("imperium_deductible").getValue()
                let deductibleMet = formContext.getAttribute("imperium_deductibleamountmet").getValue()
                let deductible = 0

                //Coinsurance
                let coinsurance = formContext.getAttribute("imperium_coinsurance").getValue() / 100

                //Copay
                let copay = formContext.getAttribute("imperium_officecopay").getValue()

                //Actual Copay
                let actualCopay = 0

                let outOfPocketMax_MOOP_Max = formContext.getAttribute("imperium_outofpocketmax").getValue()
                let outOfPocketMet_MOOP_Met = formContext.getAttribute("imperium_outofpocketamountmet").getValue()
                let amountLeft_MOOP = outOfPocketMax_MOOP_Max - outOfPocketMet_MOOP_Met

                let estimatedPatientLiability = 0
                let serviceCategory = ""

                //Total Allowed Amount
                let totalAllowedAmount = 0

                //Sum of Non-Visit Line Amounts
                let sumOfNonVisitLineAmounts = 0

                //Sum of All Line Amounts
                let sumOfAllLineAmounts = 0

                //Patient Responsibility
                let patientResponsibility = 0

                let CurrentGuid = Xrm.Page.data.entity.getId();

                let product_lookup = CurrentGuid.replace("{", "").replace("}", "");

                let fetchXml = "?fetchXml="
                    + "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>"
                    + "<entity name='imperium_estimatecode'>"
                    + "<attribute name='imperium_procedureprice' />"
                    + "<attribute name='imperium_lineamount' />"
                    + "<attribute name='imperium_perunitcontractrate' />"
                    + "<link-entity name='cr8aa_codableconcept' from='cr8aa_codableconceptid' to='imperium_cptcode' link-type='inner'>"
                    + "<link-entity name='imperium_servicecategory' link-type='inner' from='imperium_servicecategoryid' to='imperium_category'>"
                    + "<attribute name='imperium_name' />"
                    + "</link-entity>"
                    + "</link-entity>"
                    + "<filter type='and'>"
                    + "<condition attribute='imperium_estimate' operator='eq' uiname='' uitype='imperium_patientestimate' value='{" + product_lookup + "}' />"
                    + "</filter>"
                    + "</entity>"
                    + "</fetch>";

                Xrm.WebApi.retrieveMultipleRecords("imperium_estimatecode", fetchXml).then(
                    function success(result) {
                        debugger
                        if (result.entities.length > 0) {

                            if (copay != 0 && copay != null) {

                                console.log("- Copay = " + copay)

                                for (let i = 0; i < result.entities.length; i++) {

                                    console.log(">> Iterations # " + i + 1 + "!!")

                                    serviceCategory = result.entities[i]["imperium_servicecategory2.imperium_name"];
                                    serviceCategory = serviceCategory.toLowerCase();

                                    if (serviceCategory.includes("office visit") || serviceCategory.includes("consultation visit")) {

                                        console.log("- Office / Consultation Visit!")

                                        if (copay < result.entities[i].imperium_lineamount) {

                                            estimatedPatientLiability = copay
                                        }
                                        else {
                                            estimatedPatientLiability = result.entities[i].imperium_lineamount
                                        }

                                        console.log("- Estimated Patient Liability (Visit) = " + estimatedPatientLiability)
                                    }
                                    else {

                                        console.log("- No Office / Consultation Visit!")
                                        sumOfNonVisitLineAmounts += parseFloat(result.entities[i].imperium_lineamount);

                                    }

                                    serviceCategory = ""
                                }

                                totalAllowedAmount = sumOfNonVisitLineAmounts
                                console.log("Total Allowed Amount = " + totalAllowedAmount)

                                //PatientResponsibility
                                patientResponsibility = returnPatientResponsibilityAfterDeductibleValidation(deductible, deductibleMax, deductibleMet, totalAllowedAmount, coinsurance)
                                patientResponsibility += estimatedPatientLiability

                                estimatedPatientLiability += returnPatientLiabilityAfterMOOPValidation(amountLeft_MOOP, estimatedPatientLiability, patientResponsibility, estimatedPatientLiabilityField)
                                console.log("Final Liability = " + estimatedPatientLiability)

                            }
                            else if (copay == 0 || copay == null) {

                                console.log("- Copay = " + copay)

                                for (let i = 0; i < result.entities.length; i++) {

                                    console.log(">> Iterations # " + i + 1 + "!!")

                                    sumOfAllLineAmounts += parseFloat(result.entities[i].imperium_lineamount);

                                    console.log("- Sum of All Line Amounts (Including Visit) = " + sumOfAllLineAmounts)

                                }

                                totalAllowedAmount = sumOfAllLineAmounts
                                console.log("Total Allowed Amount = " + totalAllowedAmount)

                                //PatientResponsibility
                                patientResponsibility = returnPatientResponsibilityAfterDeductibleValidation(deductible, deductibleMax, deductibleMet, totalAllowedAmount, coinsurance)
                                patientResponsibility += estimatedPatientLiability

                                estimatedPatientLiability += returnPatientLiabilityAfterMOOPValidation(amountLeft_MOOP, estimatedPatientLiability, patientResponsibility, estimatedPatientLiabilityField)
                                console.log("Final Liability = " + estimatedPatientLiability)

                            }
                        }
                        else {
                            console.log(">> No Iterations!!")
                            console.log("- Estimated Patient Liability = " + estimatedPatientLiability)
                            estimatedPatientLiability = 0
                        }

                        // NEW CODE START - Mustafa
                        // estimatedPatientLiability *= 100;
                        // estimatedPatientLiability = Math.ceil(estimatedPatientLiability);
                        // estimatedPatientLiability /= 100;
                        // NEW CODE END

                    },
                    function (error) {

                        console.log(error.message);
                    }
                );


            }
            else if (showLine == '1') {
                lineSum *= 100;
                lineSum = Math.ceil(lineSum);
                lineSum /= 100;

                estimatedPatientLiabilityField.setValue(lineSum);
            }

        } function returnPatientResponsibilityAfterDeductibleValidation(deductible, deductibleMax, deductibleMet, totalAllowedAmount, coinsurance) {
            debugger

            if (deductibleMax > 0) {

                deductible = deductibleMax - deductibleMet;

                if (deductible > totalAllowedAmount) {
                    patientResponsibility = totalAllowedAmount;
                    console.log("- Patient Responsibility = " + patientResponsibility)
                }
                else if (deductible < totalAllowedAmount) {
                    patientResponsibility = deductible + (totalAllowedAmount - deductible) * (assignOne(coinsurance))
                    console.log("- Patient Responsibility = " + patientResponsibility)
                }
                else if (deductible == 0 || deductible == null) {
                    patientResponsibility = totalAllowedAmount * assignOne(coinsurance)
                    console.log("- Patient Responsibility = " + patientResponsibility)

                }
            }
            else {
                patientResponsibility = 0
            }

            return patientResponsibility
        }
        estimatedPatientLiability = parseFloat(amountLeft_MOOP)
        console.log("- Estimated Patient Liability (Non- Visit) = " + amountLeft_MOOP)
    }

    console.log("Inside Liability: " + estimatedPatientLiability)

    estimatedPatientLiabilityField.setValue(estimatedPatientLiability);
}

//Checking if value is 0 or null, then assign it to 1
function assignOne(toBeReturned) {

    if (toBeReturned == 0 || toBeReturned == null) {
        toBeReturned = 1;
    }

    return toBeReturned;
}