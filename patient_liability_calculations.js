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