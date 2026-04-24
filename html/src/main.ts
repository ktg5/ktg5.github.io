import { Appx } from './appx';
import { type getChannelData, twitchgql } from './twitch.js';
// @ts-ignore
import { Howl } from 'howler';


var
    bigTileSize: number | undefined,
    // @ts-ignore
    currentAppx: Appx,
    mobileButtons: HTMLElement,
    hintsData: Record<string, boolean>,
    stopLiveTiles = false,
    mobileMode = false;
const hintsStore = 'ktg5-hints';
// var scrollbars = {};
const currentDate = new Date();

export function setLiveTiles(toggle: boolean) {
    stopLiveTiles = toggle;
}


// Viewport percent to pixels functions code spinnets I found like years ago lol
export function vh(percent: number) {
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return (percent * h) / 100;
}
  
export function vw(percent: number) {
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    return (percent * w) / 100;
}


// Used for when viewing >1:1 for that scrollbar on Win8 apps
export function makeScrollbar(wrapper: HTMLElement) {
    if (!wrapper) {
        let txt = 'makeScrollbar: bruv, you need a wrapper to pass thru!';
        console.error(txt);
        return alert(txt);
    }
    // NO.
    // if (!wrapper.classList.contains('scroll-wrapper')) {
    //     txt = 'makeScrollbar: wrapper is not a .scroll-wrapper, can\'t animate correctly!';
    //     console.error(txt);
    //     return alert(txt);
    // }
    if (wrapper.childElementCount != 1) {
        let txt = 'makeScrollbar: this wrapper must contain a div to contain your content & ONLY that!!!';
        console.error(txt);
        return alert(txt);
    }
    if (!wrapper.getAttribute('data-scrollbutton-amount')) {
        let txt = 'makeScrollbar: the attribute "data-scrollbutton-amount" is not set on the wrapper!';
        console.error(txt);
        return alert(txt);
    }


    // Make the thing
    const scrollbar = document.createElement('div');
    scrollbar.classList.add('scroll-fakebar');
    scrollbar.innerHTML = `
        <div class="scroll-fakebar__button" data-action="left"></div>
        <div class="scroll-fakebar__bar">
            <div class="scroll-fakebar__bar__scrubber"></div>
        </div>
        <div class="scroll-fakebar__button" data-action="right"></div>
    `;
    wrapper.parentNode?.insertBefore(scrollbar, wrapper);

    // Calcuate fakebar bar width & max scroll. Hate doing this shit
    let maxScroll = wrapper.children[0].scrollWidth - window.innerWidth;
    const scrollbarBar = scrollbar.querySelector(`.scroll-fakebar__bar__scrubber`) as HTMLElement;
    let scrollbarBarWidth: number;


    // Set scrollbar size
    function setScrollbarSize() {
        if (!scrollbarBar.parentElement) return;

        maxScroll = wrapper.children[0].scrollWidth - window.innerWidth;
        scrollbarBarWidth = scrollbarBar.parentElement.clientWidth + (scrollbarBar.parentElement.clientWidth - wrapper.children[0].scrollWidth) + 68;
        scrollbarBar.style.width = `${scrollbarBarWidth}px`;
    }
    setScrollbarSize();


    // Tell scrollwheel to piss off & only scroll horizontally
    const scrollAmount = 100;
    let lastScroll = 0;
    wrapper.addEventListener('wheel', e => {
        if (mobileMode) return;
        const scrollL = wrapper.scrollLeft;
        const amount = ((e.deltaY < 0) ? (scrollAmount * -1) : scrollAmount);

        let eq = ((scrollL % scrollAmount === 0) ? (scrollL + amount) : (lastScroll + amount));
        if (eq > maxScroll) eq = maxScroll;

        lastScroll = eq;
        wrapper.scrollLeft = eq;
        e.preventDefault();
    });


    // On scroll
    const scrollFunc = () => {
        if (mobileMode) return;
        let eq = ((lastScroll) / (maxScroll + scrollbarBarWidth) * 100);
        if (eq < 0) eq = 0;
        if (lastScroll > maxScroll) eq = ((maxScroll) / (maxScroll + scrollbarBarWidth) * 100);

        scrollbarBar.style.left = `${eq}%`
    }
    wrapper.addEventListener('scroll', scrollFunc);


    // On wrapper resize
    window.addEventListener('resize', () => {
        if (mobileMode) return;
        setScrollbarSize();
        scrollFunc();
    });


    // Click events for scroll buttons
    const scrollButtonGap = Number(wrapper.getAttribute('data-scrollbutton-amount'));
    scrollbar.querySelectorAll('.scroll-fakebar__button').forEach(elmnt => {
        const elmntDataAction = elmnt.getAttribute('data-action');
        switch (elmntDataAction) {
            case 'left':
                elmnt.addEventListener('click', () => {
                    if (mobileMode) return;
                    let eq = wrapper.scrollLeft - scrollButtonGap;
                    if (eq < 0) eq = 0;
                    lastScroll = eq;
                    wrapper.scrollLeft = eq;
                });
            break;
        
            case 'right':
                elmnt.addEventListener('click', () => {
                    if (mobileMode) return;
                    let eq = wrapper.scrollLeft + scrollButtonGap;
                    if (eq < 0) eq = 0;
                    lastScroll = eq;
                    wrapper.scrollLeft = eq;
                });
            break;
        }
    });


    // Various events for the scrollbar's bar.....
    let followScroll = false;
    scrollbarBar.addEventListener('mousedown', () => {
        if (mobileMode) return;
        followScroll = true; // START
    });
    document.addEventListener('mouseup', () => {
        if (mobileMode) return;
        scrollbarBar.style.transition = '';
        followScroll = false; // nono
    });
    document.addEventListener('mousemove', (e) => {
        if (mobileMode) return;
        // Just follow the cursor when mousedown, that simple
        if (followScroll == true) {
            let eq = wrapper.scrollLeft + e.movementX;
            scrollbarBar.style.transition = 'none';
            wrapper.scrollLeft = eq;
            lastScroll = eq;
        }
    });


    return scrollbar;
}


// deny mouse
export function denyMouse(state: boolean) {
    const denyDiv = document.querySelector('#deny-mouse') as HTMLElement;

    if (denyDiv) {
        switch (state) {
            case true:
                denyDiv.style.display = 'block';
            break;
        
            case false:
                denyDiv.style.display = 'none';
            break;
        }
    }
}


// toggle mobile buttons
function toggleMobileButtons(force?: boolean) {
    mobileButtons.toggleAttribute('data-hide', force ? !force : undefined);
    if (
        mobileButtons.getAttribute('data-hide') == ""
        || mobileButtons.getAttribute('data-hide') == null
    ) {
        if (hintsData) if (
            mobileMode
            && mobileButtons.getAttribute('data-hide') !== null
            && (
                !hintsData.navbar
                || hintsData.navbar !== true
            )
        ) toggleHint('navbar');
    }
}


// Stringify for LocalStorage
export function saveToStorage(item: string, data: object) {
    return localStorage.setItem(item, JSON.stringify(data));
}


// Toggle specific hint
export function toggleHint(name: string) {
    const targetHint = document.querySelector(`[data-notif="${name}"]`);
    if (targetHint) targetHint.toggleAttribute('data-hide');
}

// Save to hints local storage
export const saveToHints = (hintsData: Record<string, boolean>) => { saveToStorage(hintsStore, hintsData); };


// Global tile functions
// Clear tile scroll
function clearTileScroll() {
    // Make live tiles go to the start
    (document.querySelectorAll('.item-tile-container') as NodeListOf<HTMLElement>).forEach(itemContent => {
        const tiles = itemContent.querySelectorAll('.item-tile');
        if (tiles.length > 1) {
            itemContent.scrollTop = 0;
            const itemTile = itemContent.querySelector('.item-tile') as HTMLElement;
            if (itemTile) updateTile(itemTile);
        }
    });
}

// Update tile data. This is used mostly when a live tile switches
// to a new tile & checks for specific data attributes to change
// stuff on the tile.
function updateTile(tile: HTMLElement) {
    if (!tile.parentElement) return;

    const elmntTitle = tile.parentElement.querySelector('.item-title') as HTMLElement;
    if (
        tile
        && elmntTitle
    ) {
        if (tile.getAttribute('data-item-disabletitle') != null) elmntTitle.style.opacity = '0';
        else elmntTitle.style.opacity = '1';
        if (tile.getAttribute('data-title-shadow') != null) elmntTitle.setAttribute('data-shadow', '');
        else elmntTitle.removeAttribute('data-shadow');
        // data-shadow
    }
}


// Loading gif
const loadingFontCodes = {
    start: 0xE052,
    end: 0xE0cb,
    await: 10
}
export class loadingDiv {
    insertDiv: HTMLElement;
    elmnt: HTMLElement | undefined;
    size: number | undefined;
    currentCode: number | undefined;
    interval: number | undefined;
    loopedEnd = 0;

    constructor(insertDiv: HTMLElement, size: number) {
        this.insertDiv = insertDiv;
        let possibleLoading = insertDiv.querySelector('.loading-gif') as HTMLElement;
        if (possibleLoading) {
            // Get information from current loading gif in insertDiv
            this.elmnt = possibleLoading;
            this.size = Number(this.elmnt.style.getPropertyValue('--this-size').replace('px', ''));
        } else if (this.elmnt !== undefined) {
            this.size = size;

            // Create loading elmnt
            this.elmnt = document.createElement('div');
            this.elmnt.classList.add('loading-gif');
            this.elmnt.style.setProperty('--this-size', `${this.size}px`);
            this.insertDiv.appendChild(this.elmnt);

            // Interval for swappin the string charcode for the next one
            this.interval = setInterval(() => {
                if (
                    this.currentCode !== undefined
                    && this.currentCode > loadingFontCodes.end
                ) {
                    if (this.loopedEnd >= 5) this.currentCode = loadingFontCodes.start
                    else this.loopedEnd++;
                } else {
                    if (
                        !this.elmnt
                        || !this.currentCode
                    ) return;

                    this.loopedEnd = 0;
                    this.elmnt.innerHTML = String.fromCharCode(this.currentCode);
                    this.currentCode++;
                }
            }, 30);
        }
    }

    async kill() {
        clearInterval(this.interval);
        if (this.elmnt) this.elmnt.remove();
    }
}


// LOADINGINGIGNIGNIG
declare global {
    interface Window {
        loadInt: number;
        slowMfTime: number;
        slowMf: boolean;
        mousePos: { x: number, y: number };
    }
}
window.addEventListener('load', async () => {

    // Birthday stuff
    if (currentDate.getMonth() === 6 && currentDate.getDate() === 12) (document.querySelector('[data-item-id="ktg5"] .item-logo img') as HTMLImageElement).src = '/img/logo-w1-birthday.png';


    // Load time related things
    if (window.loadInt) {
        clearInterval(window.loadInt);
        console.log('LOAD TIME:', window.loadInt);
        if (window.loadInt > window.slowMfTime) window.slowMf = true;
    }

    // Show start
    (document.querySelector('#start-container') as HTMLElement).style.display = '';
    // Hints
    (document.querySelector('#help-notifs') as HTMLElement).style.opacity = '';

    // Check for mouse movingly
    window.addEventListener('mousemove', (e) => {
        window.mousePos = { x: e.clientX, y: e.clientY };
    });


    // Vars used
    const itemContents = document.querySelectorAll('.item-tile-container') as NodeListOf<HTMLElement>;
    bigTileSize = Number(getComputedStyle((document.querySelector(':root') as HTMLElement)).getPropertyValue('--big-tile').replace('px', ''));


    function firstTileAnim() {
        denyMouse(true);
        setTimeout(() => {
            denyMouse(false);
        }, 2500);
    }


    // On resize
    // Resize groups to fit the tiles inside
    let clearedAdjusted = false;
    function adjustGroupWidths() {
        if (mobileMode) return;
        clearedAdjusted = false;

        (document.querySelectorAll('.group') as NodeListOf<HTMLElement>).forEach((group) => {
            const groupHeight = group.clientHeight;
            const items = Array.from(group.children) as HTMLElement[];
            const itemHeight = items[0]?.offsetHeight;
            const gap = parseInt(getComputedStyle(group).gap);
    
            const totalHeightPerItem = itemHeight + gap;
            const itemsPerColumn = Math.floor(groupHeight / totalHeightPerItem);
            const numColumns = Math.ceil(items.length / itemsPerColumn);
    
            let itemWidth = items[0]?.offsetWidth;
            if (items[0].classList.contains('item-group-m')) {
                const itemGroup = Array.from(items[0].children) as HTMLElement[];
                itemGroup.forEach((item) => {
                    itemWidth += item.offsetWidth + 4;
                });
            }

            const calc = ((itemWidth + gap) * numColumns - gap) / 2;
            group.style.width = `${calc}px`;
        });
    }
    let adjustGroupsInt = setInterval(adjustGroupWidths, 10);
    // Run on load and resize
    setTimeout(() => {
        clearInterval(adjustGroupsInt);
    }, 2000);

    // Mobile Check
    let pastCalc: boolean, pastMode: boolean;
    function mobileCheck() {
        // const calc = (window.innerWidth * 1.325) < (window.innerHeight);
        const calc = window.innerWidth < window.innerHeight;
        if (calc) {
            // Mobile mode
            document.body.setAttribute('data-mobile', 'true');
            mobileMode = true;
            clearTileScroll();

            if (clearedAdjusted === false) {
                (document.querySelectorAll('.group') as NodeListOf<HTMLElement>).forEach(group => {
                    group.style.width = '';
                });
                clearedAdjusted = true;
            }
        } else {
            document.body.removeAttribute('data-mobile');
            mobileMode = false;
        }

        if (calc !== pastCalc) clearTileScroll();
        pastCalc = calc;

        if (pastMode !== mobileMode) {
            if (pastMode) firstTileAnim();
            pastMode = mobileMode;
        }
    }
    window.addEventListener('resize', () => {
        // Mobile check & shit
        mobileCheck();
        // Group tile reiszes
        if (!mobileMode) adjustGroupWidths();
    });
    mobileCheck();


    // Mobile touch events
    mobileButtons = document.querySelector('#mobile-buttons') as HTMLElement;
    let startY: number | null;
    window.addEventListener('touchstart', (e) => {
        // Mobile buttons
        startY = e.touches[0].clientY;
    
        const fromBottom = window.innerHeight - startY;
        if (!(fromBottom < window.innerHeight * 0.07)) startY = null;
    });
    window.addEventListener('touchmove', (e) => {
        // Mobile buttons
        if (startY === null) return;
    
        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY;

        if (deltaY >= vh(10)) {
            // Hide mobile buttons
            toggleMobileButtons();
            startY = null;
        }
    });
    window.addEventListener('touchend', () => {
        // Mobile buttons
        startY = null;
    });


    // Set hint actions & hints var
    // First init
    const hintsStoreStorage = localStorage.getItem(hintsStore)
    if (hintsStoreStorage) hintsData = JSON.parse(hintsStoreStorage);
    if (!hintsData) {
        hintsData = {};
        saveToHints(hintsData);
    }
    // Actions & more init
    const allHints = document.querySelectorAll('#help-notif');
    allHints.forEach(hintDiv => {
        const hintName = hintDiv.getAttribute('data-notif');
        if (!hintName || !hintsData) return;

        // If the hint is not in the hintsData
        if (!hintsData[hintName]) { 
            hintsData[hintName] = false;
            saveToHints(hintsData);
        }

        // Make action buttons worky
        const hintActions = hintDiv.querySelectorAll('.actions button');
        hintActions.forEach(hintAction => {
            const hintEvent = hintAction.getAttribute('data-hint-action');
            const hintToggle = hintDiv.querySelector(`label[data-hint-tied="${hintAction.getAttribute('data-hint-tied')}"]`);
            
            // Click action
            hintAction.addEventListener('click', () => {
                switch (hintEvent) {
                    case 'close-hint':
                        toggleHint(hintName);
                    break;
                }

                // Save hint data
                function saveToTarget() {
                    if (!hintName || !hintsData) return;
                    hintsData[hintName] = !hintsData[hintName];
                    saveToHints(hintsData);
                }

                // If there's a checkbox with the button
                if (hintToggle) {
                    const hintCheckBox = hintToggle.querySelector('input');
                    if (hintCheckBox && hintCheckBox.getAttribute('type') == "checkbox" && hintCheckBox.checked) saveToTarget();
                }
            });
        });
        // Make sure checkboxes are set to unchecked
        const hintCheckBoxes = hintDiv.querySelectorAll('.actions label input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
        hintCheckBoxes.forEach(hintCheckBox => { hintCheckBox.checked = false; });
    });


    // Will return false if the animation was cancelled
    // True if everything went wonderful
    function scrollTileAnimation(element: HTMLElement, target: number, duration: number) {
        return new Promise((resolve) => {
            const start = element.scrollTop;
            const distance = target - start;
            const startTime = performance.now();
        
            // ease animation
            function animation(t: number) {
                return t < 0.5
                    ? 8 * Math.pow(t, 4)
                    : 1 - Math.pow(-2 * t + 2, 4) / 2;
            }

            let stopStepping = false;
            const resizeListener = () => {
                stopStepping = true;
                window.removeEventListener('resize', resizeListener);
                resolve(false);
            }
            window.addEventListener('resize', resizeListener);

            // stepping
            function step(currentTime: number) {
                const elapsed = currentTime - startTime;
                let t = Math.min(elapsed / duration, 1);
                if (stopStepping) t = 1;
                const easedProgress = animation(t);
                element.scrollTop = start + distance * easedProgress;
            
                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    window.removeEventListener('resize', resizeListener);
                    resolve(true);
                }
            }
            requestAnimationFrame(step);
        })
    }


    // Startup animation stuff
    const groupDivs = document.querySelectorAll('.group') as NodeListOf<HTMLElement>;
    groupDivs.forEach(groupDiv => { groupDiv.style.display = 'none'; })
    setTimeout(() => {
        const animationAdd = .5;
        for (let i = 0; i < groupDivs.length; i++) {
            const groupDiv = groupDivs[i];
            if (!mobileMode) {
                setTimeout(() => {
                    groupDiv.style.display = '';
                    groupDiv.style.animation = `.5s pop-up cubic-bezier(0, 0, 0.15, 1)`;
                }, (animationAdd * 250) * i);
            } else {
                groupDiv.style.display = '';
            }
            

            // to be figured out xdd
            // const groupChildren = [...groupDiv.children];
            // groupChildren.forEach(itemDiv => {
            //     itemDiv.getBoundingClientRect().x
            // });
        }
    }, 500);


    // Add redirects to all [data-add-redirect]
    (document.querySelectorAll('[data-add-redirect]') as NodeListOf<HTMLAreaElement>).forEach(elmnt => {
        elmnt.href = `/redirect?=${elmnt.href}`;
    });


    // Tile click (action & animation)
    (document.querySelectorAll('#start-container .item') as NodeListOf<HTMLElement>).forEach(elmnt => {
        if (elmnt.nodeName == "DIV") elmnt.addEventListener('click', () => currentAppx = new Appx(elmnt));
    });



    // Check is a appx is in the search args
    const searchParams = new URLSearchParams(location.search);
    if (
        searchParams
        && searchParams.size >= 1
        && searchParams.get('appx')
    ) {
        // Find the appx on the home page & click it
        setTimeout(() => {
            const appxData = searchParams.get('appx');
            const appxDiv = document.querySelector(`.groups .item[data-item-id="${appxData}"]`) as HTMLElement;
            if (appxDiv) appxDiv.click();
        }, 1500);
    } else
    // Else, deny mouse actions for a second or just not depending on viewing mode
    firstTileAnim();



    // Date difference into text
    function calcDateDiffToTxt(date = new Date) {
        let txt;
        let diffMs = date.getTime() - currentDate.getTime();
        let diffSeconds = diffMs / 1000;
        let diffMinutes = diffSeconds / 60;
        let diffHours = diffMinutes / 60;
        let diffDays = diffHours / 24;

        switch (true) {
            case diffDays >= 1:
                // let calcHours = diffHours.toFixed(0) - (diffDays.toFixed(0) * 24);
                txt = `${diffDays.toFixed(0)} day${diffDays == 1 ? "" : "s"}`;
            break;

            case diffHours >= 1:
                // let calcMins = diffMinutes.toFixed(0) - (diffHours.toFixed(0) * 60);
                txt = `${diffHours.toFixed(0)} hour${diffHours == 1 ? "" : "s"}`;
            break;

            case diffMinutes >= 1:
                txt = `${diffMinutes.toFixed(0)} minute${diffMinutes == 1 ? "" : "s"}`;
            break;

            case diffSeconds >= 1:
                txt = `${diffSeconds.toFixed(0)} second${diffSeconds == 1 ? "" : "s"}`;
            break;
        }

        return txt;
    }




    // Fetches to services I'm gaming on lol
    if (!window.slowMf) {
        // Init YouTube tile
        type YTTileData = { type: string, title: string, thumbnails: string[], published?: string, views?: string, premiereTime?: number };
        function initYTTile(data: YTTileData) {
            let tileTitle = "Latest Video";
            let desc2Txt = '';
            switch (data.type) {
                case 'premiere':
                    if (!data.premiereTime) return console.error('"data.premiereTime" is not defined for "premiere" type');
                    tileTitle = "Next Video";
                    desc2Txt = `Premieres in ${calcDateDiffToTxt(new Date(data.premiereTime))}`;
                break;
            
                default:
                    desc2Txt = `${data.published}${typeof data.views == "string" ? ` - ${data.views}` : ""}`;
                break;
            }

            ytDataDiv.innerHTML += `
                <div class="item-tile" data-scroll-delay="5" data-item-style="text">
                    <div class="item-data" style="padding-top: 10px">
                        <h2>${tileTitle}</h2>
                        <p class="desc1 one-line-text">${data.title}</p>
                        <p class="desc2">${desc2Txt}</p>
                    </div>
                    <div class="item-image"><img src="${data.thumbnails[0]}" style="height: 140%;"></div>
                </div>
            `;
        }

        // Get YouTube Information
        const ytDataDiv = document.querySelector('[data-item-id="youtube"] .item-tile-container') as HTMLElement;
        fetch("https://api.ktg5.online/latestYt", {
            "body": null,
            "method": "POST"
        }).then(async rawData => {
            const data = await rawData.json();
            
            if (data.constructor == [].constructor) {
                ytDataDiv.setAttribute("data-scroll-atend", "copyfirst");
                data.forEach((subData: YTTileData) => { initYTTile(subData) });
            }
            else initYTTile(data);

            ytDataDiv.style.display = '';
        });


        // Get Twitch Information
        const twitchStreams = ['ktg5_', 'noclue_x86', 'ktg5_special'];
        const mainStream = twitchStreams[0];
        for (const i in twitchStreams) {
            const key = twitchStreams[i];
            const twitchData = await twitchgql.getChannel(key);

            // Set to twitch live tile
            const twitchTile = document.querySelector('[data-item-id="twitch"]') as HTMLAreaElement;
            if (twitchTile)
            if (twitchData.live) {
                twitchTile.href = `/redirect?=${twitchData.profileURL}`;
                (twitchTile.querySelector('.item-data h2') as HTMLElement).innerHTML = `${twitchData.displayName} is live!`;
                (twitchTile.querySelector('.item-data .desc1') as HTMLElement).innerHTML = `${twitchData.broadcastSettings.title}`;
                (twitchTile.querySelector('.item-data .desc2') as HTMLElement).innerHTML = `${twitchData.stream.viewersCount} viewers`;
                (twitchTile.querySelector('.item-image img') as HTMLImageElement).src = twitchData.profileImageURL;
            } else if (key == mainStream) {
                twitchTile.href = `/redirect?=${twitchData.profileURL}`;
                (twitchTile.querySelector('.item-data .desc1') as HTMLElement).innerHTML = ``;
                (twitchTile.querySelector('.item-data .desc2') as HTMLElement).innerHTML = ``;
                (twitchTile.querySelector('.item-image img') as HTMLImageElement).src = twitchData.profileImageURL;

                if (twitchData.schedule) {
                    const nextStreamDate = new Date(twitchData.schedule.nextSegment.startAt);
                    const nextStreamTxt = calcDateDiffToTxt(nextStreamDate);

                    (twitchTile.querySelector('.item-data .desc1') as HTMLElement).innerHTML = `Next stream in ${nextStreamTxt}`;
                }
            }
        }

        // Get friend's Twitch info
        type FriendData = {
            greetId: string;
            twitch?: getChannelData; // optional for now
        };
        const friendsData: Record<string, FriendData> = {
            shobuh: { greetId: "shobe" },
            skppy_: { greetId: "skppy" },
            malatyp3: { greetId: "mala" },
            anormalladd: { greetId: "ladd" },
        };
        for (const key in friendsData) {
            const k = key as keyof typeof friendsData; // assert the key is valid
            const twitch = await twitchgql.getChannel(k);
            friendsData[k] = { ...friendsData[k], twitch };
            let friendData = friendsData[key];

            // Set to twitch live tile
            const friendTile = document.querySelector(`[data-item-id="greet.${friendData.greetId}"]`) as HTMLAreaElement;
            if (twitch.live) {
                friendTile.href = `/redirect?=${twitch.profileURL}`;
                const newTile = document.createElement('div');
                newTile.classList.add(`item-tile`);
                newTile.setAttribute('data-scroll-delay', '5');
                newTile.setAttribute('data-item-style', 'text');
                newTile.innerHTML = `
                    <div class="item-data" style="padding-top: 10px">
                        <h3>They Live!</h3>
                        <p class="desc1 one-line-text">${twitch.broadcastSettings.title}</p>
                        <p class="desc2" one-line-text>${twitch.stream.viewersCount} viewers</p>
                    </div>
                    <div class="item-image"><img src="${twitch.profileImageURL}" style="height: 140%;"></div>
                `;
                (friendTile.querySelector('.item-tile-container') as HTMLElement).insertBefore(newTile, friendTile.querySelectorAll('.item-tile')[1]);
            }
        }


        // Get Twitter info
        const twitterTile = document.querySelector('[data-item-id="twitter"]') as HTMLAreaElement;
        await fetch("https://api.ktg5.online/latestTwit", {
            method: "POST"
        }).then(async (d) => {
            const json = await d.json();

            const newTile = document.createElement('div');
            newTile.classList.add(`item-tile`);
            newTile.setAttribute('data-scroll-delay', '5');
            newTile.setAttribute('data-item-style', 'text');
            newTile.innerHTML = `
                <div class="item-data" style="padding-top: 10px">
                    <h3>Latest Tweet</h3>
                    <p class="desc1 one-line-text">${json.user.name} (${json.user.username})</p>
                    ${json.text ? `<p class="desc2 one-line-text">${json.text}</p>` : ''}
                    <p class="desc3 one-line-text">
                        <span style="margin-right: 8px">💬 ${json.stats.replies}</span>
                        <span style="margin-right: 8px">🔄 ${json.stats.retweets}</span> 
                        <span>🩵 ${json.stats.likes}</span>
                    </p>
                </div>
                <div class="item-bg" style="background-image: #94e4e8;"></div>
            `;
            (twitterTile.querySelector('.item-tile-container') as HTMLElement).insertBefore(newTile, twitterTile.querySelectorAll('.item-tile')[1]);
        });


        // Continue to build tiles
        buildTiles();
    } else {
        (document.querySelector('[data-item-id="twitch"] [data-item-style="text"]') as HTMLElement).remove();
        buildTiles();
    }


    // Check each tile container to see if it contains more than one tile,
    // then it's a live tile & we'll make it do the funny scroll.
    function buildTiles() {
        setTimeout(async () => {
            let liveTilesCount = 0;
            for (let i = 0; i < itemContents.length; i++) {
                const itemContent = itemContents[i];

                let itemTiles = refreshTilesList();
                function refreshTilesList() {
                    return itemContent.querySelectorAll('.item-tile') as NodeListOf<HTMLElement>;
                }

                const countedItemContent = itemTiles.length;
                if (countedItemContent > 1) {
                    // Is a live tile
                    itemContent.scrollTop = 0;

                    // We do everything in here
                    async function scrollTiles() {
                        const scrollTime = 1500;
                        let scrollCalc = itemContent.scrollTop + itemContent.clientHeight;
                        if (scrollCalc < 10) return;
                        // Check to see if we've hit the limit of the live tile
                        if (itemContent.scrollTop == (itemContent.scrollHeight - itemContent.clientHeight)) {
                            // Check if there's a custom action we want to do at the end
                            const atEndValue = itemContent.getAttribute('data-scroll-atend');
                            if (atEndValue) { switch (atEndValue) {
                                case 'copyfirst':
                                    // Copy the first tile & put it at the end of the itemContent
                                    const firstTile = itemContent.querySelectorAll('.item-tile')[0];
                                    const firstTileCopy = firstTile.cloneNode() as HTMLElement;
                                    firstTileCopy.innerHTML = firstTile.innerHTML;
                                    itemContent.appendChild(firstTileCopy);
                                    refreshTilesList();
                                    setTimeout(() => {
                                        itemContent.scrollTop = 0;
                                        firstTileCopy.remove();
                                        refreshTilesList();
                                    }, scrollTime + 50);
                                break;
                            // Else just make it go back to the top
                            } } else scrollCalc = 0;
                        }

                        // Get tile that'll be scrolled into
                        let scrolledTile;
                        for (const child of itemTiles) {
                            const childDiv = child as HTMLElement;
                            if (childDiv.offsetTop <= scrollCalc) scrolledTile = childDiv;
                        };
                        // Do stuff lel
                        if (scrolledTile) updateTile(scrolledTile);

                        const animationSuccess = await scrollTileAnimation(itemContent, scrollCalc, scrollTime);
                        if (!animationSuccess) {
                            // Get data from the first tile & apply
                            updateTile(itemTiles[0]);
                        }
                    }

                    setTimeout(() => {
                        // Initial scroll
                        if (itemContent.parentElement) if (!itemContent.parentElement.getAttribute('data-item-id')?.includes('greet.')) scrollTiles();

                        // Check if we need to scroll soon
                        let currentCount = 0;
                        setInterval(() => {
                            if (stopLiveTiles) return;

                            // Get currently shown tile
                            let currentTile;
                            for (const tile of itemTiles) { if (tile.offsetTop === itemContent.scrollTop) currentTile = tile; } 
                            if (!currentTile) return;
                            
                            // Get scroll-delay & then do check for scrollingignign
                            // IGN??????????????????????????? real
                            let tileDelay = Number(currentTile.getAttribute('data-scroll-delay'));
                            if (tileDelay == null) currentTile.setAttribute('data-scroll-delay', '5');
                            // console.log(currentTile.parentElement.parentElement.getAttribute('data-item-id'), tileDelay, currentCount);
                            if (currentCount >= tileDelay) {
                                scrollTiles();
                                currentCount = 0;
                            } else currentCount++;
                        }, 1000);
                    }, 1950 + (liveTilesCount * 350));

                    liveTilesCount++;
                }
            }
        }, 50);
    }

});


export default {
    denyMouse, mobileMode, saveToHints, bigTileSize,
    getHintsData: () => {
        return hintsData;
    },
    setLiveTiles,
    toggleHint,
    toggleMobileButtons,
    makeScrollbar,
    clearTileScroll
};
