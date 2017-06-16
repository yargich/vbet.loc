/* global CMS */
CMS.constant('WPConfig', {
//    wpUrl: 'http://10.32.5.1/wordpress/',
//    wpUrl: 'http://vbet5admin.betconstruct.int/',
    wpUrl: 'http://next.vbet.com/json',  // WordpResss instance serving pages, banners
    twitterUrl: '//twitter.betconstruct.com/twitter.php',
    wpNewsUrl:  {
        main: 'http://www.vbet.com/json'
    },  // WordpResss instance serving news
    wpPokerPromoUrl: null, // can be url of json interface serving poker promo "news". if null, news url from wpNewsUrl will be used
    wpPromoUrl: null, // can be url of json interface serving poker promo "news". if null, news url from wpNewsUrl will be used
    seoFilesGenerationActive: false,
    cmsTimeZone: '+04:00',
    wpBaseHost: 'www.vbet.com',  // this parameter will be passed to JSON api and all links in response(e.g. images) will have this host
    wpNewsBaseHost: 'www.vbet.com', // this parameter will be passed to JSON api and all links in NEWS response(e.g. images) will have this host
    hiddenNewsCategoryIds: [113, 119, 114, 120, 121, 112],  //hide specific news categories from menu
    news: {
        newsPerGroup: 3, //news in a row
        newsPerGroupWide: 4, //news in a row
        pokerNewsPerGroup: 3, //poker news in a row
        pokerNewsPerGroupWide: 3,//poker news in a row
        numberOfRecentNews: 12, //initial number of recent news to show
        increaseBy: 6, // load this number of additional news when clicking "load more"
        increaseByWide: 8, // load this number of additional news when clicking "load more"
        maxVisibleSports: 5, //maximum number of sports visible in news (the rest will go in "more" block)
        maxVisibleSportsWide: 11, //maximum number of sports visible in news (the rest will go in "more" block)
        maxVisibleSportsHomePage: 4, //maximum number of sports visible in news (the rest will go in "more" block)
        sportsColumnsNumber: 6, //number of columns in Sports  "more" dropdown block,
        langRootCategories: { // IDs of root categories for each language in WordPress
            'eng': '11',
            'rus': '12',
            'arm': '13',
            'gre': '109'
        }
    },
    help: {
        pageSlugs: {
            'default': 'help-root'
        },
        popupPageSlugs: {
            'default': 'help-popup'
        }
    },
    bannerSlugs: {
        headerSmallBanner: {
            'default': 'header-small-banner'
        },
        homepageRotatingBanners: {
            //isWidget: true,
            'default': 'homepage-selected-game'
        },
        homepageBanners: {
            'default': 'homepage-banners'
        },
        homepageRightBanners: {
            'default': 'homepage-banners-right'
        },
        homepageBottomBanners: {
            'default': 'homepage-banners-bottom'
        },
        homepageAdditionalBanner1: {
            'default': 'homepage-additional-banner'
        },
        dashboardBanners: {
            'default': 'dashboard-banners'
        },
        poker: {
            'default': 'poker'
        },
        belote: {
            'default': 'belote'
        },
        backgammon: {
            'default': 'backgammon'
        },
        casino: {
            'default': 'casino'
        },
        livecasino: {
            'default': 'livedealer-banners'
        },
        'casino-winners': {
            'default': 'casino-biggest-wins'
        }
    },
    belote: {
        mainPageSlugs: {        //Page category slug in wordpress
            'default': 'belote'
        },
        mainPageHeaderSlugs: {        //Page title slug in wordpress
            'default': 'belote-header'
        }
    },
    deberc: {
        mainPageSlugs: {        //Page category slug in wordpress
            'default': 'deberc'
        }
    },
    'live-casino': {
        mainPageSlugs: {        //Page category slug in wordpress
            'default': 'live-casino'
        },
        mainPageHeaderSlugs: {        //Page title slug in wordpress
            'default': 'live-casino-header'
        }
    },
    backgammon: {
        mainPageSlugs: {        //Page category slug in wordpress
            'default': 'backgammon'
        },
        mainPageHeaderSlugs: {        //Page title slug in wordpress
            'default': 'backgammon-header'
        },
        newsCategorySlugs: {        //Page category slug in wordpress
            'default': 'backgammon'
        }
    },
    poker: {
        mainPageSlugs: {        //Page category slug in wordpress
            'default': 'poker'
        },
        newsCategorySlugs: {        //Page category slug in wordpress
            'default': 'poker'
        },
        leaderboardWidget: {        //leaderboard block on homepage
            'default': 'homepage-poker-leaderboard'
        },
        tournamentCategorySlugs: {        //Page category slug in wordpress
            'default': 'poker-tournament'
        },
        newsPageSlug: {             // "News" page slug where news(posts) will be shown
            'eng': 'news'
        }
    },
    'new-poker': {
        mainPageSlugs: {        //Page category slug in wordpress
            'default': 'poker'
        },
        newsCategorySlugs: {        //Page category slug in wordpress
            'default': 'poker'
        },
        leaderboardWidget: {        //leaderboard block on homepage
            'default': 'homepage-poker-leaderboard'
        },
        tournamentCategorySlugs: {        //Page category slug in wordpress
            'default': 'poker-tournament'
        },
        newsPageSlug: {             // "News" page slug where news(posts) will be shown
            'eng': 'news'
        }
    },
    landing: {
        landingContentSlug: {
            'default': 'landing-page'
        }
    },
    promotions: {
        newsCategorySlugs: {        //Page category slug in wordpress
            'default': 'promotions'
        }
    },
    casinoPromotions: {
        newsCategorySlugs: {        //Page category slug in wordpress
            'default': 'promotions-casino'
        }
    },
    'promotions-vip': {
        newsCategorySlugs: {        //Page category slug in wordpress
            'default': 'promotions-vip'
        }
    },
    'chinese-poker': {
        mainPageSlugs: {        //Page category slug in wordpress
            'default': 'chinese-poker'
        },
        newsCategorySlugs: {        //Page category slug in wordpress
            'default': 'chinese-poker'
        }
    }
});