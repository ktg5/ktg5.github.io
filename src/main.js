window.addEventListener('load', (event) => {
    
    let linkButtons = document.querySelectorAll('#links a');
    let hoverhint = document.querySelector('#hoverhint');

    linkButtons.forEach(button => {
        button.addEventListener('mouseover', (event) => {
            if (button.getAttribute('data-title')) {
                hoverhint.innerHTML = button.getAttribute('data-title');
                if (button.getAttribute('data-title-color')) hoverhint.style.color = button.getAttribute('data-title-color');
                else hoverhint.style.color = 'white';
                hoverhint.style.display = 'block';
            }
        });

        button.addEventListener('mouseout', (event) => {
            hoverhint.innerHTML = '';
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

});