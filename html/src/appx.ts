import Main from "./main";


const tiles = {
    'ktg5': {
        logoPrevSize: '20%',
        icon: "/img/tiles/icons/ktg5.webp",
        src: "html/ktg5.html",
    },
    'subscribe': {
        icon: "/img/tiles/icons/sub.webp",
        src: "/sub.html"
    },
    'patcat': {
        icon: "/img/tiles/icons/patcat.webp",
        src: "html/patcat.html"
    }
};
type TileKeys = keyof typeof tiles;

var appxDivs = {
    container: null as HTMLElement | null,
    app: null as HTMLElement | null,
    preview: null as HTMLElement | null,
    appxTile: null as HTMLElement | null,
    taskbar: null as HTMLElement | null,
    taskIcon: null as HTMLImageElement | null,
    taskTitle: null as HTMLElement | null,
    taskButtons: null as HTMLElement | null,
};

function appxLoad (appx: Appx) {
    if (
        appxDivs.app
        && appxDivs.app.getAttribute('src') != 'about:blank'
    ) {
        appxDivs.app.style.display = 'block';

        // else make the taskbar disappear after a second
        if (isOverTaskbar() != true) appx.toggleTaskbar(false);
    }
}

// check to see if cursor is over taskbar
function isOverTaskbar() {
    if (!appxDivs.taskbar) return;

    const { x, y } = window.mousePos || {};
    if (x === undefined || y === undefined) return false;

    const elem = document.elementFromPoint(x, y);
    return appxDivs.taskbar.contains(elem);
}


type Tile = {
    logoPrevSize?: string,
    title?: string,
    icon: string,
    src: string,
    logo?: string
}


export class Appx {
    elmnt: HTMLElement | undefined;
    data: Tile | undefined;
    taskbarLock = false;
    taskbarTimeout: number | undefined;


    async toggleTaskbar (stat: boolean) {
        // added this here cuz in case of possible multi-tasking xdd
        // has to edited a bit tho if i were to do that
        // 
        // and i ain't ever doing it i hope
        if (this.taskbarLock === false) {
            let toggle = () => {
                this.taskbarLock = true;
                this.taskbarTimeout = setTimeout(() => {
                    this.taskbarLock = false;
                }, 500);
            }

            if (stat === true) {
                if (!appxDivs.taskbar) return;

                toggle();
                appxDivs.taskbar.setAttribute('data-toggle', '');

                document.querySelector(`[data-notif="titlebar"]`)?.setAttribute('data-hide', '');
            } else if (stat === false) {
                if (!isOverTaskbar()) {
                    setTimeout(() => {
                        if (
                            !isOverTaskbar()
                            && appxDivs.taskbar
                        ) appxDivs.taskbar.removeAttribute('data-toggle');
                    }, 1000);
                }
            }
        }
    }


    constructor (elmnt: HTMLElement) {
        // check if elmnt is a item
        if (!elmnt) {
            let txt = 'Appx: bruv, you need a elmnt to pass thru!';
            console.error(txt);
            alert(txt);
        }
        if (!elmnt.classList.contains('item')) {
            let txt = 'Appx: elmnt is not a .item, can\'t animate correctly!';
            console.error(txt);
            alert(txt);
        }
        // check if the elmnt contains a "data-item-id" & if it's in the tiles list
        const elmntID = elmnt.getAttribute('data-item-id');
        if (!elmntID) {
            let txt = 'Appx: this elmnt does not have a "data-item-id"!';
            console.error(txt);
            alert(txt);
        }
        let elmntData: Tile | undefined;
        if (elmntID) {
            for (const key in tiles) {
                if (Object.prototype.hasOwnProperty.call(tiles, key)) {
                    const tileKey = key as TileKeys;
                    if (tileKey === elmntID) {
                        elmntData = tiles[tileKey];
                    }
                }
            }
        }


        this.elmnt = elmnt;
        if (elmntData) {
            this.data = elmntData;

            let hintsData = Main.getHintsData();


            Main.denyMouse(true);
            const animationMs = 800;
            // animation for tiles
            (document.querySelector('.topbar .topbar-title') as HTMLElement).style.animation = `${animationMs / 1000}s linear fadeOut`;
            (document.querySelector('.groups') as HTMLElement).style.animation = `${animationMs / 1000}s linear tiles-out`;


            // copy tile clicked
            const appxItem = elmnt.cloneNode() as HTMLElement;
            appxItem.innerHTML = elmnt.innerHTML;

            // set data into appx-container
            Main.setLiveTiles(true);
            const appxLogo = elmntData.logo ? elmntData.logo : (appxItem.querySelector('.item-logo img') as HTMLImageElement).src;


            // get tile size & pos & set to appx container
            elmnt.style.opacity = "0";

            if (appxDivs.container) {
                appxDivs.container.style.setProperty('--appx-color', `${appxItem.style.backgroundColor}`);

                appxDivs.container.style.setProperty('--og-x', `${elmnt.getBoundingClientRect().x}px`);
                appxDivs.container.style.setProperty('--og-y', `${elmnt.getBoundingClientRect().y}px`);
                appxDivs.container.style.setProperty('--og-width', `${elmnt.getBoundingClientRect().width}px`);
                appxDivs.container.style.setProperty('--og-height', `${elmnt.getBoundingClientRect().height}px`);
                appxDivs.container.style.animation = `${animationMs / 1000}s cubic-bezier(0, 0, 0.35, 1) tile-flip`;
                appxDivs.container.removeAttribute('data-hide');
            }
            if (appxDivs.appxTile) {
                appxDivs.appxTile.appendChild(appxItem);
                appxDivs.appxTile.style.animation = `${animationMs / 1000}s linear tile-flip-sub2`;
            }
            if (appxDivs.preview) {
                const previewLogo = appxDivs.preview.querySelector('.item-logo img') as HTMLImageElement;
                previewLogo.src = appxLogo;
                if (previewLogo.parentElement) previewLogo.parentElement.style.height = elmntData.logoPrevSize ? elmntData.logoPrevSize : '20%';

                appxDivs.preview.style.animation = `${animationMs / 1000}s linear tile-flip-sub1`;
            }
            if (appxDivs.taskbar) {
                appxDivs.taskbar.style.animation = `${animationMs / 1000}s linear tile-flip-sub1`;
            }
            if (appxDivs.taskIcon) {
                appxDivs.taskIcon.src = appxLogo;
            }
            if (appxDivs.taskTitle) {
                appxDivs.taskTitle.innerHTML = elmntData.title ? elmntData.title : (appxItem.querySelector('.item-title') as HTMLElement).textContent;
            }

            // make mobile buttons disappear
            Main.toggleMobileButtons(false);

            // during animation
            let fakeTileCheck = setInterval(() => {
                if (
                    !appxDivs.container
                    || !Main.bigTileSize
                ) return;

                // scale fake item to the current width & height of the appx container
                appxItem.style.transform = `scale(
                    ${appxDivs.container.getBoundingClientRect().width / Main.bigTileSize},
                    ${appxDivs.container.getBoundingClientRect().height / Main.bigTileSize}
                )`;
            });

            // i could give a single less damn about these timeout thingys
            setTimeout(() => {
                (document.querySelectorAll('.group-container .title') as NodeListOf<HTMLElement>).forEach(subelmnt => {
                    subelmnt.style.animation = ".5s linear fadeIn";
                    subelmnt.style.opacity = '0';
                });

                (document.querySelector('.topbar .topbar-title') as HTMLElement).style.opacity = '0';
            }, ((animationMs / 1000) / 2) - 15);
            setTimeout(() => {
                clearInterval(fakeTileCheck);

                (document.querySelectorAll('.group-container .group') as NodeListOf<HTMLElement>).forEach(subelmnt => {
                    subelmnt.style.opacity = '0';
                });

                const startContainer = document.querySelector('#start-container') as HTMLElement;
                startContainer.style.animation = `none`;
                startContainer.style.display = "none";

                (document.querySelector('.groups') as HTMLElement).style.animation = '';

                (document.querySelector<HTMLElement>('.topbar .topbar-title') as HTMLElement).style.animation = '.5s linear fadeIn';

                Main.denyMouse(false);

                if (
                    !Main.mobileMode
                    && hintsData.titlebar !== true
                ) {
                    const hintName = 'titlebar';
                    Main.toggleHint(hintName);
                    hintsData[hintName] = true;
                    Main.saveToHints(hintsData);
                }

                fetch(elmntData.src).then(async rawData => {
                    if (!appxDivs.app) return;

                    let html = await rawData.text();
                    appxDivs.app.innerHTML = html;

                    appxDivs.app.querySelectorAll<HTMLScriptElement>('script').forEach(elmnt => {
                        if (!elmnt) return;
                        const newElmnt = document.createElement('script');
                        newElmnt.src = elmnt.src;
                        newElmnt.innerHTML = elmnt.innerHTML;
                        if (elmnt.parentNode) elmnt.parentNode.insertBefore(newElmnt, elmnt);
                        elmnt.remove();
                    });

                    setTimeout(() => {
                        if (appxDivs.app) appxDivs.app.querySelectorAll('.scroll-wrapper').forEach(elmnt => { Main.makeScrollbar(elmnt as HTMLElement); });
                    }, 50);

                    appxLoad(this);
                });
            }, animationMs);

            // set click event on buttons
            (document.querySelector('[data-mobbut="main"]') as HTMLElement).addEventListener('click', this.closeButton);
            (document.querySelector('.button[data-button="close"]') as HTMLElement).addEventListener('click', this.closeButton);
            if (appxDivs.app) appxDivs.app.addEventListener('mousemove', () => {
                this.toggleTaskbar(false);
            });
            if (appxDivs.taskbar) (appxDivs.taskbar.querySelector('.detector') as HTMLElement).addEventListener('mouseenter', () => {
                this.toggleTaskbar(true);
            });
        }
    }


    closeButton = () => { this.kill(); }

    async kill () {
        const animationMs = 250;
        Main.denyMouse(true);
        if (appxDivs.taskbar) appxDivs.taskbar.removeAttribute('data-toggle');

        // play animation
        if (appxDivs.container) appxDivs.container.style.animation = `${animationMs / 1000}s cubic-bezier(0, 0, 0.25, 1) jump-out`;
        setTimeout(() => {
            if (appxDivs.container) appxDivs.container.setAttribute('data-hide', '');
        }, animationMs - 15);

        setTimeout(() => {
            
            // clear everything from appx-container
            if (appxDivs.taskIcon) appxDivs.taskIcon.src = '';
            if (appxDivs.taskTitle) appxDivs.taskTitle.innerHTML = '';
            if (appxDivs.taskButtons) appxDivs.taskButtons.removeEventListener('click', this.closeButton);
            (document.querySelector('#appx-preview .item-logo img') as HTMLImageElement).src = '';
            if (appxDivs.app) {
                appxDivs.app.innerHTML = '';
                appxDivs.app.style.display = '';
            }
            if (appxDivs.appxTile) {
                appxDivs.appxTile.innerHTML = '';
                appxDivs.appxTile.style.display = '';
                appxDivs.appxTile.innerHTML = '';
            }

            // show stuff
            if (this.elmnt) this.elmnt.style.opacity = '';
            setTimeout(() => {
                (document.querySelector('#start-container') as HTMLElement).style.display = '';
                (document.querySelector('.groups') as HTMLElement).style.animation = `${(animationMs / 1000) * 2}s cubic-bezier(0, 0, 0.15, 1) light-slide-in`;

                // more animation
                (document.querySelector('.topbar .topbar-title') as HTMLElement).style.opacity = '';
                const groupDivs = document.querySelectorAll('.group-container .group');
                for (let i = 0; i < groupDivs.length; i++) {
                    const subelmnt = groupDivs[i] as HTMLElement;
                    let delay = 0;
                    if (i != 0) delay = .05 * i;

                    subelmnt.style.animation = `${animationMs / 1000}s cubic-bezier(0, 0, 0.15, 1) ${delay}s jump-in`;
                    setTimeout(() => {
                        subelmnt.style.opacity = "";
                    }, animationMs);
                }

                Main.clearTileScroll();

                setTimeout(() => {
                    Main.setLiveTiles(false);
                    Main.denyMouse(false);

                    (document.querySelectorAll('.group-container .title') as NodeListOf<HTMLElement>).forEach(subelmnt => {
                        subelmnt.style.opacity = '';
                    });

                    if (appxDivs.taskbar) appxDivs.taskbar.setAttribute('data-toggle', '')
                }, 500);
            }, animationMs - 150);

        }, animationMs);
    }
}


window.addEventListener('load', async () => {
    appxDivs.container = document.querySelector('#appx-container') as HTMLElement;
    if (appxDivs.container) {
        appxDivs.app = appxDivs.container.querySelector('#appx') as HTMLElement;
        appxDivs.preview = appxDivs.container.querySelector('#appx-preview') as HTMLElement;
        appxDivs.appxTile = appxDivs.container.querySelector('#appx-tile') as HTMLElement;
    }
    appxDivs.taskbar = document.querySelector('#appx-taskbar') as HTMLElement;
    appxDivs.taskIcon = appxDivs.taskbar.querySelector('.icon img') as HTMLImageElement;
    appxDivs.taskTitle = appxDivs.taskbar.querySelector('.title') as HTMLElement;
    appxDivs.taskButtons = appxDivs.taskbar.querySelector('.buttons') as HTMLElement;
});
