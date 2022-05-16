
//
// Is the element partially in the viewport?
//
// https://stackoverflow.com/a/26039199/25868
export function isElementPartiallyInViewport(el: HTMLElement, padding: number): boolean {
    const rect = el.getBoundingClientRect();
    const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
    //const windowWidth = (window.innerWidth || document.documentElement.clientWidth);  DON'T NEED HORIZ SCROLLING.

    // http://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap
    const vertInView = (rect.top - padding <= windowHeight) && ((rect.top + rect.height + padding) >= 0);
    // const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

    //return (vertInView && horInView);
    return vertInView;
}

//
// Is the the element fully in the view port.
//
// http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
// https://gomakethings.com/how-to-test-if-an-element-is-in-the-viewport-with-vanilla-javascript/
export function isElementInViewport(el: HTMLElement): boolean {
    var rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
