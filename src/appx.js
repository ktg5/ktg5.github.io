const tiles = {
    'ktg5': {
        logoPrevSize: '20%',
        icon: "/img/tiles/icons/ktg5.webp",
        src: "html/ktg5.html"
    },
    'subscribe': {
        icon: "/img/tiles/icons/sub.webp",
        src: "/sub.html"
    },
    'patcat': {
        icon: "/img/tiles/icons/patcat.webp",
        src: "html/patcat.html"
    }
}

var appxDivs = {
    container: null,
    app: null,
    preview: null,
    appxTile: null,
    taskbar: null,
    taskIcon: null,
    taskTitle: null,
    taskButtons: null,
};

function appxLoad (appx) {
    if (appxDivs.app.src != 'about:blank') {
        appxDivs.app.style.display = 'block';

        // else make the taskbar disappear after a second
        if (isOverTaskbar() != true) appx.toggleTaskbar(false);
    }
}

// check to see if cursor is over taskbar
function isOverTaskbar() {
    const { x, y } = window.mousePos || {};
    if (x === undefined || y === undefined) return false;

    const elem = document.elementFromPoint(x, y);
    return appxDivs.taskbar.contains(elem);
}


class Appx {
    async toggleTaskbar (stat) {
        // added this here cuz in case of possible multi-tasking xdd
        // has to edited a bit tho if i were to do that
        // 
        // and i ain't ever doing it i hope
        if (this.taskbarLock == false) {
            let toggle = () => {
                this.taskbarLock = true;
                this.taskbarTimeout = setTimeout(() => {
                    this.taskbarLock = false;
                }, 500);
            }

            if (stat == true) {
                toggle();
                appxDivs.taskbar.setAttribute('data-toggle', '');
                if (!hintsData.titlebar) {
                    const hintName = 'titlebar';
                    toggleHint(hintName);
                    hintsData[hintName] = true;
                    saveToHints();
                }
            } else if (stat == false) {
                if (!isOverTaskbar()) {
                    setTimeout(() => {
                        if (!isOverTaskbar()) appxDivs.taskbar.removeAttribute('data-toggle');
                    }, 1000);
                }
            }
        }
    }


    elmnt = null;
    data = null;
    taskbarLock = false;
    taskbarTimeout = null;

    constructor (elmnt) {
        // check if elmnt is a item
        if (!elmnt) {
            let txt = 'Appx: bruv, you need a elmnt to pass thru!';
            console.error(txt);
            return alert(txt);
        }
        if (!elmnt.classList.contains('item')) {
            let txt = 'Appx: elmnt is not a .item, can\'t animate correctly!';
            console.error(txt);
            return alert(txt);
        }
        // check if the elmnt contains a "data-item-id" & if it's in the tiles list
        const elmntID = elmnt.getAttribute('data-item-id');
        if (!elmntID) {
            let txt = 'Appx: this elmnt does not have a "data-item-id"!';
            console.error(txt);
            return alert(txt);
        }
        let elmntData;
        if (elmntID) {
            for (const key in tiles) {
                if (key == elmntID) elmntData = tiles[key];
            }
        }
        if (!elmntData) {
            let txt = 'Appx: this elmnt\'s "data-item-id" could not be found in the "tiles" list.';
            console.error(txt);
            return alert(txt);
        }


        this.elmnt = elmnt;
        this.data = elmntData;


        denyMouse(true);
        const animationMs = 800;
        // animation for tiles
        document.querySelector('.topbar .topbar-title').style.animation = `${animationMs / 1000}s linear fadeOut`;
        document.querySelector('.groups').style.animation = `${animationMs / 1000}s linear tiles-out`;


        // copy tile clicked
        const appxItem = elmnt.cloneNode();
        appxItem.innerHTML = elmnt.innerHTML;
        appxDivs.container.style.setProperty('--appx-color', `${appxItem.style.backgroundColor}`);
        appxDivs.appxTile.appendChild(appxItem);

        // set data into appx-container
        stopLiveTiles = true;
        const appxLogo = elmntData.logo ? elmntData.logo : appxItem.querySelector('.item-logo img').src;
        const previewLogo = appxDivs.preview.querySelector('.item-logo img');
        previewLogo.src = appxLogo;
        previewLogo.parentElement.style.height = elmntData.logoPrevSize ? elmntData.logoPrevSize : '20%';
        appxDivs.taskIcon.src = appxLogo;
        appxDivs.taskTitle.innerHTML = elmntData.title ? elmntData.title : appxItem.querySelector('.item-title').textContent;


        // get tile size & pos & set to appx container
        elmnt.style.opacity = "0";

        appxDivs.container.style.setProperty('--og-x', `${elmnt.getBoundingClientRect().x}px`);
        appxDivs.container.style.setProperty('--og-y', `${elmnt.getBoundingClientRect().y}px`);
        appxDivs.container.style.setProperty('--og-width', `${elmnt.getBoundingClientRect().width}px`);
        appxDivs.container.style.setProperty('--og-height', `${elmnt.getBoundingClientRect().height}px`);
        appxDivs.container.style.animation = `${animationMs / 1000}s cubic-bezier(0, 0, 0.35, 1) tile-flip`;
        appxDivs.container.removeAttribute('data-hide');

        appxDivs.taskbar.style.animation = `${animationMs / 1000}s linear tile-flip-sub1`;
        appxDivs.preview.style.animation = `${animationMs / 1000}s linear tile-flip-sub1`;
        appxDivs.appxTile.style.animation = `${animationMs / 1000}s linear tile-flip-sub2`;

        // make mobile buttons disappear
        toggleMobileButtons(false);

        // during animation
        let fakeTileCheck = setInterval(() => {
            // scale fake item to the current width & height of the appx container
            appxItem.style.transform = `scale(
                ${appxDivs.container.getBoundingClientRect().width / bigTileSize},
                ${appxDivs.container.getBoundingClientRect().height / bigTileSize}
            )`;
        });

        // i could give a single less damn about these timeout thingys
        setTimeout(() => {
            document.querySelectorAll('.group-container .title').forEach(subelmnt => {
                subelmnt.style.animation = ".5s linear fadeIn";
                subelmnt.style.opacity = '0';
            });

            document.querySelector('.topbar .topbar-title').style.opacity = '0';
        }, ((animationMs / 1000) / 2) - 15);
        setTimeout(() => {
            clearInterval(fakeTileCheck);

            document.querySelectorAll('.group-container .group').forEach(subelmnt => {
                subelmnt.style.opacity = '0';
            });

            const startContainer = document.querySelector('#start-container');
            startContainer.style.animation = `none`;
            startContainer.style.display = "none";

            document.querySelector('.groups').style.animation = '';

            document.querySelector('.topbar .topbar-title').style.animation = '.5s linear fadeIn';

            denyMouse(false);

            if (!hintsData.titlebar) toggleHint('titlebar');

            fetch(elmntData.src).then(async rawData => {
                let html = await rawData.text();
                appxDivs.app.innerHTML = html;

                appxDivs.app.querySelectorAll('script').forEach(elmnt => {
                    const newElmnt = document.createElement('script');
                    newElmnt.src = elmnt.src;
                    newElmnt.innerHTML = elmnt.innerHTML;
                    elmnt.parentNode.insertBefore(newElmnt, elmnt);
                    elmnt.remove();
                });

                setTimeout(() => {
                    appxDivs.app.querySelectorAll('.scroll-wrapper').forEach(elmnt => { makeScrollbar(elmnt); });
                }, 50);

                appxLoad(this);
            });
        }, animationMs);

        // set click event on buttons
        document.querySelector('[data-mobbut="main"]').addEventListener('click', this.closeButton);
        document.querySelector('.button[data-button="close"]').addEventListener('click', this.closeButton);
        appxDivs.app.addEventListener('mousemove', () => {
            this.toggleTaskbar(false);
        });
        appxDivs.taskbar.querySelector('.detector').addEventListener('mouseenter', () => {
            this.toggleTaskbar(true);
        });
    }


    closeButton = () => { this.kill(); }

    async kill () {
        const animationMs = 250;
        denyMouse(true);
        appxDivs.taskbar.removeAttribute('data-toggle');

        // play animation
        appxDivs.container.style.animation = `${animationMs / 1000}s cubic-bezier(0, 0, 0.25, 1) jump-out`;
        setTimeout(() => {
            appxDivs.container.setAttribute('data-hide', null);
        }, animationMs - 15);

        setTimeout(() => {
            
            // clear everything from appx-container
            appxDivs.appxTile.innerHTML = '';
            appxDivs.taskIcon.src = '';
            appxDivs.taskTitle.innerHTML = '';
            appxDivs.taskButtons.removeEventListener('click', this.closeButton);
            document.querySelector('#appx-preview .item-logo img').src = '';
            appxDivs.app.innerHTML = '';
            appxDivs.app.style.display = '';
            appxDivs.appxTile.style.display = '';
            appxDivs.appxTile.innerHTML = '';

            // show stuff
            this.elmnt.style.opacity = '';
            setTimeout(() => {
                document.querySelector('#start-container').style.display = '';
                document.querySelector('.groups').style.animation = `${(animationMs / 1000) * 2}s cubic-bezier(0, 0, 0.15, 1) light-slide-in`;

                // more animation
                document.querySelector('.topbar .topbar-title').style.opacity = '';
                const groupDivs = document.querySelectorAll('.group-container .group');
                for (let i = 0; i < groupDivs.length; i++) {
                    const subelmnt = groupDivs[i];
                    let delay = 0;
                    if (i != 0) delay = .05 * i;

                    subelmnt.style.animation = `${animationMs / 1000}s cubic-bezier(0, 0, 0.15, 1) ${delay}s jump-in`;
                    setTimeout(() => {
                        subelmnt.style.opacity = "";
                    }, animationMs);
                }

                clearTileScroll();

                setTimeout(() => {
                    stopLiveTiles = false;
                    
                    denyMouse(false);

                    document.querySelectorAll('.group-container .title').forEach(subelmnt => {
                        subelmnt.style.opacity = '';
                    });

                    appxDivs.taskbar.setAttribute('data-toggle', '')
                }, 500);
            }, animationMs - 150);

        }, animationMs);
    }
}


window.addEventListener('load', async () => {
    appxDivs.container = document.querySelector('#appx-container');
    appxDivs.app = appxDivs.container.querySelector('#appx');
    appxDivs.preview = appxDivs.container.querySelector('#appx-preview');
    appxDivs.appxTile = appxDivs.container.querySelector('#appx-tile');
    appxDivs.taskbar = document.querySelector('#appx-taskbar');
    appxDivs.taskIcon = appxDivs.taskbar.querySelector('.icon img');
    appxDivs.taskTitle = appxDivs.taskbar.querySelector('.title');
    appxDivs.taskButtons = appxDivs.taskbar.querySelector('.buttons');
});