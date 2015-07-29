$(document).ready(function () {
    var parentDivs = $('#nestedAccordion div'),
        childDivs = $('#nestedAccordion h3').siblings('div');

    $('#nestedAccordion h2').click(function () {
        parentDivs.slideUp();
        if ($(this).next().is(':hidden')) {
            $(this).next().slideDown();
        } else {
            $(this).next().slideUp();
        }
    });

    $('#nestedAccordion h3').click(function () {
        childDivs.slideUp();
        if ($(this).next().is(':hidden')) {
            $(this).next().slideDown();
        } else {
            $(this).next().slideUp();
        }
    });
});