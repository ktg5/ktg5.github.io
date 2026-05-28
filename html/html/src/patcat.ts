import { Howl } from "howler";

import kai0 from "../../img/cat/kai-0.png";
import kai1 from "../../img/cat/kai-1.png";
import kaiprr from "../../sounds/patcat/kai-prr.ogg";


const container = document.querySelector('.appx-container') as HTMLElement;
const cat = container.querySelector('.cat') as HTMLImageElement;
const scoreCount = container.querySelector('.score .count') as HTMLElement;
const comboCount = container.querySelector('.combo .count') as HTMLElement;

type Cats = 'kai' | 'peanut';
let currentCat = 'kai' as Cats;

// const catHitBoxes = {
//     kai: {},
//     peanut: {}
// };

const moveTimeoutMs = 300;
let score = 0;
let combo = 0;


let stopPrrTimeout: number;
let prrVolumeInt: number;

// change image depending on mouse enter & leave
['mouseenter', 'touchstart'].forEach((ename) => {
    cat.addEventListener(ename, () => {
        cat.src = kai1;
    });
});
['mouseleave', 'touchend'].forEach((ename) => {
    cat.addEventListener(ename, () => {
        cat.src = kai0;
        combo = 0;
        comboCount.textContent = '0';

        stopPrrTimeout = setTimeout(() => {
            let firstChange = false;
            prrVolumeInt = setInterval(() => {
                if (catPrrs[currentCat].volume() <= 0) {
                    clearInterval(prrVolumeInt);
                    catPrrs[currentCat].stop();
                    catPrrs[currentCat].pause();
                    return;
                }
                else catPrrs[currentCat].volume(Math.round((catPrrs[currentCat].volume() - .1) * 10) / 10);
            }, 100);
        }, 1000);
    });
});


// sound stuff
const catPrrs: Record<Cats, Howl> = {
    kai: new Howl({
        src: kaiprr,
        autoplay: false,
        loop: true
    }),
    peanut: new Howl({
        src: kaiprr,
        autoplay: false,
        loop: true
    })
};


// actual game stuff
let moveTimeout: Date = new Date(0);
['mousemove', 'touchmove'].forEach((ename) => {
    cat.addEventListener(ename, () => {
        // make sure we ain't spammin
        const currentTime = new Date();
        if (currentTime.getTime() >= (moveTimeout.getTime() + moveTimeoutMs)) moveTimeout = currentTime;
        else return;

        clearTimeout(stopPrrTimeout);
        clearInterval(prrVolumeInt);


        // sound
        switch (currentCat) {
            case 'kai':
                catPrrs.kai.volume(1);
                if (catPrrs.kai.playing() !== true) catPrrs.kai.play();
            break;

            case 'peanut':

            break;
        }


        // score counting
        score++;
        scoreCount.textContent = `${score}`;
        // combo counting
        combo++;
        comboCount.textContent = `${combo}`;
    });
});
