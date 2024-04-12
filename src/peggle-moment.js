// Requires
var maxHitToNextCombo = 14;
var maxCombos = 3;
var genExtBallAfterHits = 8;
var maxExtBalls = 3;

// Hits
var mainHit = 1;
var currentHit = 1;
var currentHitForExtBall = 1;
var allHits = 1;
// Extra Ball
var extBallCount = 1;
// Pitch
var defaultPitch = 1.0;
var currentPitch = defaultPitch;

// Actual shit
window.onload = function () {
    document.getElementById('peg').addEventListener('mouseenter', element => {
        if (currentHit == maxHitToNextCombo + 1) {
            if (mainHit !== maxCombos) mainHit++;
            currentHit = 1;
            currentPitch = 1.0;
        }

        var pegHit = new Howl({
            src: `../sounds/peghit${mainHit}.ogg`,
            volume: 0.7
        });
        if (mainHit < 3) {
            pegHit.rate(currentPitch)
            currentPitch = currentPitch + .07;
        }

        var pegHitElm = document.getElementById('peggle-combo').childNodes[0]
        pegHitElm.innerHTML = `${allHits} hits!`
        pegHitElm.style.animation = 'none';
        pegHitElm.offsetHeight;
        pegHitElm.style.animation = null; 

        if (currentHitForExtBall == genExtBallAfterHits && extBallCount !== maxExtBalls + 1) {
            var extraball = new Howl({
                src: `../sounds/extraball${extBallCount}.ogg`,
                volume: 0.7
            });
            
            extraball.play();

            var extBallElm = document.getElementById('peggle-ext-ball').childNodes[0]
            extBallElm.style.animation = 'none';
            extBallElm.offsetHeight;
            extBallElm.style.animation = null; 
            if (extBallCount == 3) document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'final extra ball!!';

            extBallCount++;
            currentHitForExtBall = 1;
        }
        pegHit.play();

        var extBallElm = document.getElementById('peggle-ext-ball').childNodes[0];
        function extraBallSecret() {
            var extraball = new Howl({
                src: `../sounds/extraball3.ogg`,
                volume: 0.7
            });
            extraball.play();
            extBallElm.style.animation = 'none';
            extBallElm.offsetHeight;
            extBallElm.style.animation = null;
        }
        switch (allHits) {
            case 100:
                extraBallSecret();
                extBallElm.style.textTransform = 'none';
                document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'okay what the fuck are you doing';
            break;

            case 150:
                extraBallSecret();
                document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'BRO STOP';
            break;

            case 300:
                extraBallSecret();
                document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'WHY ARE YOU STILL GOING???';
            break;

            case 450:
                extraBallSecret();
                document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'dude go play something else';
            break;

            case 500:
                extraBallSecret();
                document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'i swear if you keep going at this, imma delete this thing';
            break;

            case 750:
                extraBallSecret();
                document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'it\'s coming up close!!!';
            break;

            case 1000:
                extraBallSecret();
                document.getElementById('peg').style.display = 'none';
                document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'nah you\'re done. no more peggle';
            break;

            case 1001:
                extraBallSecret();
                document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'wait what';
            break;

            case 1010:
                extraBallSecret();
                document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'HOW THE FUCK DID YOU DO THAT???';
            break;

            case 1050:
                extraBallSecret();
                document.getElementById('peggle-ext-ball').childNodes[0].innerHTML = 'alright screw you. you win, go on';
            break;
        }

        // End
        currentHit++;
        currentHitForExtBall++;
        allHits++;
    });
}