var bigTileSize, currentAppx, mobileButtons, hintsData,
stopLiveTiles = false, mobileMode = false,
hintsStore = 'ktg5-hints';
// var scrollbars = {};
const currentDate = new Date();


function vh(percent) {
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return (percent * h) / 100;
  }
  
function vw(percent) {
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    return (percent * w) / 100;
}


function makeScrollbar(wrapper) {
    if (!wrapper) {
        txt = 'makeScrollbar: bruv, you need a wrapper to pass thru!';
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
        txt = 'makeScrollbar: this wrapper must contain a div to contain your content & ONLY that!!!';
        console.error(txt);
        return alert(txt);
    }
    if (!wrapper.getAttribute('data-scrollbutton-amount')) {
        txt = 'makeScrollbar: the attribute "data-scrollbutton-amount" is not set on the wrapper!';
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
    wrapper.parentNode.insertBefore(scrollbar, wrapper);

    // Calcuate fakebar bar width & max scroll. Hate doing this shit
    let maxScroll = wrapper.children[0].scrollWidth - window.innerWidth;
    const scrollbarBar = scrollbar.querySelector(`.scroll-fakebar__bar__scrubber`);
    let scrollbarBarWidth;


    // Set scrollbar size
    function setScrollbarSize() {
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
        const amount = ((e.deltaY < 0) ? (scrollAmount * -1) : scrollAmount);
        const scrollL = wrapper.scrollLeft;

        let eq = ((scrollL % scrollAmount === 0) ? (scrollL + amount) : (lastScroll + amount));
        if (eq > maxScroll) eq = maxScroll;

        lastScroll = eq;
        wrapper.scrollLeft = eq;
        e.preventDefault();
    });


    // On scroll
    const scrollFunc = (e) => {
        if (mobileMode) return;
        let eq = ((lastScroll) / (maxScroll + scrollbarBarWidth) * 100);
        if (eq < 0) eq = 0;
        if (lastScroll > maxScroll) eq = ((maxScroll) / (maxScroll + scrollbarBarWidth) * 100);

        scrollbarBar.style.left = `${eq}%`
    }
    wrapper.addEventListener('scroll', scrollFunc);


    // On wrapper resize
    window.addEventListener('resize', e => {
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
                elmnt.addEventListener('click', e => {
                    if (mobileMode) return;
                    let eq = wrapper.scrollLeft - scrollButtonGap;
                    if (eq < 0) eq = 0;
                    lastScroll = eq;
                    wrapper.scrollLeft = eq;
                });
            break;
        
            case 'right':
                elmnt.addEventListener('click', e => {
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
    scrollbarBar.addEventListener('mousedown', e => {
        if (mobileMode) return;
        followScroll = true;
    });
    document.addEventListener('mouseup', e => {
        if (mobileMode) return;
        scrollbarBar.style.transition = '';
        followScroll = false;
    });
    document.addEventListener('mousemove', e => {
        if (mobileMode) return;
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
function denyMouse(state) {
    const denyDiv = document.querySelector('#deny-mouse');

    switch (state) {
        case true:
            denyDiv.style.display = 'block';
        break;
    
        case false:
            denyDiv.style.display = 'none';
        break;
    }
}


// toggle mobile buttons
function toggleMobileButtons(force) {
    mobileButtons.toggleAttribute('data-hide', force ? !force : undefined);
    if (
        mobileButtons.getAttribute('data-hide') == ""
        || mobileButtons.getAttribute('data-hide') == null
    ) {
        if (
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
function saveToStorage(item, data) {
    if (!item || typeof item !== "string") return console.error('"item" is not a string');
    if (!data || typeof data !== 'object') return console.error('"data" is not a object');
    return localStorage.setItem(item, JSON.stringify(data));
}


// Toggle specific hint
function toggleHint(name) {
    const targetHint = document.querySelector(`[data-notif="${name}"]`);
    if (targetHint) targetHint.toggleAttribute('data-hide');
}

// Save to hints local storage
saveToHints = () => { saveToStorage(hintsStore, hintsData); };


// Global tile functions
// Clear tile scroll
function clearTileScroll() {
    // Make live tiles go to the start
    document.querySelectorAll('.item-tile-container').forEach(itemContent => {
        const tiles = itemContent.querySelectorAll('.item-tile');
        if (tiles.length > 1) {
            itemContent.scrollTop = 0;
            updateTile(itemContent.querySelector('.item-tile'));
        }
    });
}

// Update tile data. This is used mostly when a live tile switches
// to a new tile & checks for specific data attributes to change
// stuff on the tile.
function updateTile(tile) {
    const elmntTitle = tile.parentElement.querySelector('.item-title');
    if (tile) {
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
class loadingDiv {
    elmnt = null;
    insertDiv = null;
    size = 0;
    interval = null;
    currentCode = fontCodes.start;
    loopedEnd = 0;

    constructor(insertDiv, size) {
        if (!insertDiv instanceof HTMLElement) return console.error('loadingDiv: "containerDiv" is not a HTMLElement');
        
        this.insertDiv = insertDiv;
        let possibleLoading = insertDiv.querySelector('.loading-gif');
        if (possibleLoading) {
            // Get information from current loading gif in insertDiv
            this.elmnt = possibleLoading;
            this.size = Number(this.elmnt.style.getPropertyValue('--this-size').replace('px', ''));
        } else {
            if (!size) return console.error('loadingDiv: "size" is not a number');
            if (!typeof size === 'number') return console.error('loadingDiv: "size" is not a number');
            this.size = size;

            // Create loading elmnt
            this.elmnt = document.createElement('div');
            this.elmnt.classList.add('loading-gif');
            this.elmnt.style.setProperty('--this-size', `${this.size}px`);
            this.elmnt.innerHTML = this.currentCode;
            this.insertDiv.appendChild(this.elmnt);

            // Make interval
            this.interval = setInterval(() => {
                if (this.currentCode > fontCodes.end) if (this.loopedEnd >= 5) this.currentCode = fontCodes.start
                else this.loopedEnd++;
                else {
                    this.loopedEnd = 0;
                    this.elmnt.innerHTML = String.fromCharCode(this.currentCode);
                    this.currentCode++;
                }
            }, 30);
        }
    }

    async kill() {
        clearInterval(this.interval);
        this.elmnt.remove();
    }
}


// LOADINGINGIGNIGNIG
window.addEventListener('load', async () => {

    // Birthday stuff
    if (currentDate.getMonth() === 6 && currentDate.getDate() === 12) {
        document.querySelector('[data-item-id="ktg5"] .item-logo img').src = '/img/logo-w1-birthday.png';
    }


    // Load time related things
    clearInterval(loadInt);
    console.log('LOAD TIME:', loadTime);
    if (loadTime >= slowMfTime) slowMf = true;

    // Show start
    document.querySelector('#start-container').style.display = '';
    // Hints
    document.querySelector('#help-notifs').style.opacity = '';

    // Check for mouse movingly
    window.addEventListener('mousemove', (e) => {
        window.mousePos = { x: e.clientX, y: e.clientY };
    });


    // Vars used
    const itemContents = document.querySelectorAll('.item-tile-container');
    bigTileSize = Number(getComputedStyle(document.querySelector(':root')).getPropertyValue('--big-tile').replace('px', ''));


    // On resize
    // Resize groups to fit the tiles inside
    let clearedAdjusted = false;
    function adjustGroupWidths() {
        if (mobileMode) return;
        clearedAdjusted = false;

        document.querySelectorAll('.group').forEach(group => {
            const groupHeight = group.clientHeight;
            const items = Array.from(group.querySelectorAll('.item'));
            const itemHeight = items[0]?.offsetHeight || 0;
            const gap = parseInt(getComputedStyle(group).gap || '0');
    
            const totalHeightPerItem = itemHeight + gap;
            const itemsPerColumn = Math.floor(groupHeight / totalHeightPerItem) || 1;
            const numColumns = Math.ceil(items.length / itemsPerColumn);
    
            const itemWidth = items[0]?.offsetWidth || 0;
            group.style.width = `${((itemWidth + gap) * numColumns - gap) / 2}px`;
        });
    }
    let adjustGroupsInt = setInterval(adjustGroupWidths, 10);
    // Run on load and resize
    setTimeout(() => {
        clearInterval(adjustGroupsInt);
    }, 2000);

    // Mobile Check
    let pastCalc, pastMode;
    function mobileCheck() {
        // const calc = (window.innerWidth * 1.325) < (window.innerHeight);
        const calc = window.innerWidth < window.innerHeight;
        if (calc) {
            // Mobile mode
            document.body.setAttribute('data-mobile', true);
            mobileMode = true;
            clearTileScroll();

            if (clearedAdjusted == false) {
                document.querySelectorAll('.group').forEach(group => { group.style.width = ''; });
                clearedAdjusted = true;
            }
        } else {
            document.body.removeAttribute('data-mobile');
            mobileMode = false;
        }

        if (calc != pastCalc) clearTileScroll();
        pastCalc = calc;

        if (pastMode != mobileMode) {
            if (pastMode) firstTileAnim();
            pastMode = mobileMode;
        }
    }
    window.addEventListener('resize', e => {
        // Mobile check & shit
        mobileCheck();
        // Group tile reiszes
        if (!mobileMode) adjustGroupWidths();
    });
    mobileCheck();


    // Mobile touch events
    mobileButtons = document.querySelector('#mobile-buttons');
    let startY;
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
    window.addEventListener('touchend', (e) => {
        // Mobile buttons
        startY = null;
    });


    // Set hint actions & hints var
    // First init
    hintsData = JSON.parse(localStorage.getItem(hintsStore));
    if (!hintsData) {
        hintsData = {};
        saveToHints();
    }
    // Actions & more init
    const allHints = document.querySelectorAll('#help-notif');
    allHints.forEach(hintDiv => {
        const hintName = hintDiv.getAttribute('data-notif');

        // If the hint is not in the hintsData
        if (!hintsData[hintName]) { 
            hintsData[hintName] = false;
            saveToHints();
        }

        // Make action buttons worky
        const hintActions = hintDiv.querySelectorAll('.actions button');
        hintActions.forEach(hintAction => {
            const hintEvent = hintAction.getAttribute('data-hint-action');
            const hintToggle = hintDiv.querySelector(`label[data-hint-tied="${hintAction.getAttribute('data-hint-tied')}"]`);
            
            // Click action
            hintAction.addEventListener('click', e => {
                switch (hintEvent) {
                    case 'close-hint':
                        toggleHint(hintName);
                    break;
                }

                // Save hint data
                function saveToTarget() {
                    hintsData[hintName] = !hintsData[hintName];
                    saveToHints();
                }

                // If there's a checkbox with the button
                if (hintToggle) {
                    const hintCheckBox = hintToggle.querySelector('input');
                    if (hintCheckBox && hintCheckBox.getAttribute('type') == "checkbox" && hintCheckBox.checked) saveToTarget();
                }
            });
        });
        // Make sure checkboxes are set to unchecked
        const hintCheckBoxes = hintDiv.querySelectorAll('.actions label input[type="checkbox"]');
        hintCheckBoxes.forEach(hintCheckBox => { hintCheckBox.checked = false; });
    });


    // Will return false if the animation was cancelled
    // True if everything went wonderful
    function scrollTileAnimation(element, target, duration) {
        return new Promise((resolve, reject) => {
            const start = element.scrollTop;
            const distance = target - start;
            const startTime = performance.now();
        
            // ease animation
            function animation(t) {
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
            function step(currentTime) {
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
    const groupDivs = document.querySelectorAll('.group');
    groupDivs.forEach(groupDiv => { groupDiv.style.display = 'none'; })
    setTimeout(() => {
        let highestItemX = 0;
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


    // Deny mouse actions for a second or just don't depending on viewing mode
    function firstTileAnim() {
        denyMouse(true);
        setTimeout(() => {
            denyMouse(false);
        }, 2500);
    }
    firstTileAnim();


    // Add redirects to all [data-add-redirect]
    document.querySelectorAll('[data-add-redirect]').forEach(elmnt => {
        elmnt.href = `/redirect?=${elmnt.href}`;
    });


    // Tile click (action & animation)
    document.querySelectorAll('#start-container .item').forEach(elmnt => {
        if (elmnt.nodeName == "DIV") elmnt.addEventListener('click', (e) => {
            currentAppx = new Appx(elmnt);
        });
    });



    // Date difference into text
    function calcDateDiffToTxt(date = new Date) {
        let txt;
        let diffMs = date - currentDate;
        let diffSeconds = diffMs / 1000;
        let diffMinutes = diffSeconds / 60;
        let diffHours = diffMinutes / 60;
        let diffDays = diffHours / 24;

        switch (true) {
            case diffDays >= 1:
                let calcHours = diffHours.toFixed(0) - (diffDays.toFixed(0) * 24);
                txt = `${diffDays.toFixed(0)} day${diffDays.toFixed(0) == 1 ? "" : "s"}`;
            break;

            case diffHours >= 1:
                let calcMins = diffMinutes.toFixed(0) - (diffHours.toFixed(0) * 60);
                txt = `${diffHours.toFixed(0)} hour${diffHours.toFixed(0) == 1 ? "" : "s"}`;
            break;

            case diffMinutes >= 1:
                txt = `${diffMinutes.toFixed(0)} minute${diffMinutes.toFixed(0) == 1 ? "" : "s"}`;
            break;

            case diffSeconds >= 1:
                txt = `${diffSeconds.toFixed(0)} second${diffSeconds.toFixed(0) == 1 ? "" : "s"}`;
            break;
        }

        return txt;
    }




    // Fetches to services I'm gaming on lol
    if (!slowMf) {
        // Init YouTube tile
        function initYTTile(data) {
            let tileTitle = "Latest Video";
            let desc2Txt = '';
            switch (data.type) {
                case 'premiere':
                    tileTitle = "Next Video";
                    desc2Txt = `Premieres in ${calcDateDiffToTxt(new Date(data.premiereTime))}`;
                break;
            
                default:
                    desc2Txt = `${data.published} - ${data.views}`;
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
        const ytDataDiv = document.querySelector('[data-item-id="youtube"] .item-tile-container');
        fetch("https://api.ktg5.online/latestYt", {
            "body": null,
            "method": "POST"
        }).then(async rawData => {
            const data = await rawData.json();
            
            if (data.constructor == [].constructor) {
                ytDataDiv.setAttribute("data-scroll-atend", "copyfirst");
                data.forEach(subData => { initYTTile(subData) });
            }
            else initYTTile(data);

            ytDataDiv.style.display = '';
        });

        // Get Twitch Information
        const mainStream = "ktg5_"
        let twitchStreams = {"noclue_x86": {}, "ktg5_special": {}};
        twitchStreams[mainStream] = {};
        for (const key in twitchStreams) {
            twitchStreams[key] = await twitchgql.getChannel(key);
            let twitchData = twitchStreams[key];

            // Set to twitch live tile
            const twitchTile = document.querySelector('[data-item-id="twitch"]');
            if (twitchData.live) {
                twitchTile.href = `/redirect?=${twitchData.profileURL}`;
                twitchTile.querySelector('.item-data h2').innerHTML = `${twitchData.displayName} is live!`;
                twitchTile.querySelector('.item-data .desc1').innerHTML = `${twitchData.broadcastSettings.title}`;
                twitchTile.querySelector('.item-data .desc2').innerHTML = `${twitchData.stream.viewersCount} viewers`;
                twitchTile.querySelector('.item-image img').src = twitchData.profileImageURL;
            } else if (key == mainStream) {
                twitchTile.href = `/redirect?=https://twitch.tv/ktg5_`;
                twitchTile.querySelector('.item-data .desc1').innerHTML = ``;
                twitchTile.querySelector('.item-data .desc2').innerHTML = ``;
                twitchTile.querySelector('.item-image img').src = twitchData.profileImageURL;

                if (twitchData.schedule) {
                    const nextStreamDate = new Date(twitchData.schedule.nextSegment.startAt);
                    const nextStreamTxt = calcDateDiffToTxt(nextStreamDate);

                    twitchTile.querySelector('.item-data .desc1').innerHTML = `Next stream in ${nextStreamTxt}`;
                }
            }
        }

        // Get friend's Twitch info
        let friendsData = {"shobuh": {greetId: "shobe"}, "skppy_": {greetId: "skppy"}, "malatyp3": {greetId: "mala"}, "anormalladd": {greetId: "ladd"}};
        for (const key in friendsData) {
            const twitch = await twitchgql.getChannel(key);
            friendsData[key] = { ...friendsData[key], twitch };
            let friendData = friendsData[key];

            // Set to twitch live tile
            const friendTile = document.querySelector(`[data-item-id="greet.${friendData.greetId}"]`);
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
                friendTile.querySelector('.item-tile-container').insertBefore(newTile, friendTile.querySelectorAll('.item-tile')[1]);
            }
        }
    } else {
        document.querySelector('[data-item-id="twitch"] [data-item-style="text"]').remove();
    }


    // Check each tile container to see if it contains more than one tile,
    // then it's a live tile & we'll make it do the funny scroll.
    setTimeout(() => {
        let liveTilesCount = 0;
        for (let i = 0; i < itemContents.length; i++) {
            const itemContent = itemContents[i];

            let itemTiles = itemContent.querySelectorAll('.item-tile');
            const countedItemContent = itemTiles.length;
            if (countedItemContent > 1) {
                // Is a live tile
                itemContent.scrollTop = 0;
                function refreshTilesList() { itemTiles = itemContent.querySelectorAll('.item-tile'); }

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
                                const firstTileCopy = firstTile.cloneNode();
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
                    for (const child of itemTiles) { if (child.offsetTop <= scrollCalc) scrolledTile = child; };
                    // Do stuff lel
                    updateTile(scrolledTile);

                    const animationSuccess = await scrollTileAnimation(itemContent, scrollCalc, scrollTime);
                    if (!animationSuccess) {
                        // Get data from the first tile & apply
                        updateTile(itemTiles[0]);
                    }
                }

                setTimeout(() => {
                    // Initial scroll
                    if (!itemContent.parentElement.getAttribute('data-item-id').includes('greet.')) scrollTiles();

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

});