import { Howl } from "howler";


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
}


const txtRefreshTime = 5000;
class x360Alert {
    private alertDiv = (document.createElement('div') as HTMLElement);

    constructor(data: x360AlertData) {
        const container = document.querySelector('#x360-pop-container') as HTMLElement;
        if (!container) {
            const txt = 'x360Alert: no container found!';
            alert(txt);
            throw new Error(txt);
        };


        this.alertDiv.id = 'x360-pop';

        let txtDivs = '';
        data.texts.forEach((txt, i) => {
            txtDivs += `<span class="txt" data-txt-slot="${i}">${txt.text}</span>\n`;
        });

        if (!data.players) data.players = { p1: true };

        this.alertDiv.innerHTML = `
<div class="icon">
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
<div class="txts" data-txt-active="0">${txtDivs}</div>
        `;

        container.appendChild(this.alertDiv);

        this.setCurrentTxtWidth();
        setInterval(() => {
            let nextIndex = this.getCurrentTxtIndex() + 1;
            if (nextIndex >= data.texts.length) nextIndex = 0;
            this.changeTxt(nextIndex);
        }, txtRefreshTime);

        if (data.sound) new Howl({
            src: data.sound,
            autoplay: true
        });
    }

    public getDiv() {
        return this.alertDiv;
    }


    private changeTxt(txtIndex: number) {
        this.alertDiv.querySelector('[data-txt-active]')?.setAttribute('data-txt-active', txtIndex.toString());
        this.setCurrentTxtWidth();
    }

    private getCurrentTxtIndex() {
        return Number(this.alertDiv.querySelector('[data-txt-active]')?.getAttribute('data-txt-active'));
    }

    private setCurrentTxtWidth() {
        const txtActiveIndex = this.alertDiv.querySelector('[data-txt-active]')?.getAttribute('data-txt-active');
        console.log(txtActiveIndex);
        const txtActiveDiv = this.alertDiv.querySelector(`.txt[data-txt-slot="${txtActiveIndex}"]`) as HTMLElement;
        console.log(txtActiveDiv);
        const txtWidth = txtActiveDiv.offsetWidth;
        this.alertDiv.style.setProperty('--txt-width', `${txtWidth}px`);
    }
}


// test
window.addEventListener('load', () => {
    // new x360Alert({
    //     texts: [
    //         { text: 'Achievement unlocked<br>20G - Welcome to ktg5.online' },
    //         { text: 'Create a ktg5.online account to earn points from apps' },
    //     ],
    //     imgs: ['/img/special1.png'],
    // });
});
