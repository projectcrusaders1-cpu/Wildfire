const siteNavbar = document.querySelector(".site-navbar");

if (siteNavbar) {
    let previousScrollY = window.scrollY;
    let lastDirection = 0;
    let distanceInDirection = 0;
    let isHidden = false;
    const scrollThreshold = 24;
    const navbarMotion = siteNavbar.animate(
        [
            { transform: "translateY(0)", opacity: 1 },
            { transform: "translateY(-100%)", opacity: 0 }
        ],
        {
            duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 400,
            easing: "ease-in-out",
            fill: "both"
        }
    );

    navbarMotion.pause();
    navbarMotion.currentTime = 0;

    const setNavbarHidden = (hidden) => {
        if (hidden === isHidden) {
            return;
        }

        isHidden = hidden;
        navbarMotion.playbackRate = hidden ? 1 : -1;
        navbarMotion.play();
    };

    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
        const scrollDifference = currentScrollY - previousScrollY;
        previousScrollY = currentScrollY;

        if (currentScrollY <= siteNavbar.offsetHeight) {
            distanceInDirection = 0;
            lastDirection = 0;
            setNavbarHidden(false);
            return;
        }

        const direction = Math.sign(scrollDifference);

        if (direction === 0) {
            return;
        }

        if (direction !== lastDirection) {
            lastDirection = direction;
            distanceInDirection = 0;
        }

        distanceInDirection += Math.abs(scrollDifference);

        if (distanceInDirection >= scrollThreshold) {
            setNavbarHidden(direction > 0);
            distanceInDirection = 0;
        }
    }, { passive: true });
}
