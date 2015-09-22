// Angular Material Color Scheme

angular.module('ngColors', ['ngMaterial']).config(function ($mdThemingProvider) {
    var primary = {
        '50': '#c8e3aa',
        '100': '#bcdc97',
        '200': '#b0d683',
        '300': '#a4d070',
        '400': '#97c95d',
        '500': '#8BC34A',
        '600': '#7eb73d',
        '700': '#71a436',
        '800': '#649130',
        '900': '#577d2a',
        'A100': '#d5e9bd',
        'A200': '#e1efd0',
        'A400': '#edf6e3',
        'A700': '#496a23',
        'contrastDefaultColor': 'light',
        'contrastDarkColors': ['50', '100','200', '300', '400', 'A100'],
        'contrastLightColors': undefined
    };
    $mdThemingProvider
        .definePalette('primary',
                        primary);

    var accent = {
        '50': '#a3d7a5',
        '100': '#92cf94',
        '200': '#80c883',
        '300': '#6ec071',
        '400': '#5cb860',
        '500': '#4CAF50',
        '600': '#449d48',
        '700': '#3d8b40',
        '800': '#357a38',
        '900': '#2d682f',
        'A100': '#b5dfb7',
        'A200': '#c7e7c8',
        'A400': '#d9eeda',
        'A700': '#255627'
    };
    $mdThemingProvider
        .definePalette('accent',
                        accent);

    var warn = {
        '50': '#ffb280',
        '100': '#ffa266',
        '200': '#ff934d',
        '300': '#ff8333',
        '400': '#ff741a',
        '500': '#ff6400',
        '600': '#e65a00',
        '700': '#cc5000',
        '800': '#b34600',
        '900': '#993c00',
        'A100': '#ffc199',
        'A200': '#ffd1b3',
        'A400': '#ffe0cc',
        'A700': '#803200'
    };
    $mdThemingProvider
        .definePalette('warn',
                        warn);

   $mdThemingProvider.theme('default')
       .primaryPalette('primary', {
          'default':'500',
          'hue-1': '300',
          'hue-2': '400',
          'hue-3': '900'
       })
       .accentPalette('accent')
       .warnPalette('warn')
});
