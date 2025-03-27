function move() {
    var elem = document.getElementById("myBar");
    var textElem = document.querySelector(".progress-text");
    var width = 0; // set the initial width to 0%

    var id = setInterval(frame, 10);

    function frame() {
        if (width >= 100) {
            clearInterval(id);
        } else {
            width++;
            elem.style.width = width + '%';
            textElem.innerHTML = width + '%';
        }
    }
}

// Call the move function to start the progress
move();
