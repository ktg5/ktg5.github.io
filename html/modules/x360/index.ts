import { Howl } from "howler";
const defSound = new URL("./sound/default.wav", import.meta.url).href;


// make if document was clicked for autoplay sound to work
let userGestured = false;
const markGesture = () => userGestured = true;
document.addEventListener("click", markGesture, { once: true });


type x360AlertText = {
    text: string;
}

type x360PlayerData = {
    p1?: boolean;
    p2?: boolean;
    p3?: boolean;
    p4?: boolean;
}

type x360AlertData = {
    texts: x360AlertText[];
    imgs: string[];
    sound?: string;
    players?: x360PlayerData;
    testing?: boolean;
}


let transMs: number;
let animationMs: number;

const killMs = 6000;
const txtRefreshMs = 5000;
const iconRefreshMs = 1000;


let alertQueue: x360Alert[] = [];

export class x360Alert {
    private alertDiv = (document.createElement('div') as HTMLElement);
    private txtChangeInt: NodeJS.Timeout | undefined;
    private autoKill: NodeJS.Timeout | undefined;
    public data: x360AlertData;
    public container: HTMLElement;


    constructor(data: x360AlertData) {
        this.data = data;


        const container = document.querySelector('#x360-pop-container') as HTMLElement;
        if (!container) {
            const txt = 'x360Alert: no container found!';
            alert(txt);
            throw new Error(txt);
        };
        this.container = container;


        // div settings
        this.alertDiv.id = 'x360-pop';

        // player pie default
        if (!data.players) data.players = { p1: true };

        // texts
        let txtDivs = '';
        data.texts.forEach((txt, i) => {
            txtDivs += `<span class="txt" data-txt-slot="${i}">${txt.text}</span>\n`;
        });

        // build html
        this.alertDiv.innerHTML = `
<div class="icon" animation>
    <div class="player-pie">
        <div class="p-1" ${data.players?.p1 ? 'active' : ''}></div>
        <div class="p-2" ${data.players?.p2 ? 'active' : ''}></div>
        <div class="p-3" ${data.players?.p3 ? 'active' : ''}></div>
        <div class="p-4" ${data.players?.p4 ? 'active' : ''}></div>
    </div>
    <div class="over-pie">
        <div class="circle"></div>
    </div>
    <div class="icon-img">
        <img src="${data.imgs[0]}" active>
        <div class="fade"></div>
    </div>
</div>
<div class="txts">${txtDivs}</div>
        `;

        // pre-load imgs
        let preLoadedImgs: { img: string; el: HTMLImageElement; loaded: boolean; }[] = [];
        data.imgs.forEach(img => {
            if (img === '') return;

            preLoadedImgs.push({ img, el: document.createElement('img'), loaded: false });
            const imgEl = document.createElement('img');
            imgEl.src = img;

            imgEl.addEventListener('load', () => {
                // set data
                const preLoadedData = preLoadedImgs.find(preImg => preImg.img === img);
                if (!preLoadedData) return;
                preLoadedData.loaded = true;

                // insert to popup
            });
        });

        
        // check stuff before appending
        const checksInt = setInterval(() => {
            const imgsLoaded = preLoadedImgs.every(preImg => preImg.loaded);
            if (!imgsLoaded) return;

            const activeAlert = document.querySelector('#x360-pop') as HTMLElement;

            if (
                userGestured
                && !activeAlert
            ) {
                clearInterval(checksInt);
                this.append();
            }
        }, 100);
    }

    public getDiv() {
        return this.alertDiv;
    }

    public append() {
        // append
        this.container.appendChild(this.alertDiv);

        // initial txt change
        this.changeTxt(0);
        this.setCurrentTxtWidth();


        // play sfx
        new Howl({
            src: this.data.sound ? this.data.sound : defSound,
            volume: 0.5,
            autoplay: true
        });


        // change txt if there's multiple
        this.txtChangeInt = setInterval(() => {
            if (this.data.texts.length <= 1) return;

            let nextIndex = this.getCurrentTxtIndex() + 1;
            if (nextIndex > this.data.texts.length) nextIndex = 0;
            this.changeTxt(nextIndex);
        }, txtRefreshMs);


        // auto kill
        let autoKillMs = killMs;
        if (this.data.texts.length > 1) autoKillMs = txtRefreshMs * this.data.texts.length;
        this.autoKill = setTimeout(() => this.kill(), autoKillMs);
    }

    public kill() {
        clearInterval(this.txtChangeInt);
        this.alertDiv.setAttribute('data-kill', '');
        this.changeTxt(-1);

        const iconDiv = this.alertDiv.querySelector('.icon') as HTMLElement;
        if (iconDiv) {
            iconDiv.removeAttribute('animation');
            setTimeout(() => iconDiv.setAttribute('animation', ''), 15);
        }

        // let animation play, then remove
        if (this.data?.testing !== true) setTimeout(() => this.alertDiv.remove(), animationMs);
    }


    private changeTxt(txtIndex: number) {
        const prevIndex = this.getCurrentTxtIndex();
        const prevDiv = this.alertDiv.querySelector(`.txt[data-txt-slot="${prevIndex}"]`) as HTMLElement;
        if (prevDiv) prevDiv.style.opacity = '0';

        this.alertDiv.querySelector('.txts')?.setAttribute('data-txt-active', txtIndex.toString());
        this.setCurrentTxtWidth();

        setTimeout(() => {
            const txtActiveDiv = this.alertDiv.querySelector(`.txt[data-txt-slot="${txtIndex}"]`) as HTMLElement;
            if (txtActiveDiv) txtActiveDiv.style.opacity = '1';
        }, animationMs);
    }

    private getCurrentTxtIndex() {
        return Number(this.alertDiv.querySelector('.txts')?.getAttribute('data-txt-active'));
    }

    private setCurrentTxtWidth() {
        const txtActiveIndex = this.alertDiv.querySelector('.txts')?.getAttribute('data-txt-active');
        const txtActiveDiv = this.alertDiv.querySelector(`.txt[data-txt-slot="${txtActiveIndex}"]`) as HTMLElement;
        if (!txtActiveDiv) return this.alertDiv.style.setProperty('--txt-width', '0px');

        const txtWidth = txtActiveDiv.offsetWidth;
        this.alertDiv.style.setProperty('--txt-width', `${txtWidth}px`);
    }
}


window.addEventListener('load', () => {
    // get ms animations from root
    const root = document.querySelector(':root') as HTMLElement;
    transMs = Number(getComputedStyle(root).getPropertyValue('--x360-trans-ms').replace('ms', ''));
    animationMs = Number(getComputedStyle(root).getPropertyValue('--x360-animation-ms').replace('ms', ''));


    // test
    // new x360Alert({
    //     texts: [
    //         { text: 'Achievement unlocked<br>20G - Welcome to ktg5.online' },
    //         { text: 'Create a ktg5.online account to earn points from apps' },
    //     ],
    //     imgs: ['/img/special1.png'],
    //     // testing: true
    // });

    // new x360Alert({
    //     texts: [
    //         { text: 'second alert test' },
    //     ],
    //     imgs: ['/img/special1.png'],
    //     // testing: true
    // });
});
