window.addEventListener('load', async (event) => {
    
    let linkButtons = document.querySelectorAll('#links a');
    let hoverhint = document.querySelector('#hoverhint');

    linkButtons.forEach(button => {
        button.addEventListener('mouseover', (event) => {
            if (button.getAttribute('data-title')) {
                hoverhint.innerHTML = button.getAttribute('data-title');
                let titleColor = button.getAttribute('data-title-color');
                if (titleColor) {
                    if (titleColor === 'rainbow') hoverhint.style.animation = 'rainbow-colour 5s ease infinite';
                    else hoverhint.style.color = titleColor;
                }
                else hoverhint.style.color = 'white';
                hoverhint.style.display = 'block';
            }
        });

        button.addEventListener('mouseout', (event) => {
            hoverhint.innerHTML = '';
            hoverhint.style.color = '';
            hoverhint.style.animation = '';
            hoverhint.style.display = 'none';
        });
    });

    document.addEventListener('mousemove', (event) => moveHoverHint(event));
    document.addEventListener('scroll', (event) => moveHoverHint(event));

    let pastClientPosition = []
    function moveHoverHint(event) {
        let cursorX, cursorY;
        if (event.clientX) {
            cursorX = event.clientX;
            cursorY = event.clientY;
            pastClientPosition = [cursorX, cursorY];
        } else {
            cursorX = pastClientPosition[0];
            cursorY = pastClientPosition[1];
        }

        hoverhint.style.left = `${cursorX + 20 + window.scrollX}px`;
        hoverhint.style.top = `${cursorY - 20 + window.scrollY}px`;
    }


    let twitchButton = document.querySelector(`[data-title="Twitch"]`);
    await fetch("https://gql.twitch.tv/gql", {
        headers: {
            "client-id": "kimne78kx3ncx6brgo4mv6wki5h1ko",
        },
        body: JSON.stringify({
            "operationName": "StreamRefetchManager",
            "variables": {
                "channel": "ktg5_"
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "ecdcb724b0559d49689e6a32795e6a43bba4b2071b5e762a4d1edf2bb42a6789"
                }
            }
        }),
        method: "POST"
    }).then(async rawData => {
        let data = await rawData.json();

        if (data.errors) resolve({ errors: data.errors });
        if (data.data.user.stream != null) twitchButton.classList.add('islive');
        else twitchButton.classList.remove('islive');
    });
});