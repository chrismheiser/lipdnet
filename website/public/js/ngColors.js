// Angular Material Color Scheme

var c = angular.module('ngColors', []);

c.config(function($mdThemingProvider) {
    $mdThemingProvider.definePalette('blues', {
        "50": "#4fe7c9",
        "100": "#38e4c2",
        "200": "#22e1bb",
        "300": "#1ccdaa",
        "400": "#19b698",
        "500": "#16a085",
        "600": "#138a72",
        "700": "#107360",
        "800": "#0d5d4d",
        "900": "#0a463a",
        "A100": "#65ead0",
        "A200": "#7cedd7",
        "A400": "#92f0de",
        "A700": "#073028",
        'contrastDefaultColor': 'light', // whether, by default, text (contrast)
        // on this palette should be dark or light
        'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
            '200', '300', '400', 'A100'
        ],
        'contrastLightColors': undefined // could also specify this if default was 'dark'
    });

    // $mdThemingProvider.theme('docs-dark', 'default')
    //    .primaryPalette('yellow')
    //    .dark();
    $mdThemingProvider.theme('default')
        .primaryPalette('blues');
});
